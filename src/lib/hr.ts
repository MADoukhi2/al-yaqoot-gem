import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type EmploymentType = "full-time" | "part-time" | "contract";
export type LeaveType = "annual" | "sick" | "emergency" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "absent" | "late" | "half-day" | "holiday";

export interface Employee {
  id: string;
  employee_no: string;
  full_name: string;
  role: string | null;
  department: string | null;
  employment_type: EmploymentType | null;
  hire_date: string | null;
  phone: string | null;
  email: string | null;
  iqama_number: string | null;
  iqama_expiry: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  contract_end: string | null;
  probation_end: string | null;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  food_allowance: number;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: AttendanceStatus;
  overtime_hours: number;
  notes: string | null;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number | null;
  status: LeaveStatus;
  notes: string | null;
  created_at: string;
  employees?: { full_name: string; employee_no: string } | null;
}

export interface PayrollMonth {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  food_allowance: number;
  overtime_pay: number;
  absence_deduction: number;
  late_deduction: number;
  advance_deduction: number;
  gosi_employee: number;
  gosi_employer: number;
  net_salary: number | null;
  notes: string | null;
  created_at: string;
  employees?: { full_name: string; employee_no: string } | null;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_month: string;
  sales_target: number | null;
  sales_actual: number | null;
  kpi_score: number | null;
  manager_notes: string | null;
  created_at: string;
  employees?: { full_name: string } | null;
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const hrQk = {
  employees: ["hr_employees"] as const,
  attendance: ["hr_attendance"] as const,
  leaves: ["hr_leave_requests"] as const,
  payroll: ["hr_payroll_months"] as const,
  performance: ["hr_performance_reviews"] as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

function useInvalidate(keys: readonly (readonly string[])[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
}

// ─── GOSI Calculator ─────────────────────────────────────────────────────────

export function calcGosi(baseSalary: number) {
  return {
    employee: parseFloat((baseSalary * 0.0975).toFixed(2)),
    employer: parseFloat((baseSalary * 0.1175).toFixed(2)),
  };
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

export function useEmployees() {
  return useQuery({
    queryKey: hrQk.employees,
    queryFn: async () =>
      unwrap(await supabase.from("employees").select("*").order("full_name")) as Employee[],
  });
}

export function useSaveEmployee() {
  const invalidate = useInvalidate([hrQk.employees]);
  return useMutation({
    mutationFn: async (input: Partial<Employee> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        return unwrap(await supabase.from("employees").update(rest).eq("id", id).select().single());
      }
      return unwrap(await supabase.from("employees").insert(rest).select().single());
    },
    onSuccess: invalidate,
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidate([hrQk.employees]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────

export function useAttendance(month?: string) {
  return useQuery({
    queryKey: [...hrQk.attendance, month],
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select("*, employees(full_name, employee_no)")
        .order("work_date", { ascending: false });
      if (month) {
        const start = `${month}-01`;
        const end = `${month}-31`;
        q = q.gte("work_date", start).lte("work_date", end);
      }
      return unwrap(await q) as (AttendanceRecord & { employees: { full_name: string; employee_no: string } | null })[];
    },
  });
}

export function useSaveAttendance() {
  const invalidate = useInvalidate([hrQk.attendance]);
  return useMutation({
    mutationFn: async (input: Partial<AttendanceRecord> & { id?: string }) =>
      unwrap(await supabase.from("attendance").upsert(input).select().single()),
    onSuccess: invalidate,
  });
}

export function useDeleteAttendance() {
  const invalidate = useInvalidate([hrQk.attendance]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// ─── LEAVE REQUESTS ──────────────────────────────────────────────────────────

export function useLeaveRequests() {
  return useQuery({
    queryKey: hrQk.leaves,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("leave_requests")
          .select("*, employees(full_name, employee_no)")
          .order("created_at", { ascending: false }),
      ) as LeaveRequest[],
  });
}

export function useSaveLeaveRequest() {
  const invalidate = useInvalidate([hrQk.leaves]);
  return useMutation({
    mutationFn: async (input: Partial<LeaveRequest> & { id?: string }) => {
      const { id, employees: _e, days: _d, created_at: _c, ...rest } = input;
      if (id) {
        return unwrap(await supabase.from("leave_requests").update(rest).eq("id", id).select().single());
      }
      return unwrap(await supabase.from("leave_requests").insert(rest).select().single());
    },
    onSuccess: invalidate,
  });
}

export function useUpdateLeaveStatus() {
  const invalidate = useInvalidate([hrQk.leaves]);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeaveStatus }) => {
      const { error } = await supabase.from("leave_requests").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteLeaveRequest() {
  const invalidate = useInvalidate([hrQk.leaves]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leave_requests").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// ─── PAYROLL ─────────────────────────────────────────────────────────────────

export function usePayrollMonths(month?: string) {
  return useQuery({
    queryKey: [...hrQk.payroll, month],
    queryFn: async () => {
      let q = supabase
        .from("payroll_months")
        .select("*, employees(full_name, employee_no)")
        .order("created_at", { ascending: false });
      if (month) q = q.eq("month", `${month}-01`);
      return unwrap(await q) as PayrollMonth[];
    },
  });
}

export function useSavePayroll() {
  const invalidate = useInvalidate([hrQk.payroll]);
  return useMutation({
    mutationFn: async (input: Partial<PayrollMonth> & { id?: string }) => {
      const { id, employees: _e, net_salary: _n, created_at: _c, ...rest } = input;
      if (id) {
        return unwrap(await supabase.from("payroll_months").update(rest).eq("id", id).select().single());
      }
      return unwrap(await supabase.from("payroll_months").insert(rest).select().single());
    },
    onSuccess: invalidate,
  });
}

export function useDeletePayroll() {
  const invalidate = useInvalidate([hrQk.payroll]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payroll_months").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────

export function usePerformanceReviews(month?: string) {
  return useQuery({
    queryKey: [...hrQk.performance, month],
    queryFn: async () => {
      let q = supabase
        .from("performance_reviews")
        .select("*, employees(full_name)")
        .order("review_month", { ascending: false });
      if (month) q = q.eq("review_month", `${month}-01`);
      return unwrap(await q) as PerformanceReview[];
    },
  });
}

export function useSavePerformanceReview() {
  const invalidate = useInvalidate([hrQk.performance]);
  return useMutation({
    mutationFn: async (input: Partial<PerformanceReview> & { id?: string }) => {
      const { id, employees: _e, created_at: _c, ...rest } = input;
      if (id) {
        return unwrap(await supabase.from("performance_reviews").update(rest).eq("id", id).select().single());
      }
      return unwrap(await supabase.from("performance_reviews").insert(rest).select().single());
    },
    onSuccess: invalidate,
  });
}

export function useDeletePerformanceReview() {
  const invalidate = useInvalidate([hrQk.performance]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("performance_reviews").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

// ─── COMPLIANCE ALERTS ────────────────────────────────────────────────────────

export function useComplianceAlerts() {
  return useQuery({
    queryKey: ["hr_compliance_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, employee_no, iqama_expiry, passport_expiry, contract_end, probation_end")
        .order("full_name");
      if (error) throw new Error(error.message);

      const today = new Date();
      const in60 = new Date();
      in60.setDate(today.getDate() + 60);

      const alerts: { id: string; employee: string; employee_no: string; type: string; date: string; urgency: "critical" | "warning" }[] = [];

      for (const emp of data ?? []) {
        const check = (dateStr: string | null, label: string) => {
          if (!dateStr) return;
          const d = new Date(dateStr);
          if (d <= in60) {
            alerts.push({
              id: emp.id + label,
              employee: emp.full_name,
              employee_no: emp.employee_no,
              type: label,
              date: dateStr,
              urgency: d <= today ? "critical" : "warning",
            });
          }
        };
        check(emp.iqama_expiry, "iqama");
        check(emp.passport_expiry, "passport");
        check(emp.contract_end, "contract");
        check(emp.probation_end, "probation");
      }

      return alerts.sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
