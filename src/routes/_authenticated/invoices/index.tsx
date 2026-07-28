import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Td, Th } from "@/components/erp-ui";
import { useInvoices, type InvoiceWithItems } from "@/lib/invoicing";
import { money } from "@/lib/zatca";
import { FileText, Plus, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({
    meta: [
      { title: "E-Invoices — ZATCA compliant billing" },
      {
        name: "description",
        content:
          "Issue, search and archive Saudi ZATCA-compliant tax invoices with QR codes, VAT totals and bilingual layouts.",
      },
      { property: "og:title", content: "E-Invoices — ZATCA compliant billing" },
      {
        property: "og:description",
        content: "Total sales, VAT collected and the full history of issued tax invoices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvoicesPage,
});

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function InvoicesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useInvoices();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [buyer, setBuyer] = useState("");
  const [type, setType] = useState<"" | "Simplified" | "Standard">("");

  const invoices: InvoiceWithItems[] = data ?? [];

  const filtered = useMemo(
    () =>
      invoices.filter((inv) => {
        if (type && inv.invoice_type !== type) return false;
        if (buyer && !inv.buyer_name.toLowerCase().includes(buyer.toLowerCase())) return false;
        const d = inv.issue_date.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }),
    [invoices, type, buyer, from, to],
  );

  const issued = filtered.filter((i) => i.status === "Issued");
  const totalSales = issued.reduce((s, i) => s + Number(i.grand_total), 0);
  const totalVat = issued.reduce((s, i) => s + Number(i.vat_total), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{t("inv.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("inv.subtitle")}</p>
          </div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury"
          >
            <Plus className="h-4 w-4" /> {t("inv.new")}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label={t("inv.totalSales")}
            value={`${money(totalSales)} SAR`}
            hint={`${issued.length} ${t("inv.issuedInvoices")}`}
            icon={Wallet}
          />
          <Stat
            label={t("inv.totalVat")}
            value={`${money(totalVat)} SAR`}
            hint={t("inv.vatHint")}
            icon={Receipt}
          />
          <Stat
            label={t("inv.count")}
            value={String(filtered.length)}
            hint={t("inv.countHint")}
            icon={FileText}
          />
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("inv.filterFrom")}
            </span>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("inv.filterTo")}
            </span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("inv.filterClient")}
            </span>
            <input
              className="input"
              value={buyer}
              placeholder={t("inv.filterClient")}
              onChange={(e) => setBuyer(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("inv.filterType")}
            </span>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="">{t("inv.allTypes")}</option>
              <option value="Simplified">{t("inv.simplified")}</option>
              <option value="Standard">{t("inv.standard")}</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("inv.colNo")}</Th>
                  <Th>{t("inv.colDate")}</Th>
                  <Th>{t("inv.colBuyer")}</Th>
                  <Th>{t("inv.colType")}</Th>
                  <Th>{t("inv.colVat")}</Th>
                  <Th>{t("inv.colTotal")}</Th>
                  <Th>{t("inventory.colStatus")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={7} label={t("common.loading")} />}
                {!isLoading && filtered.length === 0 && (
                  <EmptyRow colSpan={7} label={t("common.noRows")} />
                )}
                {filtered.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-secondary/40">
                    <Td>
                      <Link
                        to="/invoices/$id"
                        params={{ id: inv.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {inv.invoice_no}
                      </Link>
                    </Td>
                    <Td className="text-muted-foreground">{inv.issue_date.slice(0, 10)}</Td>
                    <Td>{inv.buyer_name}</Td>
                    <Td className="text-muted-foreground">
                      {inv.invoice_type === "Standard" ? t("inv.standard") : t("inv.simplified")}
                    </Td>
                    <Td>{money(Number(inv.vat_total))}</Td>
                    <Td className="font-semibold">{money(Number(inv.grand_total))}</Td>
                    <Td>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          inv.status === "Issued"
                            ? "border border-primary/30 bg-primary/15 text-primary"
                            : inv.status === "Cancelled"
                              ? "border border-destructive/30 bg-destructive/10 text-destructive"
                              : "border border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        {t(`inv.status.${inv.status}`)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
