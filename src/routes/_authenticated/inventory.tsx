import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { calcTotalValue, fmt, purityFactor, useLiveGoldPrice } from "@/lib/gold";
import {
  SERVICE_STATUSES,
  useCustomers,
  useDeleteFinishedItem,
  useDeleteRawAsset,
  useFinishedItems,
  useRawAssets,
  useSaveFinishedItem,
  useSaveRawAsset,
  useUpdateServiceStatus,
  type FinishedItem,
  type ItemKind,
  type MetalType,
  type RawAsset,
  type ServiceStatus,
} from "@/lib/erp";
import { EmptyRow, Field, Modal, Td, Th } from "@/components/erp-ui";
import { Plus, Wrench, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Al Yaqoot Cloud ERP" },
      {
        name: "description",
        content: "Manage raw gold and silver stock, finished jewelry and workshop service jobs with live valuation.",
      },
      { property: "og:title", content: "Inventory — Al Yaqoot Cloud ERP" },
      { property: "og:description", content: "Dual-state inventory with live gold valuation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventoryPage,
});

const KARAT_OPTIONS = [24, 22, 21, 18, 14];

function InventoryPage() {
  const { t } = useTranslation();
  const { price } = useLiveGoldPrice();
  const [tab, setTab] = useState<"raw" | "finished">("raw");
  const [finishedKind, setFinishedKind] = useState<ItemKind>("Sellable");
  const [rawEditing, setRawEditing] = useState<Partial<RawAsset> | null>(null);
  const [itemEditing, setItemEditing] = useState<Partial<FinishedItem> | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("inventory.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("inventory.subtitle")} {fmt(price)}
              {t("inventory.subtitleSuffix")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRawEditing({ metal: "Gold", karat: 24, weight_g: 0 })}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
            >
              <Plus className="h-4 w-4" /> {t("inventory.addAsset")}
            </button>
            <button
              onClick={() => {
                setTab("finished");
                setFinishedKind("Service");
                setItemEditing({ kind: "Service", status: "Received", karat: 22, category: "Repair" });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-4 py-2 text-sm font-semibold text-primary hover:bg-accent"
            >
              <Wrench className="h-4 w-4" /> {t("inventory.startService")}
            </button>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["raw", "finished"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === tabKey
                  ? "bg-gradient-gold text-primary-foreground shadow-luxury"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabKey === "raw" ? t("inventory.rawAssets") : t("inventory.finishedStock")}
            </button>
          ))}
        </div>

        {tab === "raw" ? (
          <RawTable price={price} onEdit={setRawEditing} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-border bg-secondary/50 p-1 text-xs">
                {(["Sellable", "Service"] as ItemKind[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFinishedKind(k)}
                    className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
                      finishedKind === k
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k === "Sellable" ? t("inventory.sellableStock") : t("inventory.inService")}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setItemEditing({
                    kind: finishedKind,
                    karat: 22,
                    category: "Ring",
                    status: finishedKind === "Service" ? "Received" : null,
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" /> {t("inventory.addItem")}
              </button>
            </div>
            <FinishedTable price={price} kind={finishedKind} onEdit={setItemEditing} />
          </>
        )}
      </div>

      <RawAssetDialog value={rawEditing} onClose={() => setRawEditing(null)} />
      <FinishedItemDialog value={itemEditing} onClose={() => setItemEditing(null)} />
    </AppShell>
  );
}

/* --------------------------------- raw ---------------------------------- */

function RawTable({ price, onEdit }: { price: number; onEdit: (a: RawAsset) => void }) {
  const { t } = useTranslation();
  const { data, isLoading } = useRawAssets();
  const remove = useDeleteRawAsset();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>{t("inventory.colSku")}</Th>
              <Th>{t("inventory.colName")}</Th>
              <Th>{t("inventory.colMetal")}</Th>
              <Th>{t("inventory.colWeight")}</Th>
              <Th>{t("inventory.colPurity")}</Th>
              <Th>{t("inventory.colValue")}</Th>
              <Th>{t("inventory.colActions")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <EmptyRow colSpan={7} label={t("common.loading")} />}
            {!isLoading && (data ?? []).length === 0 && <EmptyRow colSpan={7} label={t("common.noRows")} />}
            {(data ?? []).map((a) => {
              const weight = Number(a.weight_g);
              const value =
                a.metal === "Gold" ? weight * price * purityFactor(a.karat) * 1.15 : weight * 0.9 * 1.15;
              return (
                <tr key={a.id} className="hover:bg-secondary/30">
                  <Td className="font-mono text-xs text-primary">{a.sku}</Td>
                  <Td className="font-medium">{a.name}</Td>
                  <Td>{a.metal}</Td>
                  <Td>{weight.toFixed(1)}</Td>
                  <Td>{a.karat}K</Td>
                  <Td className="font-semibold text-primary">{fmt(value)}</Td>
                  <Td>
                    <RowActions
                      onEdit={() => onEdit(a)}
                      onDelete={() => {
                        if (confirm(t("common.confirmDelete"))) remove.mutate(a.id);
                      }}
                    />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RawAssetDialog({ value, onClose }: { value: Partial<RawAsset> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const save = useSaveRawAsset();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        sku: String(form.get("sku") ?? "").trim(),
        name: String(form.get("name") ?? "").trim(),
        metal: form.get("metal") as MetalType,
        weight_g: Number(form.get("weight_g")),
        karat: Number(form.get("karat")),
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
      title={value?.id ? t("inventory.editAsset") : t("inventory.addAsset")}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("inventory.colSku")}>
            <input name="sku" className="input" defaultValue={value?.sku ?? ""} maxLength={40} required />
          </Field>
          <Field label={t("inventory.colName")}>
            <input name="name" className="input" defaultValue={value?.name ?? ""} maxLength={120} required />
          </Field>
          <Field label={t("inventory.colMetal")}>
            <select name="metal" className="input" defaultValue={value?.metal ?? "Gold"}>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </Field>
          <Field label={t("inventory.colWeight")}>
            <input
              name="weight_g"
              type="number"
              step="0.001"
              min="0"
              className="input"
              defaultValue={Number(value?.weight_g ?? 0)}
              required
            />
          </Field>
          <Field label={t("inventory.colPurity")}>
            <select name="karat" className="input" defaultValue={value?.karat ?? 24}>
              {KARAT_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}K
                </option>
              ))}
            </select>
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

/* ------------------------------- finished -------------------------------- */

function FinishedTable({
  price,
  kind,
  onEdit,
}: {
  price: number;
  kind: ItemKind;
  onEdit: (f: FinishedItem) => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useFinishedItems();
  const remove = useDeleteFinishedItem();
  const updateStatus = useUpdateServiceStatus();
  const rows = (data ?? []).filter((f) => f.kind === kind);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>{t("inventory.colSku")}</Th>
              <Th>{t("inventory.colName")}</Th>
              <Th>{t("inventory.colType")}</Th>
              <Th>{t("inventory.colWeight")}</Th>
              <Th>{t("inventory.colPurity")}</Th>
              <Th>{t("inventory.colValueVat")}</Th>
              <Th>{t("inventory.colStatus")}</Th>
              <Th>{t("inventory.colActions")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <EmptyRow colSpan={8} label={t("common.loading")} />}
            {!isLoading && rows.length === 0 && <EmptyRow colSpan={8} label={t("common.noRows")} />}
            {rows.map((f) => {
              const value = calcTotalValue({
                weightG: Number(f.weight_g),
                karat: f.karat,
                goldPrice: price,
                laborCost: Number(f.labor_cost),
                profit: Number(f.profit),
              });
              return (
                <tr key={f.id} className="hover:bg-secondary/30">
                  <Td className="font-mono text-xs text-primary">{f.sku}</Td>
                  <Td className="font-medium">{f.name}</Td>
                  <Td>{f.category}</Td>
                  <Td>{Number(f.weight_g).toFixed(1)}</Td>
                  <Td>{f.karat}K</Td>
                  <Td className="font-semibold text-primary">{fmt(value)}</Td>
                  <Td>
                    {f.kind === "Service" ? (
                      <select
                        value={f.status ?? "Received"}
                        onChange={(e) =>
                          updateStatus.mutate({ id: f.id, status: e.target.value as ServiceStatus })
                        }
                        className="input h-9 py-0 text-xs"
                      >
                        {SERVICE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t(`status.${s}`)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          f.sold
                            ? "border border-border bg-secondary text-muted-foreground"
                            : "border border-primary/30 bg-primary/10 text-primary"
                        }`}
                      >
                        {f.sold ? t("inventory.sold") : t("inventory.inStock")}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <RowActions
                      onEdit={() => onEdit(f)}
                      onDelete={() => {
                        if (confirm(t("common.confirmDelete"))) remove.mutate(f.id);
                      }}
                    />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinishedItemDialog({
  value,
  onClose,
}: {
  value: Partial<FinishedItem> | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveFinishedItem();
  const customers = useCustomers();
  const [kind, setKind] = useState<ItemKind>("Sellable");
  const [error, setError] = useState<string | null>(null);

  const currentKind = value?.kind ?? kind;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nextKind = form.get("kind") as ItemKind;
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        sku: String(form.get("sku") ?? "").trim(),
        name: String(form.get("name") ?? "").trim(),
        category: String(form.get("category") ?? "").trim() || "Ring",
        weight_g: Number(form.get("weight_g")),
        karat: Number(form.get("karat")),
        labor_cost: Number(form.get("labor_cost")),
        profit: Number(form.get("profit")),
        kind: nextKind,
        status: nextKind === "Service" ? (form.get("status") as ServiceStatus) : null,
        artisan: nextKind === "Service" ? String(form.get("artisan") ?? "").trim() || null : null,
        customer_id: String(form.get("customer_id") ?? "") || null,
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
      title={value?.id ? t("inventory.editItem") : t("inventory.addItem")}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("inventory.colSku")}>
            <input name="sku" className="input" defaultValue={value?.sku ?? ""} maxLength={40} required />
          </Field>
          <Field label={t("inventory.colName")}>
            <input name="name" className="input" defaultValue={value?.name ?? ""} maxLength={120} required />
          </Field>
          <Field label={t("inventory.colType")}>
            <input
              name="category"
              className="input"
              defaultValue={value?.category ?? "Ring"}
              maxLength={60}
            />
          </Field>
          <Field label={t("inventory.kind")}>
            <select
              name="kind"
              className="input"
              defaultValue={currentKind}
              onChange={(e) => setKind(e.target.value as ItemKind)}
            >
              <option value="Sellable">{t("inventory.sellableStock")}</option>
              <option value="Service">{t("inventory.inService")}</option>
            </select>
          </Field>
          <Field label={t("inventory.colWeight")}>
            <input
              name="weight_g"
              type="number"
              step="0.001"
              min="0"
              className="input"
              defaultValue={Number(value?.weight_g ?? 0)}
              required
            />
          </Field>
          <Field label={t("inventory.colPurity")}>
            <select name="karat" className="input" defaultValue={value?.karat ?? 22}>
              {KARAT_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}K
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sales.laborCost")}>
            <input
              name="labor_cost"
              type="number"
              step="0.01"
              min="0"
              className="input"
              defaultValue={Number(value?.labor_cost ?? 0)}
            />
          </Field>
          <Field label={t("sales.profitMargin")}>
            <input
              name="profit"
              type="number"
              step="0.01"
              min="0"
              className="input"
              defaultValue={Number(value?.profit ?? 0)}
            />
          </Field>
          <Field label={t("serviceSection.colStatus")}>
            <select name="status" className="input" defaultValue={value?.status ?? "Received"}>
              {SERVICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("serviceSection.colArtisan")}>
            <input name="artisan" className="input" defaultValue={value?.artisan ?? ""} maxLength={80} />
          </Field>
          <Field label={t("serviceSection.colCustomer")}>
            <select name="customer_id" className="input" defaultValue={value?.customer_id ?? ""}>
              <option value="">{t("common.none")}</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}

/* -------------------------------- shared --------------------------------- */

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3 w-3" /> {t("inventory.edit")}
      </button>
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3 w-3" /> {t("common.delete")}
      </button>
    </div>
  );
}

export function FormFooter({
  error,
  pending,
  onClose,
}: {
  error: string | null;
  pending: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.save")}
        </button>
      </div>
    </>
  );
}
