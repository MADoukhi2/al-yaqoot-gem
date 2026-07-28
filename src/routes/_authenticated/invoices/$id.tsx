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
          "Bilingual Arabic/English tax invoice with itemised lines, VAT breakdown and the ZATCA Phase 1 QR code, ready for A4 or thermal printing.",
      },
      { property: "og:title", content: "Tax Invoice — ZATCA QR & bilingual layout" },
      {
        property: "og:description",
        content: "Print-ready Saudi tax invoice with scannable ZATCA QR code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvoiceViewPage,
});

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
      ? "Tax Invoice / فاتورة ضريبية"
      : "Simplified Tax Invoice / فاتورة ضريبية مبسطة";

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
          <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-5">
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight">{title}</h1>
              <p className="mt-2 text-sm font-semibold">{company?.name_en}</p>
              <p className="text-sm" dir="rtl">
                {company?.name_ar}
              </p>
              <p className="mt-1 text-xs text-neutral-600">{company?.address_en}</p>
              <p className="text-xs text-neutral-600">
                VAT / الرقم الضريبي: {company?.vat_number ?? "—"}
              </p>
              <p className="text-xs text-neutral-600">CR / السجل التجاري: {company?.cr_number ?? "—"}</p>
            </div>
            <div className="text-end text-xs">
              <p className="text-sm font-bold">{invoice.invoice_no}</p>
              <p className="mt-1 text-neutral-600">
                {new Date(invoice.issue_date).toISOString().replace("T", " ").slice(0, 19)} UTC
              </p>
              <p className="mt-1 break-all text-[10px] text-neutral-500">UUID: {invoice.id}</p>
            </div>
          </header>

          <section className="grid gap-4 border-b border-neutral-300 py-4 text-xs sm:grid-cols-2">
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wide">Buyer / المشتري</p>
              <p className="text-sm">{invoice.buyer_name}</p>
              {invoice.buyer_vat_number && <p>VAT: {invoice.buyer_vat_number}</p>}
              {invoice.buyer_address && <p className="text-neutral-600">{invoice.buyer_address}</p>}
            </div>
            <div className="sm:text-end">
              <p className="mb-1 font-semibold uppercase tracking-wide">Type / النوع</p>
              <p className="text-sm">
                {invoice.invoice_type === "Standard" ? "B2B Standard" : "B2C Simplified"}
              </p>
              <p className="text-neutral-600">Status: {invoice.status}</p>
            </div>
          </section>

          <table className="mt-4 w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-300 text-start">
                <th className="py-2 text-start">Description / الوصف</th>
                <th className="py-2 text-end">Qty</th>
                <th className="py-2 text-end">Unit</th>
                <th className="py-2 text-end">Disc.</th>
                <th className="py-2 text-end">VAT</th>
                <th className="py-2 text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-end tabular-nums">{Number(item.quantity)}</td>
                  <td className="py-2 text-end tabular-nums">{money(Number(item.unit_price))}</td>
                  <td className="py-2 text-end tabular-nums">{money(Number(item.discount))}</td>
                  <td className="py-2 text-end tabular-nums">{money(Number(item.vat_amount))}</td>
                  <td className="py-2 text-end font-medium tabular-nums">
                    {money(Number(item.line_total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col items-center gap-2">
              {invoice.qr_payload && <ZatcaQr payload={invoice.qr_payload} size={150} />}
              <p className="text-[10px] text-neutral-500">ZATCA QR · رمز الاستجابة السريعة</p>
            </div>
            <dl className="ms-auto w-full max-w-xs space-y-1 text-xs">
              <Line label="Subtotal / المجموع" value={money(Number(invoice.subtotal))} />
              <Line label="Discount / الخصم" value={`- ${money(Number(invoice.discount_total))}`} />
              <Line
                label="Taxable / الخاضع للضريبة"
                value={money(Number(invoice.subtotal) - Number(invoice.discount_total))}
              />
              <Line label="VAT 15% / ضريبة القيمة المضافة" value={money(Number(invoice.vat_total))} />
              <div className="mt-2 border-t border-neutral-300 pt-2">
                <Line
                  label="Grand Total / الإجمالي"
                  value={`${money(Number(invoice.grand_total))} SAR`}
                  strong
                />
              </div>
            </dl>
          </section>

          {invoice.notes && <p className="mt-4 text-xs text-neutral-600">{invoice.notes}</p>}
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

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-bold" : "text-neutral-600"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-base font-bold" : ""}`}>{value}</dd>
    </div>
  );
}
