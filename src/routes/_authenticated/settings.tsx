import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import {
  useCompanyProfile,
  useDeleteProduct,
  useProducts,
  useSaveCompanyProfile,
  useSaveProduct,
  type Product,
} from "@/lib/invoicing";
import { isValidVatNumber, money, type VatCategory } from "@/lib/zatca";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Company & Catalogue Settings — E-Invoicing" },
      {
        name: "description",
        content:
          "Configure the seller company profile (CR, 15-digit VAT number, address) and the product/service catalogue used on tax invoices.",
      },
      { property: "og:title", content: "Company & Catalogue Settings — E-Invoicing" },
      {
        property: "og:description",
        content: "Seller identity and VAT categories powering ZATCA-compliant invoices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { data: company } = useCompanyProfile();
  const save = useSaveCompanyProfile();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const form = new FormData(e.currentTarget);
    const vat = String(form.get("vat_number") ?? "").trim();
    if (!isValidVatNumber(vat)) return setError(t("inv.errSellerVat"));
    try {
      await save.mutateAsync({
        ...(company?.id ? { id: company.id } : {}),
        name_en: String(form.get("name_en") ?? "").trim(),
        name_ar: String(form.get("name_ar") ?? "").trim(),
        cr_number: String(form.get("cr_number") ?? "").trim(),
        vat_number: vat,
        address_en: String(form.get("address_en") ?? "").trim(),
        address_ar: String(form.get("address_ar") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim() || null,
        email: String(form.get("email") ?? "").trim() || null,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <form
          key={company?.id ?? "new"}
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("settings.company")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("settings.nameEn")}>
              <input name="name_en" className="input" defaultValue={company?.name_en ?? ""} required />
            </Field>
            <Field label={t("settings.nameAr")}>
              <input name="name_ar" className="input" defaultValue={company?.name_ar ?? ""} />
            </Field>
            <Field label={t("settings.cr")}>
              <input name="cr_number" className="input" defaultValue={company?.cr_number ?? ""} />
            </Field>
            <Field label={t("settings.vat")}>
              <input
                name="vat_number"
                className="input"
                inputMode="numeric"
                maxLength={15}
                placeholder="3XXXXXXXXXXXXX3"
                defaultValue={company?.vat_number ?? ""}
                required
              />
            </Field>
            <Field label={t("settings.addressEn")}>
              <input name="address_en" className="input" defaultValue={company?.address_en ?? ""} />
            </Field>
            <Field label={t("settings.addressAr")}>
              <input name="address_ar" className="input" defaultValue={company?.address_ar ?? ""} />
            </Field>
            <Field label={t("customers.phone")}>
              <input name="phone" className="input" defaultValue={company?.phone ?? ""} />
            </Field>
            <Field label={t("customers.email")}>
              <input name="email" type="email" className="input" defaultValue={company?.email ?? ""} />
            </Field>
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {saved && <p className="text-xs text-primary">{t("settings.saved")}</p>}
          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </button>
        </form>

        <ProductsSection />
      </div>
    </AppShell>
  );
}

function ProductsSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts();
  const remove = useDeleteProduct();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("settings.catalogue")}
        </h2>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> {t("settings.addProduct")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>{t("settings.nameEn")}</Th>
                <Th>{t("settings.nameAr")}</Th>
                <Th>{t("inv.unitPrice")}</Th>
                <Th>{t("inv.vatCategory")}</Th>
                <Th>{t("inventory.colActions")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <EmptyRow colSpan={5} label={t("common.loading")} />}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <EmptyRow colSpan={5} label={t("common.noRows")} />
              )}
              {data?.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                  <Td>{p.name_en}</Td>
                  <Td className="text-muted-foreground">{p.name_ar}</Td>
                  <Td className="tabular-nums">{money(Number(p.unit_price))}</Td>
                  <Td className="text-muted-foreground">{t(`inv.vat${p.vat_category}`)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(p)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                        aria-label={t("inventory.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("common.confirmDelete"))) remove.mutate(p.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-destructive"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductDialog value={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

function ProductDialog({ value, onClose }: { value: Partial<Product> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const save = useSaveProduct();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        name_en: String(form.get("name_en") ?? "").trim(),
        name_ar: String(form.get("name_ar") ?? "").trim(),
        unit_price: Number(form.get("unit_price") ?? 0),
        vat_category: String(form.get("vat_category") ?? "Standard") as VatCategory,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal
      open={value !== null}
      onClose={onClose}
      title={value?.id ? t("settings.editProduct") : t("settings.addProduct")}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.nameEn")}>
            <input name="name_en" className="input" defaultValue={value?.name_en ?? ""} required />
          </Field>
          <Field label={t("settings.nameAr")}>
            <input name="name_ar" className="input" defaultValue={value?.name_ar ?? ""} />
          </Field>
          <Field label={t("inv.unitPrice")}>
            <input
              name="unit_price"
              type="number"
              min={0}
              step="0.01"
              className="input"
              defaultValue={Number(value?.unit_price ?? 0)}
            />
          </Field>
          <Field label={t("inv.vatCategory")}>
            <select
              name="vat_category"
              className="input"
              defaultValue={value?.vat_category ?? "Standard"}
            >
              <option value="Standard">{t("inv.vatStandard")}</option>
              <option value="Zero">{t("inv.vatZero")}</option>
              <option value="Exempt">{t("inv.vatExempt")}</option>
            </select>
          </Field>
        </div>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}
