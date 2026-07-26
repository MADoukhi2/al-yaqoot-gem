import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import { useCustomers, useDeleteCustomer, useSaveCustomer, type Customer } from "@/lib/erp";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Al Yaqoot Cloud ERP" },
      {
        name: "description",
        content: "Customer records for retail buyers, bullion clients and workshop service jobs.",
      },
      { property: "og:title", content: "Customers — Al Yaqoot Cloud ERP" },
      { property: "og:description", content: "Manage the Al Yaqoot customer book." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCustomers();
  const remove = useDeleteCustomer();
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("customers.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("customers.subtitle")}</p>
          </div>
          <button
            onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
          >
            <Plus className="h-4 w-4" /> {t("customers.add")}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("customers.name")}</Th>
                  <Th>{t("customers.phone")}</Th>
                  <Th>{t("customers.email")}</Th>
                  <Th>{t("common.notes")}</Th>
                  <Th>{t("inventory.colActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={5} label={t("common.loading")} />}
                {!isLoading && (data ?? []).length === 0 && (
                  <EmptyRow colSpan={5} label={t("common.noRows")} />
                )}
                {(data ?? []).map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/30">
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="text-muted-foreground">{c.phone ?? "—"}</Td>
                    <Td className="text-muted-foreground">{c.email ?? "—"}</Td>
                    <Td className="text-muted-foreground">{c.notes ?? "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(c)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t("common.confirmDelete"))) remove.mutate(c.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" /> {t("common.delete")}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CustomerDialog value={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function CustomerDialog({ value, onClose }: { value: Partial<Customer> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const save = useSaveCustomer();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        name: String(form.get("name") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim() || null,
        email: String(form.get("email") ?? "").trim() || null,
        notes: String(form.get("notes") ?? "").trim() || null,
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
      title={value?.id ? t("customers.edit") : t("customers.add")}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("customers.name")}>
            <input name="name" className="input" defaultValue={value?.name ?? ""} maxLength={120} required />
          </Field>
          <Field label={t("customers.phone")}>
            <input name="phone" className="input" defaultValue={value?.phone ?? ""} maxLength={30} />
          </Field>
          <Field label={t("customers.email")}>
            <input
              name="email"
              type="email"
              className="input"
              defaultValue={value?.email ?? ""}
              maxLength={255}
            />
          </Field>
          <Field label={t("common.notes")}>
            <input name="notes" className="input" defaultValue={value?.notes ?? ""} maxLength={300} />
          </Field>
        </div>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}
