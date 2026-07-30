-- HR Module for al-yaqoot-gem
-- Run: supabase db reset --local

-- Employees
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  employee_no text unique not null,
  full_name text not null,
  role text,
  department text,
  employment_type text check (employment_type in ('full-time','part-time','contract')),
  hire_date date,
  phone text,
  email text,
  iqama_number text,
  iqama_expiry date,
  passport_expiry date,
  contract_end date,
  probation_end date,
  base_salary numeric(12,2) default 0,
  housing_allowance numeric(12,2) default 0,
  transport_allowance numeric(12,2) default 0,
  food_allowance numeric(12,2) default 0,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz default now()
);

-- Attendance
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  work_date date not null,
  clock_in time,
  clock_out time,
  status text check (status in ('present','absent','late','half-day','holiday')),
  overtime_hours numeric(4,2) default 0,
  notes text
);

-- Leave Requests
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  leave_type text check (leave_type in ('annual','sick','emergency','unpaid')),
  start_date date not null,
  end_date date not null,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  notes text,
  created_at timestamptz default now()
);

-- Payroll
create table if not exists payroll_months (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  month date not null,
  base_salary numeric(12,2),
  housing_allowance numeric(12,2),
  transport_allowance numeric(12,2),
  food_allowance numeric(12,2),
  absence_deduction numeric(12,2) default 0,
  late_deduction numeric(12,2) default 0,
  advance_deduction numeric(12,2) default 0,
  overtime_pay numeric(12,2) default 0,
  gosi_employee numeric(12,2) default 0,
  gosi_employer numeric(12,2) default 0,
  net_salary numeric(12,2),
  notes text
);

-- Performance Reviews
create table if not exists performance_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  review_month date not null,
  sales_target numeric(12,2),
  sales_actual numeric(12,2),
  kpi_score integer check (kpi_score between 1 and 5),
  manager_notes text
);

-- RLS Policies (basic security - adjust as needed)
alter table employees enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;
alter table payroll_months enable row level security;
alter table performance_reviews enable row level security;

create policy "Allow authenticated users full access to employees"
  on employees for all
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users full access to attendance"
  on attendance for all
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users full access to leave_requests"
  on leave_requests for all
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users full access to payroll_months"
  on payroll_months for all
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users full access to performance_reviews"
  on performance_reviews for all
  to authenticated
  using (true)
  with check (true);
