import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Field, Modal, FormFooter } from "@/components/erp-ui";
import { useCustomers, useSaveCustomer } from "@/lib/erp";
import {
  useCompanyProfile,
  useIssueInvoice,
  useProducts,
  type DraftLine,
} from "@/lib/invoicing";
import { calcLine, calcTotals, money, isValidVatNumber, type VatCategory } from "@/lib/zatca";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({
    meta: [
      { title: "New Tax Invoice — ZATCA e-invoicing" },
      {
        name: "description",
        content:
          "Create a ZATCA-compliant tax invoice: pick a client, add line items with per-line discounts and live 15% VAT calculation.",
      },
      { property: "og:title", content: "New Tax Invoice — ZATCA e-invoicing" },
      {
        property: "og:description",
        content: "Dynamic invoice generator with real-time VAT and grand total calculation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewInvoicePage,
});

const emptyLine = (): DraftLine => ({
  product_id: null,
  description: "",
  quantity: 1,
  unit_price: 0,
  discount: 0,
  vat_category: "Standard",
});

function toLineInput(l: DraftLine) {
  return {
    quantity: l.quantity,
    unitPrice: l.unit_price,
    discount: l.discount,
    vatCategory: l.vat_category,
  };
}

function NewInvoicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: company } = useCompanyProfile();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const issue = useIssueInvoice();

  const [invoiceType, setInvoiceType] = useState<"Simplified" | "Standard">("Simplified");
  const [customerId, setCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerVat, setBuyerVat] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [newClient, setNewClient] = useState(false);

  const totals = useMemo(() => calcTotals(lines.map(toLineInput)), [lines]);

  function selectCustomer(id: string) {
    setCustomerId(id);
    const c = customers?.find((x) => x.id === id);
    if (c) {
      setBuyerName(c.name);
      setBuyerVat(c.vat_number ?? "");
      setBuyerAddress(c.address ?? "");
    }
  }

  function patch(index: number, changes: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...changes } : l)));
  }

  function applyProduct(index: number, productId: string) {
    const p = products?.find((x) => x.id === productId);
    if (!p) {
      patch(index, { product_id: null });
      return;
    }
    patch(index, {
      product_id: p.id,
      description: p.name_en || p.name_ar,
      unit_price: Number(p.unit_price),
      vat_category: p.vat_category as VatCategory,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (invoiceType === "Standard") {
      if (!buyerName.trim()) return setError(t("inv.errBuyerName"));
      if (!isValidVatNumber(buyerVat)) return setError(t("inv.errBuyerVat"));
    }
    try {
      const inv = await issue.mutateAsync({
        input: {
          invoice_type: invoiceType,
          customer_id: customerId || null,
          buyer_name: buyerName.trim() || t("inv.walkIn"),
          buyer_vat_number: buyerVat.trim() || null,
          buyer_address: buyerAddress.trim() || null,
          notes: notes.trim() || null,
          lines,
        },
        company: company ?? null,
      });
      navigate({ to: "/invoices/$id", params: { id: inv.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AppShell>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("inv.newTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("inv.newSubtitle")}</p>
        </div>

        {!company?.vat_number && (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            {t("inv.noCompany")}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            {/* Header block */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex gap-2">
                {(["Simplified", "Standard"] as const).map((ty) => (
                  <button
                    key={ty}
                    type="button"
                    onClick={() => setInvoiceType(ty)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      invoiceType === ty
                        ? "bg-gradient-gold text-primary-foreground shadow-luxury"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {ty === "Simplified" ? t("inv.simplified") : t("inv.standard")}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("inv.client")}>
                  <div className="flex gap-2">
                    <select
                      className="input"
                      value={customerId}
                      onChange={(e) => selectCustomer(e.target.value)}
                    >
                      <option value="">{t("inv.walkIn")}</option>
                      {customers?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setNewClient(true)}
                      className="grid h-[2.65rem] w-11 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                      aria-label={t("customers.add")}
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                </Field>
                <Field label={t("inv.buyerName")}>
                  <input
                    className="input"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    maxLength={160}
                  />
                </Field>
                {invoiceType === "Standard" && (
                  <>
                    <Field label={t("inv.buyerVat")}>
                      <input
                        className="input"
                        value={buyerVat}
                        onChange={(e) => setBuyerVat(e.target.value)}
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="3XXXXXXXXXXXXX3"
                      />
                    </Field>
                    <Field label={t("inv.buyerAddress")}>
                      <input
                        className="input"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        maxLength={240}
                      />
                    </Field>
                  </>
                )}
              </div>
            </section>

            {/* Lines */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("inv.lineItems")}
                </h2>
                <button
                  type="button"
                  onClick={() => setLines((p) => [...p, emptyLine()])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> {t("inv.addLine")}
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, i) => {
                  const c = calcLine(toLineInput(line));
                  return (
                    <div
                      key={i}
                      className="grid gap-3 rounded-xl border border-border/70 bg-secondary/30 p-3 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-12">
                        <div className="flex gap-2">
                          <select
                            className="input max-w-[12rem]"
                            value={line.product_id ?? ""}
                            onChange={(e) => applyProduct(i, e.target.value)}
                          >
                            <option value="">{t("inv.customItem")}</option>
                            {products?.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name_en || p.name_ar}
                              </option>
                            ))}
                          </select>
                          <input
                            className="input"
                            placeholder={t("inv.description")}
                            value={line.description}
                            onChange={(e) => patch(i, { description: e.target.value })}
                            maxLength={200}
                          />
                          <button
                            type="button"
                            onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                            className="grid h-[2.65rem] w-11 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive"
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label={t("inv.qty")}>
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            className="input"
                            value={line.quantity}
                            onChange={(e) => patch(i, { quantity: Number(e.target.value) })}
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-3">
                        <Field label={t("inv.unitPrice")}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="input"
                            value={line.unit_price}
                            onChange={(e) => patch(i, { unit_price: Number(e.target.value) })}
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label={t("inv.discount")}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="input"
                            value={line.discount}
                            onChange={(e) => patch(i, { discount: Number(e.target.value) })}
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-3">
                        <Field label={t("inv.vatCategory")}>
                          <select
                            className="input"
                            value={line.vat_category}
                            onChange={(e) =>
                              patch(i, { vat_category: e.target.value as VatCategory })
                            }
                          >
                            <option value="Standard">{t("inv.vatStandard")}</option>
                            <option value="Zero">{t("inv.vatZero")}</option>
                            <option value="Exempt">{t("inv.vatExempt")}</option>
                          </select>
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label={t("inv.lineTotal")}>
                          <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold tabular-nums">
                            {money(c.total)}
                          </div>
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <Field label={t("common.notes")}>
                <input
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={300}
                />
              </Field>
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("inv.summary")}
            </h2>
            <Row label={t("sales.subtotal")} value={money(totals.subtotal)} />
            <Row label={t("inv.discountTotal")} value={`- ${money(totals.discountTotal)}`} />
            <Row label={t("inv.taxable")} value={money(totals.net)} />
            <Row label={t("sales.vat")} value={money(totals.vatTotal)} />
            <div className="border-t border-border pt-3">
              <Row
                label={t("inv.grandTotal")}
                value={`${money(totals.grandTotal)} SAR`}
                strong
              />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={issue.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
            >
              {issue.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("inv.issue")}
            </button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("inv.issueHint")}</p>
          </aside>
        </div>
      </form>

      <NewClientDialog
        open={newClient}
        onClose={() => setNewClient(false)}
        onCreated={(id) => {
          setNewClient(false);
          selectCustomer(id);
        }}
      />
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${strong ? "font-display text-lg font-bold" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function NewClientDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const save = useSaveCustomer();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const vat = String(form.get("vat_number") ?? "").trim();
    if (vat && !isValidVatNumber(vat)) return setError(t("inv.errBuyerVat"));
    try {
      const created = await save.mutateAsync({
        name: String(form.get("name") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim() || null,
        email: String(form.get("email") ?? "").trim() || null,
        address: String(form.get("address") ?? "").trim() || null,
        vat_number: vat || null,
      });
      onCreated(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("customers.add")}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("customers.name")}>
            <input name="name" className="input" required maxLength={120} />
          </Field>
          <Field label={t("customers.phone")}>
            <input name="phone" className="input" maxLength={30} />
          </Field>
          <Field label={t("customers.email")}>
            <input name="email" type="email" className="input" maxLength={255} />
          </Field>
          <Field label={t("inv.buyerVat")}>
            <input name="vat_number" className="input" maxLength={15} inputMode="numeric" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("inv.buyerAddress")}>
              <input name="address" className="input" maxLength={240} />
            </Field>
          </div>
        </div>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}
