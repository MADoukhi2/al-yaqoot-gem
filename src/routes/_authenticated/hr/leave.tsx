import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import {
  useLeaveRequests,
  useSaveLeaveRequest,
  useUpdateLeaveStatus,
  useDeleteLeaveRequest,
  useEmployees,
  type LeaveRequest,
  type LeaveType,
  type LeaveStatus,
} from "@/lib/hr";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/leave")({
  head: () => ({ meta: [{ title: "Leave — Al Yaqoot HR" }] }),
  component: LeavePage,
});

const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "emergency", "unpaid"];

const STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  approved: "bg-primary/15 text-primary border border-primary/30",
  rejected: "bg-destructive/15 text-destructive border border-destructive/30",
};

const TYPE_STYLES: Record<LeaveType, string> = {
  annual: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  sick: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  emergency: "bg-destructive/10 text-destructive border border-destructive/20",
  unpaid: "bg-secondary text-muted-foreground border border-border",
};

function LeavePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useLeaveRequests();
  const updateStatus = useUpdateLeaveStatus();
  const remove = useDeleteLeaveRequest();
  const [editing, setEditing] = useState<Partial<LeaveRequest> | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hr.leave")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("hr.leaveSubtitle")}</p>
          </div>
          <button
            onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
          >
            <Plus className="h-4 w-4" /> {t("hr.newLeaveRequest")}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("hr.colName")}</Th>
                  <Th>{t("hr.leaveType")}</Th>
                  <Th>{t("hr.leaveFrom")}</Th>
                  <Th>{t("hr.leaveTo")}</Th>
                  <Th>{t("hr.leaveDays")}</Th>
                  <Th>{t("hr.leaveStatus")}</Th>
                  <Th>{t("inventory.colActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={7} label={t("common.loading")} />}
                {!isLoading && (data ?? []).length === 0 && (
                  <EmptyRow colSpan={7} label={t("common.noRows")} />
                )}
                {(data ?? []).map((req) => (
                  <tr key={req.id} className="hover:bg-secondary/30">
                    <Td className="font-medium">{(req as any).employees?.full_name ?? "—"}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_STYLES[req.leave_type]}`}>
                        {t(`hr.leaveType_${req.leave_type}`)}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground font-mono text-xs">{req.start_date}</Td>
                    <Td className="text-muted-foreground font-mono text-xs">{req.end_date}</Td>
                    <Td className="font-semibold">{req.days ?? "—"}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[req.status]}`}>
                        {t(`hr.leaveStatus_${req.status}`)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: req.id, status: "approved" })}
                              className="inline-flex items-center gap-1 rounded-md border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/10"
                            >
                              <CheckCircle2 className="h-3 w-3" /> {t("hr.approve")}
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ id: req.id, status: "rejected" })}
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-3 w-3" /> {t("hr.reject")}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditing(req)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { if (confirm(t("common.confirmDelete"))) remove.mutate(req.id); }}
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
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

      <LeaveDialog value={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function LeaveDialog({ value, onClose }: { value: Partial<LeaveRequest> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: employees } = useEmployees();
  const save = useSaveLeaveRequest();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        employee_id: String(form.get("employee_id")),
        leave_type: form.get("leave_type") as LeaveType,
        start_date: String(form.get("start_date")),
        end_date: String(form.get("end_date")),
        status: (form.get("status") as LeaveStatus) ?? "pending",
        notes: String(form.get("notes") ?? "").trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={value?.id ? t("hr.editLeave") : t("hr.newLeaveRequest")}>
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
          <Field label={t("hr.leaveType")}>
            <select name="leave_type" className="input" defaultValue={value?.leave_type ?? "annual"}>
              {LEAVE_TYPES.map((lt) => (
                <option key={lt} value={lt}>{t(`hr.leaveType_${lt}`)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("hr.leaveFrom")}>
            <input name="start_date" type="date" className="input" defaultValue={value?.start_date ?? ""} required />
          </Field>
          <Field label={t("hr.leaveTo")}>
            <input name="end_date" type="date" className="input" defaultValue={value?.end_date ?? ""} required />
          </Field>
          <Field label={t("hr.leaveStatus")}>
            <select name="status" className="input" defaultValue={value?.status ?? "pending"}>
              <option value="pending">{t("hr.leaveStatus_pending")}</option>
              <option value="approved">{t("hr.leaveStatus_approved")}</option>
              <option value="rejected">{t("hr.leaveStatus_rejected")}</option>
            </select>
          </Field>
        </div>
        <Field label={t("common.notes")}>
          <textarea name="notes" className="input min-h-[60px] resize-none" defaultValue={value?.notes ?? ""} />
        </Field>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}
