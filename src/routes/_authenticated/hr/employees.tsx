import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyRow, Field, FormFooter, Modal, Td, Th } from "@/components/erp-ui";
import {
  useEmployees,
  useDeleteEmployee,
  useSaveEmployee,
  calcGosi,
  type Employee,
  type EmploymentType,
} from "@/lib/hr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/employees")({
  head: () => ({ meta: [{ title: "Employees — Al Yaqoot HR" }] }),
  component: EmployeesPage,
});

const EMPLOYMENT_TYPES: EmploymentType[] = ["full-time", "part-time", "contract"];

function EmployeesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useEmployees();
  const remove = useDeleteEmployee();
  const [editing, setEditing] = useState<Partial<Employee> | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hr.employees")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("hr.employeesSubtitle")}</p>
          </div>
          <button
            onClick={() => setEditing({})}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury"
          >
            <Plus className="h-4 w-4" /> {t("hr.addEmployee")}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("hr.colEmployeeNo")}</Th>
                  <Th>{t("hr.colName")}</Th>
                  <Th>{t("hr.colDepartment")}</Th>
                  <Th>{t("hr.colRole")}</Th>
                  <Th>{t("hr.colType")}</Th>
                  <Th>{t("hr.colIqamaExpiry")}</Th>
                  <Th>{t("hr.colSalary")}</Th>
                  <Th>{t("inventory.colActions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && <EmptyRow colSpan={8} label={t("common.loading")} />}
                {!isLoading && (data ?? []).length === 0 && (
                  <EmptyRow colSpan={8} label={t("common.noRows")} />
                )}
                {(data ?? []).map((emp) => {
                  const iqamaExpiry = emp.iqama_expiry ? new Date(emp.iqama_expiry) : null;
                  const today = new Date();
                  const in60 = new Date(); in60.setDate(today.getDate() + 60);
                  const iqamaUrgent = iqamaExpiry && iqamaExpiry <= in60;
                  return (
                    <tr key={emp.id} className="hover:bg-secondary/30">
                      <Td className="font-mono text-xs text-muted-foreground">{emp.employee_no}</Td>
                      <Td className="font-medium">{emp.full_name}</Td>
                      <Td className="text-muted-foreground">{emp.department ?? "—"}</Td>
                      <Td className="text-muted-foreground">{emp.role ?? "—"}</Td>
                      <Td>
                        <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {emp.employment_type ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        <span className={iqamaUrgent ? "font-semibold text-destructive" : "text-muted-foreground"}>
                          {emp.iqama_expiry ?? "—"}
                          {iqamaUrgent && " ⚠️"}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">
                        {emp.base_salary.toLocaleString()} SAR
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditing(emp)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                          </button>
                          <button
                            onClick={() => { if (confirm(t("common.confirmDelete"))) remove.mutate(emp.id); }}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" /> {t("common.delete")}
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

      <EmployeeDialog value={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function EmployeeDialog({
  value,
  onClose,
}: {
  value: Partial<Employee> | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveEmployee();
  const [error, setError] = useState<string | null>(null);
  const [baseSalary, setBaseSalary] = useState(value?.base_salary ?? 0);
  const gosi = calcGosi(baseSalary);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const str = (k: string) => String(form.get(k) ?? "").trim() || null;
    const num = (k: string) => parseFloat(String(form.get(k) ?? "0")) || 0;
    setError(null);
    try {
      await save.mutateAsync({
        ...(value?.id ? { id: value.id } : {}),
        employee_no: String(form.get("employee_no") ?? "").trim(),
        full_name: String(form.get("full_name") ?? "").trim(),
        role: str("role"),
        department: str("department"),
        employment_type: (form.get("employment_type") as EmploymentType) ?? "full-time",
        hire_date: str("hire_date"),
        phone: str("phone"),
        email: str("email"),
        iqama_number: str("iqama_number"),
        iqama_expiry: str("iqama_expiry"),
        passport_number: str("passport_number"),
        passport_expiry: str("passport_expiry"),
        contract_end: str("contract_end"),
        probation_end: str("probation_end"),
        base_salary: num("base_salary"),
        housing_allowance: num("housing_allowance"),
        transport_allowance: num("transport_allowance"),
        food_allowance: num("food_allowance"),
        emergency_contact_name: str("emergency_contact_name"),
        emergency_contact_phone: str("emergency_contact_phone"),
        notes: str("notes"),
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
      title={value?.id ? t("hr.editEmployee") : t("hr.addEmployee")}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Identity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("hr.colEmployeeNo")}>
            <input name="employee_no" className="input" defaultValue={value?.employee_no ?? ""} required />
          </Field>
          <Field label={t("hr.colName")}>
            <input name="full_name" className="input" defaultValue={value?.full_name ?? ""} required />
          </Field>
          <Field label={t("hr.colRole")}>
            <input name="role" className="input" defaultValue={value?.role ?? ""} />
          </Field>
          <Field label={t("hr.colDepartment")}>
            <input name="department" className="input" defaultValue={value?.department ?? ""} />
          </Field>
          <Field label={t("hr.colType")}>
            <select name="employment_type" className="input" defaultValue={value?.employment_type ?? "full-time"}>
              {EMPLOYMENT_TYPES.map((et) => (
                <option key={et} value={et}>{t(`hr.empType_${et}`)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("hr.hireDate")}>
            <input name="hire_date" type="date" className="input" defaultValue={value?.hire_date ?? ""} />
          </Field>
          <Field label={t("hr.phone")}>
            <input name="phone" className="input" defaultValue={value?.phone ?? ""} />
          </Field>
          <Field label={t("hr.email")}>
            <input name="email" type="email" className="input" defaultValue={value?.email ?? ""} />
          </Field>
        </div>

        {/* Documents */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("hr.documents")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("hr.iqamaNumber")}>
            <input name="iqama_number" className="input" defaultValue={value?.iqama_number ?? ""} />
          </Field>
          <Field label={t("hr.iqamaExpiry")}>
            <input name="iqama_expiry" type="date" className="input" defaultValue={value?.iqama_expiry ?? ""} />
          </Field>
          <Field label={t("hr.passportNumber")}>
            <input name="passport_number" className="input" defaultValue={value?.passport_number ?? ""} />
          </Field>
          <Field label={t("hr.passportExpiry")}>
            <input name="passport_expiry" type="date" className="input" defaultValue={value?.passport_expiry ?? ""} />
          </Field>
          <Field label={t("hr.contractEnd")}>
            <input name="contract_end" type="date" className="input" defaultValue={value?.contract_end ?? ""} />
          </Field>
          <Field label={t("hr.probationEnd")}>
            <input name="probation_end" type="date" className="input" defaultValue={value?.probation_end ?? ""} />
          </Field>
        </div>

        {/* Salary */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("hr.salarySection")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("hr.baseSalary")}>
            <input
              name="base_salary"
              type="number"
              step="0.01"
              className="input"
              defaultValue={value?.base_salary ?? 0}
              onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
            />
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
        </div>

        {/* GOSI preview */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{t("hr.gosiPreview")}: </span>
          {t("hr.gosiEmployee")}: <span className="font-semibold text-foreground">{gosi.employee.toLocaleString()} SAR</span>
          {" · "}
          {t("hr.gosiEmployer")}: <span className="font-semibold text-foreground">{gosi.employer.toLocaleString()} SAR</span>
        </div>

        {/* Emergency Contact */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("hr.emergencyContact")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("hr.emergencyName")}>
            <input name="emergency_contact_name" className="input" defaultValue={value?.emergency_contact_name ?? ""} />
          </Field>
          <Field label={t("hr.emergencyPhone")}>
            <input name="emergency_contact_phone" className="input" defaultValue={value?.emergency_contact_phone ?? ""} />
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
