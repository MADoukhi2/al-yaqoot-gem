import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import {
  usePayrollMonths,
  useSavePayroll,
  useDeletePayroll,
  useEmployees,
  calcGosi,
  type PayrollMonth,
} from "@/lib/hr";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Al Yaqoot HR" }] }),
  component: PayrollPage,
});

function PayrollPage() {
  const { t } = useTranslation();
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const { data, isLoading } = usePayrollMonths(month);
  const remove = useDeletePayroll();
  const [editing, setEditing] = useState<Partial<PayrollMonth> | null>(null);
  const [slipFor, setSlipFor] = useState<PayrollMonth | null>(null);

  const totalNet = (data ?? []).reduce((s, r) => s + (r.net_salary ?? 0), 0);
  const totalGosi = (data ?? []).reduce((s, r) => s + r.gosi_employer, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hr.payroll")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("hr.payrollSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input text-sm" />
            <button
              onClick={() => setEditing({})}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
            >
              <Plus className="h-4 w-4" /> {t("hr.addPayroll")}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("hr.totalNetPayroll")}</div>
            <div className="mt-1 text-2xl font-bold">{totalNet.toLocaleString()} SAR</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("hr.totalGosiEmployer")}</div>
            <div className="mt-1 text-2xl font-bold">{totalGosi.toLocaleString()} SAR</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("hr.headcount")}</div>
            <div className="mt-1 text-2xl font-bold">{(data ?? []).length}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("hr.colName")}</Th>
                  <Th>{t("hr.baseSalary")}</Th>
                  <Th>{t("hr.allowances")}</Th>
                  <Th>{t("hr.deductions")}</Th>
                  <Th>{t("hr.gosiEmployee")}</Th>
                  <Th>{t("hr.netSalary")}</Th>
                  <Th>{t("inventory.colActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={7} label={t("common.loading")} />}
                {!isLoading && (data ?? []).length === 0 && (
                  <EmptyRow colSpan={7} label={t("common.noRows")} />
                )}
                {(data ?? []).map((row) => {
                  const allowances = row.housing_allowance + row.transport_allowance + row.food_allowance + row.overtime_pay;
                  const deductions = row.absence_deduction + row.late_deduction + row.advance_deduction;
                  return (
                    <tr key={row.id} className="hover:bg-secondary/30">
                      <Td className="font-medium">{(row as any).employees?.full_name ?? "—"}</Td>
                      <Td className="text-muted-foreground">{row.base_salary.toLocaleString()}</Td>
                      <Td className="text-primary">{allowances.toLocaleString()}</Td>
                      <Td className="text-destructive">{deductions > 0 ? `-${deductions.toLocaleString()}` : "—"}</Td>
                      <Td className="text-muted-foreground">{row.gosi_employee.toLocaleString()}</Td>
                      <Td className="font-bold">{(row.net_salary ?? 0).toLocaleString()} SAR</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSlipFor(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/10"
                          >
                            <FileText className="h-3 w-3" /> {t("hr.payslip")}
                          </button>
                          <button
                            onClick={() => setEditing(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                          </button>
                          <button
                            onClick={() => { if (confirm(t("common.confirmDelete"))) remove.mutate(row.id); }}
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

      <PayrollDialog value={editing} onClose={() => setEditing(null)} />
      <PayslipModal row={slipFor} onClose={() => setSlipFor(null)} />
    </AppShell>
  );
}

function PayrollDialog({ value, onClose }: { value: Partial<PayrollMonth> | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: employees } = useEmployees();
  const save = useSavePayroll();
  const [error, setError] = useState<string | null>(null);
  const [base, setBase] = useState(value?.base_salary ?? 0);
  const gosi = calcGosi(base);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const num = (k: string) => parseFloat(String(form.get(k) ?? "0")) || 0;
    const baseSalary = num("base_salary");
    const g = calcGosi(baseSalary);
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        employee_id: String(form.get("employee_id")),
        month: `${form.get("month")}-01`,
        base_salary: baseSalary,
        housing_allowance: num("housing_allowance"),
        transport_allowance: num("transport_allowance"),
        food_allowance: num("food_allowance"),
        overtime_pay: num("overtime_pay"),
        absence_deduction: num("absence_deduction"),
        late_deduction: num("late_deduction"),
        advance_deduction: num("advance_deduction"),
        gosi_employee: g.employee,
        gosi_employer: g.employer,
        notes: String(form.get("notes") ?? "").trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={value !== null} onClose={onClose} title={value?.id ? t("hr.editPayroll") : t("hr.addPayroll")}>
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
          <Field label={t("hr.payrollMonth")}>
            <input name="month" type="month" className="input" defaultValue={value?.month?.slice(0, 7) ?? ""} required />
          </Field>
          <Field label={t("hr.baseSalary")}>
            <input name="base_salary" type="number" step="0.01" className="input"
              defaultValue={value?.base_salary ?? 0}
              onChange={(e) => setBase(parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label={t("hr.housingAllowance")}>
            <input name="housing_allowance" type="number" step="0.01" className="input" defaultValue={value?.housing_allowance ?? 0} />
          </Field>
          <Field label={t("hr.transportAllowance")}>
            <input name="transport_allowance" type="number" step="0.01" className="input" defaultValue={value?.transport_allowance ?? 0} />
          </Field>
          <Field label={t("hr.foodAllowance")}>
            <input name="food_allowance" type="number" step="0.01" className="input" defaultValue={value?.food_allowance ?? 0} />
          </Field>
          <Field label={t("hr.overtimePay")}>
            <input name="overtime_pay" type="number" step="0.01" className="input" defaultValue={value?.overtime_pay ?? 0} />
          </Field>
          <Field label={t("hr.absenceDeduction")}>
            <input name="absence_deduction" type="number" step="0.01" className="input" defaultValue={value?.absence_deduction ?? 0} />
          </Field>
          <Field label={t("hr.lateDeduction")}>
            <input name="late_deduction" type="number" step="0.01" className="input" defaultValue={value?.late_deduction ?? 0} />
          </Field>
          <Field label={t("hr.advanceDeduction")}>
            <input name="advance_deduction" type="number" step="0.01" className="input" defaultValue={value?.advance_deduction ?? 0} />
          </Field>
        </div>
        {/* GOSI auto-calc preview */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{t("hr.gosiPreview")}: </span>
          {t("hr.gosiEmployee")}: <span className="font-semibold text-foreground">{gosi.employee.toLocaleString()} SAR</span>
          {" · "}
          {t("hr.gosiEmployer")}: <span className="font-semibold text-foreground">{gosi.employer.toLocaleString()} SAR</span>
        </div>
        <Field label={t("common.notes")}>
          <input name="notes" className="input" defaultValue={value?.notes ?? ""} />
        </Field>
        <FormFooter error={error} pending={save.isPending} onClose={onClose} />
      </form>
    </Modal>
  );
}

function PayslipModal({ row, onClose }: { row: PayrollMonth | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!row) return null;
  const allowances = row.housing_allowance + row.transport_allowance + row.food_allowance + row.overtime_pay;
  const deductions = row.absence_deduction + row.late_deduction + row.advance_deduction + row.gosi_employee;
  const gross = row.base_salary + allowances;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-luxury print:shadow-none">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("hr.payslipTitle")}</h2>
            <p className="text-xs text-muted-foreground">{row.month?.slice(0, 7)}</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">{t("common.cancel")}</button>
        </div>
        <div className="mb-3 rounded-lg bg-secondary/50 px-4 py-3">
          <div className="font-semibold">{(row as any).employees?.full_name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{(row as any).employees?.employee_no}</div>
        </div>
        {[
          { label: t("hr.baseSalary"), value: row.base_salary, positive: true },
          { label: t("hr.housingAllowance"), value: row.housing_allowance, positive: true },
          { label: t("hr.transportAllowance"), value: row.transport_allowance, positive: true },
          { label: t("hr.foodAllowance"), value: row.food_allowance, positive: true },
          { label: t("hr.overtimePay"), value: row.overtime_pay, positive: true },
          { label: t("hr.absenceDeduction"), value: row.absence_deduction, positive: false },
          { label: t("hr.lateDeduction"), value: row.late_deduction, positive: false },
          { label: t("hr.advanceDeduction"), value: row.advance_deduction, positive: false },
          { label: t("hr.gosiEmployee") + " (9.75%)", value: row.gosi_employee, positive: false },
        ].map(({ label, value, positive }) =>
          value ? (
            <div key={label} className="flex justify-between border-b border-border/50 py-1.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className={positive ? "text-foreground" : "text-destructive"}>
                {positive ? "+" : "-"}{value.toLocaleString()} SAR
              </span>
            </div>
          ) : null
        )}
        <div className="mt-3 flex justify-between rounded-lg bg-primary/10 px-4 py-3 font-bold">
          <span>{t("hr.netSalary")}</span>
          <span className="text-primary">{(row.net_salary ?? 0).toLocaleString()} SAR</span>
        </div>
        <button
          onClick={() => window.print()}
          className="mt-4 w-full rounded-lg bg-gradient-gold py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
        >
          {t("hr.printPayslip")}
        </button>
      </div>
    </div>
  );
}
