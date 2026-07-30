import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ZatcaQr } from "@/components/ZatcaQr";
import { useCompanyProfile, useInvoice } from "@/lib/invoicing";
import { money } from "@/lib/zatca";
import { ArrowLeft, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({
    meta: [
      { title: "Tax Invoice — ZATCA QR & bilingual layout" },
      {
        name: "description",
        content:
          "Bilingual Arabic/English tax invoice with jewelry details (karat, weight, making charge), VAT breakdown and the ZATCA Phase 1 QR code.",
      },
      { property: "og:title", content: "Tax Invoice — ZATCA QR & bilingual layout" },
      {
        property: "og:description",
        content: "Print-ready Saudi jewelry tax invoice with scannable ZATCA QR code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvoiceViewPage,
});

/** Inline print logo — no external dependency */
function PrintLogo() {
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,2 36,12 36,28 20,38 4,28 4,12" fill="#0f1e3d" stroke="#c9a84c" strokeWidth="1.5" />
      <polygon points="20,2 36,12 20,16 4,12" fill="#1a3060" />
      <polygon points="4,12 20,16 4,28" fill="#162a55" />
      <polygon points="36,12 20,16 36,28" fill="#0d1e45" />
      <polygon points="4,28 20,16 36,28 20,38" fill="#1a3060" />
      <polygon points="20,16 23,20 20,24 17,20" fill="#c9a84c" opacity="0.9" />
      <line x1="20" y1="2" x2="20" y2="7" stroke="#e8c96e" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

function InvoiceViewPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: company } = useCompanyProfile();

  if (isLoading || !invoice) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </AppShell>
    );
  }

  const title =
    invoice.invoice_type === "Standard"
      ? "Tax Invoice / \u0641\u0627\u062a\u0648\u0631\u0629 \u0636\u0631\u064a\u0628\u064a\u0629"
      : "Simplified Tax Invoice / \u0641\u0627\u062a\u0648\u0631\u0629 \u0636\u0631\u064a\u0628\u064a\u0629 \u0645\u0628\u0633\u0637\u0629";

  /** Check whether any line has jewelry metadata */
  const hasJewelryData = invoice.invoice_items.some(
    (it) => (it as any).karat || (it as any).weight_g,
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("inv.backToList")}
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury"
          >
            <Printer className="h-4 w-4" /> {t("inv.print")}
          </button>
        </div>

        <article
          dir="ltr"
          className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-white p-8 text-black shadow-card print:border-0 print:shadow-none"
        >
          {/* ====== HEADER ====== */}
          <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-5">
            <div className="flex items-start gap-3">
              <PrintLogo />
              <div>
                <h1 className="text-lg font-bold uppercase tracking-tight">{title}</h1>
                <p className="mt-2 text-sm font-semibold">{company?.name_en}</p>
                <p className="text-sm" dir="rtl">{company?.name_ar}</p>
                <p className="mt-1 text-xs text-neutral-600">{company?.address_en}</p>
                <p className="text-xs text-neutral-600">
                  VAT / \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a: {company?.vat_number ?? "\u2014"}
                </p>
                <p className="text-xs text-neutral-600">
                  CR / \u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u064a: {company?.cr_number ?? "\u2014"}
                </p>
              </div>
            </div>
            <div className="text-end text-xs">
              <p className="text-sm font-bold">{invoice.invoice_no}</p>
              <p className="mt-1 text-neutral-600">
                {new Date(invoice.issue_date).toISOString().replace("T", " ").slice(0, 19)} UTC
              </p>
              <p className="mt-1 break-all text-[10px] text-neutral-500">UUID: {invoice.id}</p>
            </div>
          </header>

          {/* ====== BUYER ====== */}
          <section className="grid gap-4 border-b border-neutral-300 py-4 text-xs sm:grid-cols-2">
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wide">
                Buyer / \u0627\u0644\u0645\u0634\u062a\u0631\u064a
              </p>
              <p className="text-sm">{invoice.buyer_name}</p>
              {invoice.buyer_vat_number && <p>VAT: {invoice.buyer_vat_number}</p>}
              {invoice.buyer_address && (
                <p className="text-neutral-600">{invoice.buyer_address}</p>
              )}
            </div>
            <div className="sm:text-end">
              <p className="mb-1 font-semibold uppercase tracking-wide">
                Type / \u0627\u0644\u0646\u0648\u0639
              </p>
              <p className="text-sm">
                {invoice.invoice_type === "Standard" ? "B2B Standard" : "B2C Simplified"}
              </p>
              <p className="text-neutral-600">Status: {invoice.status}</p>
            </div>
          </section>

          {/* ====== LINE ITEMS ====== */}
          <table className="mt-4 w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-300 text-start">
                <th className="py-2 text-start">Description / \u0627\u0644\u0648\u0635\u0641</th>
                {hasJewelryData && (
                  <>
                    <th className="py-2 text-end">{t("inv.colKarat")}</th>
                    <th className="py-2 text-end">{t("inv.colWeight")}</th>
                    <th className="py-2 text-end">{t("inv.colMaking")}</th>
                  </>
                )}
                <th className="py-2 text-end">Qty</th>
                <th className="py-2 text-end">Unit SAR</th>
                <th className="py-2 text-end">Disc.</th>
                <th className="py-2 text-end">VAT</th>
                <th className="py-2 text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items.map((item) => {
                const it = item as typeof item & {
                  karat?: number;
                  weight_g?: number;
                  making_charge?: number;
                };
                return (
                  <tr key={it.id} className="border-b border-neutral-200">
                    <td className="py-2">{it.description}</td>
                    {hasJewelryData && (
                      <>
                        <td className="py-2 text-end tabular-nums">
                          {it.karat ? `${it.karat}K` : "\u2014"}
                        </td>
                        <td className="py-2 text-end tabular-nums">
                          {it.weight_g != null ? `${Number(it.weight_g).toFixed(3)} g` : "\u2014"}
                        </td>
                        <td className="py-2 text-end tabular-nums">
                          {it.making_charge != null ? money(Number(it.making_charge)) : "\u2014"}
                        </td>
                      </>
                    )}
                    <td className="py-2 text-end tabular-nums">{Number(it.quantity)}</td>
                    <td className="py-2 text-end tabular-nums">{money(Number(it.unit_price))}</td>
                    <td className="py-2 text-end tabular-nums">{money(Number(it.discount))}</td>
                    <td className="py-2 text-end tabular-nums">{money(Number(it.vat_amount))}</td>
                    <td className="py-2 text-end font-medium tabular-nums">
                      {money(Number(it.line_total))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ====== TOTALS + QR ====== */}
          <section className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col items-center gap-2">
              {invoice.qr_payload && <ZatcaQr payload={invoice.qr_payload} size={150} />}
              <p className="text-[10px] text-neutral-500">
                ZATCA QR \u00b7 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629 \u0627\u0644\u0633\u0631\u064a\u0639\u0629
              </p>
            </div>
            <dl className="ms-auto w-full max-w-xs space-y-1 text-xs">
              <InvLine
                label="Subtotal / \u0627\u0644\u0645\u062c\u0645\u0648\u0639"
                value={money(Number(invoice.subtotal))}
              />
              <InvLine
                label="Discount / \u0627\u0644\u062e\u0635\u0645"
                value={`- ${money(Number(invoice.discount_total))}`}
              />
              <InvLine
                label="Taxable / \u0627\u0644\u062e\u0627\u0636\u0639 \u0644\u0644\u0636\u0631\u064a\u0628\u0629"
                value={money(Number(invoice.subtotal) - Number(invoice.discount_total))}
              />
              <InvLine
                label="VAT 15% / \u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629"
                value={money(Number(invoice.vat_total))}
              />
              <div className="mt-2 border-t border-neutral-300 pt-2">
                <InvLine
                  label="Grand Total / \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a"
                  value={`${money(Number(invoice.grand_total))} SAR`}
                  strong
                />
              </div>
            </dl>
          </section>

          {invoice.notes && (
            <p className="mt-4 text-xs text-neutral-600">{invoice.notes}</p>
          )}
          {invoice.invoice_hash && (
            <p className="mt-4 break-all border-t border-neutral-200 pt-3 text-[9px] text-neutral-400">
              Hash: {invoice.invoice_hash}
            </p>
          )}
        </article>
      </div>
    </AppShell>
  );
}

function InvLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-bold" : "text-neutral-600"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-base font-bold" : ""}`}>{value}</dd>
    </div>
  );
}
