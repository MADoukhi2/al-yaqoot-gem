/**
 * ZATCA (Saudi Arabia) e-invoicing helpers.
 *
 * Phase 1 requires a Base64 encoded TLV (Tag-Length-Value) payload rendered as
 * a QR code on every invoice:
 *   Tag 1: Seller name
 *   Tag 2: Seller VAT registration number (15 digits)
 *   Tag 3: Invoice timestamp (ISO 8601 / ZULU)
 *   Tag 4: Invoice total (with VAT)
 *   Tag 5: VAT total
 *
 * Values are UTF-8 encoded so Arabic seller names scan correctly in the
 * official ZATCA VAT app.
 */

export const VAT_RATES = { Standard: 15, Zero: 0, Exempt: 0 } as const;
export type VatCategory = keyof typeof VAT_RATES;

/** Round to 2 decimals, avoiding float drift (e.g. 1.005 -> 1.01). */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function money(value: number): string {
  return round2(value).toFixed(2);
}

function tlv(tag: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  const out = new Uint8Array(2 + bytes.length);
  out[0] = tag;
  out[1] = bytes.length;
  out.set(bytes, 2);
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  if (typeof btoa === "function") return btoa(binary);
  // Node / SSR fallback
  return Buffer.from(bytes).toString("base64");
}

export type ZatcaQrInput = {
  sellerName: string;
  sellerVatNumber: string;
  /** ISO 8601 timestamp, e.g. 2026-07-28T10:15:00Z */
  timestamp: string;
  invoiceTotal: number;
  vatTotal: number;
};

/** Build the Base64 TLV payload that goes inside the ZATCA QR code. */
export function buildZatcaQrPayload(input: ZatcaQrInput): string {
  const parts = [
    tlv(1, input.sellerName),
    tlv(2, input.sellerVatNumber),
    tlv(3, new Date(input.timestamp).toISOString().replace(/\.\d{3}Z$/, "Z")),
    tlv(4, money(input.invoiceTotal)),
    tlv(5, money(input.vatTotal)),
  ];
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    merged.set(p, offset);
    offset += p.length;
  }
  return toBase64(merged);
}

/**
 * SHA-256 hash of the canonical invoice string, chained with the previous
 * invoice hash — the groundwork for Phase 2 (integration) cryptographic stamps.
 */
export async function computeInvoiceHash(
  canonical: string,
  previousHash: string | null,
): Promise<string> {
  const data = new TextEncoder().encode(`${previousHash ?? "0".repeat(64)}|${canonical}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64(new Uint8Array(digest));
}

export function canonicalInvoiceString(fields: {
  invoiceNo: string;
  sellerVatNumber: string;
  buyerVatNumber?: string | null;
  timestamp: string;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
}): string {
  return [
    fields.invoiceNo,
    fields.sellerVatNumber,
    fields.buyerVatNumber ?? "",
    new Date(fields.timestamp).toISOString(),
    money(fields.subtotal),
    money(fields.vatTotal),
    money(fields.grandTotal),
  ].join("|");
}

/** Saudi VAT numbers are 15 digits, starting and ending with 3. */
export function isValidVatNumber(vat: string): boolean {
  return /^3\d{13}3$/.test(vat.trim());
}

export type LineInput = {
  quantity: number;
  unitPrice: number;
  discount: number;
  vatCategory: VatCategory;
};

export function calcLine(line: LineInput) {
  const gross = round2(line.quantity * line.unitPrice);
  const discount = round2(Math.min(Math.max(line.discount, 0), gross));
  const net = round2(gross - discount);
  const rate = VAT_RATES[line.vatCategory];
  const vat = round2((net * rate) / 100);
  return { gross, discount, net, rate, vat, total: round2(net + vat) };
}

export function calcTotals(lines: LineInput[]) {
  let subtotal = 0;
  let discountTotal = 0;
  let vatTotal = 0;
  for (const line of lines) {
    const c = calcLine(line);
    subtotal = round2(subtotal + c.gross);
    discountTotal = round2(discountTotal + c.discount);
    vatTotal = round2(vatTotal + c.vat);
  }
  const net = round2(subtotal - discountTotal);
  return { subtotal, discountTotal, net, vatTotal, grandTotal: round2(net + vatTotal) };
}
