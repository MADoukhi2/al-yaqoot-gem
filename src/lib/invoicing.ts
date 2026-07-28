import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  buildZatcaQrPayload,
  calcLine,
  calcTotals,
  canonicalInvoiceString,
  computeInvoiceHash,
  type VatCategory,
} from "@/lib/zatca";

export type CompanyProfile = Tables<"company_profile">;
export type Product = Tables<"products">;
export type Invoice = Tables<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type InvoiceWithItems = Invoice & { invoice_items: InvoiceItem[] };

export const ik = {
  company: ["company_profile"] as const,
  products: ["products"] as const,
  invoices: ["invoices"] as const,
};

function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

/* ------------------------------ company -------------------------------- */

export function useCompanyProfile() {
  return useQuery({
    queryKey: ik.company,
    queryFn: async () =>
      (unwrap(await supabase.from("company_profile").select("*").limit(1)) as CompanyProfile[])[0] ??
      null,
  });
}

export function useSaveCompanyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"company_profile"> & { id?: string }) =>
      unwrap(await supabase.from("company_profile").upsert(input).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ik.company }),
  });
}

/* ------------------------------ products -------------------------------- */

export function useProducts() {
  return useQuery({
    queryKey: ik.products,
    queryFn: async () =>
      unwrap(await supabase.from("products").select("*").order("name_en")) as Product[],
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"products"> & { id?: string }) =>
      unwrap(await supabase.from("products").upsert(input).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ik.products }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ik.products }),
  });
}

/* ------------------------------ invoices -------------------------------- */

export function useInvoices() {
  return useQuery({
    queryKey: ik.invoices,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("invoices")
          .select("*, invoice_items(*)")
          .order("issue_date", { ascending: false }),
      ) as InvoiceWithItems[],
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [...ik.invoices, id],
    queryFn: async () =>
      unwrap(
        await supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).single(),
      ) as InvoiceWithItems,
  });
}

export type DraftLine = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_category: VatCategory;
};

function toLineInput(l: DraftLine) {
  return {
    quantity: l.quantity,
    unitPrice: l.unit_price,
    discount: l.discount,
    vatCategory: l.vat_category,
  };
}

export type NewInvoice = {
  invoice_type: "Simplified" | "Standard";
  customer_id: string | null;
  buyer_name: string;
  buyer_vat_number: string | null;
  buyer_address: string | null;
  notes: string | null;
  lines: DraftLine[];
};

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      company,
    }: {
      input: NewInvoice;
      company: CompanyProfile | null;
    }) => {
      if (!company?.vat_number) {
        throw new Error("Set the company VAT number in Settings before issuing invoices.");
      }
      const lines = input.lines.filter((l) => l.description.trim().length > 0);
      if (lines.length === 0) throw new Error("Add at least one line item.");

      const totals = calcTotals(lines.map(toLineInput));
      const issuedAt = new Date().toISOString();

      // Chain from the most recent issued invoice hash (Phase 2 groundwork).
      const previous = unwrap(
        await supabase
          .from("invoices")
          .select("invoice_hash")
          .eq("status", "Issued")
          .order("issue_date", { ascending: false })
          .limit(1),
      ) as { invoice_hash: string | null }[];
      const previousHash = previous[0]?.invoice_hash ?? null;

      const draft = unwrap(
        await supabase
          .from("invoices")
          .insert({
            invoice_type: input.invoice_type,
            status: "Draft",
            customer_id: input.customer_id,
            buyer_name: input.buyer_name || "Walk-in customer",
            buyer_vat_number: input.buyer_vat_number,
            buyer_address: input.buyer_address,
            issue_date: issuedAt,
            subtotal: totals.subtotal,
            discount_total: totals.discountTotal,
            vat_total: totals.vatTotal,
            grand_total: totals.grandTotal,
            notes: input.notes,
            previous_hash: previousHash,
          })
          .select()
          .single(),
      );

      const { error: itemsError } = await supabase.from("invoice_items").insert(
        lines.map((l) => {
          const c = calcLine(toLineInput(l));
          return {
            invoice_id: draft.id,
            product_id: l.product_id,
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount: c.discount,
            vat_category: l.vat_category,
            vat_rate: c.rate,
            net_total: c.net,
            vat_amount: c.vat,
            line_total: c.total,
          };
        }),
      );
      if (itemsError) throw new Error(itemsError.message);

      const sellerName = company.name_en || company.name_ar || "Seller";
      const qrPayload = buildZatcaQrPayload({
        sellerName,
        sellerVatNumber: company.vat_number,
        timestamp: issuedAt,
        invoiceTotal: totals.grandTotal,
        vatTotal: totals.vatTotal,
      });
      const invoiceHash = await computeInvoiceHash(
        canonicalInvoiceString({
          invoiceNo: draft.invoice_no,
          sellerVatNumber: company.vat_number,
          buyerVatNumber: input.buyer_vat_number,
          timestamp: issuedAt,
          subtotal: totals.subtotal,
          vatTotal: totals.vatTotal,
          grandTotal: totals.grandTotal,
        }),
        previousHash,
      );

      // Sealing the invoice: after this update the row becomes immutable.
      const issued = unwrap(
        await supabase
          .from("invoices")
          .update({ status: "Issued", qr_payload: qrPayload, invoice_hash: invoiceHash })
          .eq("id", draft.id)
          .select()
          .single(),
      );
      return issued;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ik.invoices }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").update({ status: "Cancelled" }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ik.invoices }),
  });
}
