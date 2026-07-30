import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import {
  useAttendance,
  useSaveAttendance,
  useDeleteAttendance,
  useEmployees,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/lib/hr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Al Yaqoot HR" }] }),
  component: AttendancePage,
});

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-primary/15 text-primary border border-primary/30",
  absent: "bg-destructive/15 text-destructive border border-destructive/30",
  late: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  "half-day": "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  holiday: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
};

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "half-day", "holiday"];

function AttendancePage() {
  const { t } = useTranslation();
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const { data, isLoading } = useAttendance(month);
  const remove = useDeleteAttendance();
  const [editing, setEditing] = useState<Partial<AttendanceRecord> | null>(null);

  // Summary counts
  const summary = (data ?? []).reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hr.attendance")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("hr.attendanceSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input text-sm"
            />
            <button
              onClick={() => setEditing({})}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
            >
              <Plus className="h-4 w-4" /> {t("hr.logAttendance")}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <div key={s} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold">{summary[s] ?? 0}</div>
              <div className="mt-0.5 text-xs text-muted-foreground capitalize">{t(`hr.attStatus_${s}`)}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("hr.colDate")}</Th>
                  <Th>{t("hr.colName")}</Th>
                  <Th>{t("hr.colStatus")}</Th>
                  <Th>{t("hr.colClockIn")}</Th>
                  <Th>{t("hr.colClockOut")}</Th>
                  <Th>{t("hr.colOvertime")}</Th>
                  <Th>{t("inventory.colActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={7} label={t("common.loading")} />}
                {!isLoading && (data ?? []).length === 0 && (
                  <EmptyRow colSpan={7} label={t("common.noRows")} />
                )}
                {(data ?? []).map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/30">
                    <Td className="font-mono text-xs">{rec.work_date}</Td>
                    <Td className="font-medium">{(rec as any).employees?.full_name ?? "—"}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[rec.status]}`}>
                        {t(`hr.attStatus_${rec.status}`)}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">{rec.clock_in ?? "—"}</Td>
                    <Td className="text-muted-foreground">{rec.clock_out ?? "—"}</Td>
                    <Td className="text-muted-foreground">{rec.overtime_hours ? `${rec.overtime_hours}h` : "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(rec)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                        </button>
                        <button
                          onClick={() => { if (confirm(t("common.confirmDelete"))) remove.mutate(rec.id); }}
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

      <AttendanceDialog value={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function AttendanceDialog({ value, onClose }: { value: Partial<AttendanceRecord> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: employees } = useEmployees();
  const save = useSaveAttendance();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        employee_id: String(form.get("employee_id")),
        work_date: String(form.get("work_date")),
        status: form.get("status") as AttendanceStatus,
        clock_in: String(form.get("clock_in") ?? "").trim() || null,
        clock_out: String(form.get("clock_out") ?? "").trim() || null,
        overtime_hours: parseFloat(String(form.get("overtime_hours") ?? "0")) || 0,
        notes: String(form.get("notes") ?? "").trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={t("hr.logAttendance")}>
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
          <Field label={t("hr.colDate")}>
            <input name="work_date" type="date" className="input" defaultValue={value?.work_date ?? ""} required />
          </Field>
          <Field label={t("hr.colStatus")}>
            <select name="status" className="input" defaultValue={value?.status ?? "present"}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`hr.attStatus_${s}`)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("hr.colOvertime")}>
            <input name="overtime_hours" type="number" step="0.5" min="0" className="input" defaultValue={value?.overtime_hours ?? 0} />
          </Field>
          <Field label={t("hr.colClockIn")}>
            <input name="clock_in" type="time" className="input" defaultValue={value?.clock_in ?? ""} />
          </Field>
          <Field label={t("hr.colClockOut")}>
            <input name="clock_out" type="time" className="input" defaultValue={value?.clock_out ?? ""} />
          </Field>
        </div>
        <Field label={t("common.notes")}>
          <input name="notes" className="input" defaultValue={value?.notes ?? ""} />
        </Field>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}
