import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import {
  usePerformanceReviews,
  useSavePerformanceReview,
  useDeletePerformanceReview,
  useEmployees,
  type PerformanceReview,
} from "@/lib/hr";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/performance")({
  head: () => ({ meta: [{ title: "Performance — Al Yaqoot HR" }] }),
  component: PerformancePage,
});

const KPI_COLORS = ["", "text-destructive", "text-amber-400", "text-amber-300", "text-primary", "text-primary"];

function PerformancePage() {
  const { t } = useTranslation();
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const { data, isLoading } = usePerformanceReviews(month);
  const remove = useDeletePerformanceReview();
  const [editing, setEditing] = useState<Partial<PerformanceReview> | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hr.performance")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("hr.performanceSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input text-sm" />
            <button
              onClick={() => setEditing({})}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
            >
              <Plus className="h-4 w-4" /> {t("hr.addReview")}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("hr.colName")}</Th>
                  <Th>{t("hr.salesTarget")}</Th>
                  <Th>{t("hr.salesActual")}</Th>
                  <Th>{t("hr.achievement")}</Th>
                  <Th>{t("hr.kpiScore")}</Th>
                  <Th>{t("hr.managerNotes")}</Th>
                  <Th>{t("inventory.colActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={7} label={t("common.loading")} />}
                {!isLoading && (data ?? []).length === 0 && (
                  <EmptyRow colSpan={7} label={t("common.noRows")} />
                )}
                {(data ?? []).map((rev) => {
                  const pct = rev.sales_target && rev.sales_actual
                    ? Math.round((rev.sales_actual / rev.sales_target) * 100)
                    : null;
                  return (
                    <tr key={rev.id} className="hover:bg-secondary/30">
                      <Td className="font-medium">{(rev as any).employees?.full_name ?? "—"}</Td>
                      <Td className="text-muted-foreground">{rev.sales_target?.toLocaleString() ?? "—"}</Td>
                      <Td className="text-muted-foreground">{rev.sales_actual?.toLocaleString() ?? "—"}</Td>
                      <Td>
                        {pct !== null ? (
                          <span className={`font-semibold ${pct >= 100 ? "text-primary" : pct >= 75 ? "text-amber-300" : "text-destructive"}`}>
                            {pct}%
                          </span>
                        ) : "—"}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${s <= (rev.kpi_score ?? 0) ? "fill-primary text-primary" : "text-border"}`}
                            />
                          ))}
                        </div>
                      </Td>
                      <Td className="max-w-[180px] truncate text-muted-foreground">{rev.manager_notes ?? "—"}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditing(rev)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                          </button>
                          <button
                            onClick={() => { if (confirm(t("common.confirmDelete"))) remove.mutate(rev.id); }}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ReviewDialog value={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function ReviewDialog({ value, onClose }: { value: Partial<PerformanceReview> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: employees } = useEmployees();
  const save = useSavePerformanceReview();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const num = (k: string) => { const v = parseFloat(String(form.get(k) ?? "")); return isNaN(v) ? null : v; };
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        employee_id: String(form.get("employee_id")),
        review_month: `${form.get("review_month")}-01`,
        sales_target: num("sales_target"),
        sales_actual: num("sales_actual"),
        kpi_score: num("kpi_score"),
        manager_notes: String(form.get("manager_notes") ?? "").trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={value?.id ? t("hr.editReview") : t("hr.addReview")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("hr.colName")}>
            <select name="employee_id" className="input" defaultValue={value?.employee_id ?? ""} required>
              <option value="">—</option>
              {(employees ?? []).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label={t("hr.reviewMonth")}>
            <input name="review_month" type="month" className="input" defaultValue={value?.review_month?.slice(0, 7) ?? ""} required />
          </Field>
          <Field label={t("hr.salesTarget")}>
            <input name="sales_target" type="number" step="0.01" className="input" defaultValue={value?.sales_target ?? ""} />
          </Field>
          <Field label={t("hr.salesActual")}>
            <input name="sales_actual" type="number" step="0.01" className="input" defaultValue={value?.sales_actual ?? ""} />
          </Field>
          <Field label={`${t("hr.kpiScore")} (1–5)`}>
            <input name="kpi_score" type="number" min="1" max="5" className="input" defaultValue={value?.kpi_score ?? ""} />
          </Field>
        </div>
        <Field label={t("hr.managerNotes")}>
          <textarea name="manager_notes" className="input min-h-[80px] resize-none" defaultValue={value?.manager_notes ?? ""} />
        </Field>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}
