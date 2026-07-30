-- ============================================================
-- HR MODULE — Al Yaqoot ERP
-- ============================================================

-- Employment type enum
create type employment_type as enum ('full-time', 'part-time', 'contract');

-- Leave type enum
create type leave_type as enum ('annual', 'sick', 'emergency', 'unpaid');

-- Leave status enum
create type leave_status as enum ('pending', 'approved', 'rejected');

-- Attendance status enum
create type attendance_status as enum ('present', 'absent', 'late', 'half-day', 'holiday');

-- --------------------------------------------------------
-- EMPLOYEES
-- --------------------------------------------------------
create table employees (
  id                    uuid primary key default gen_random_uuid(),
  employee_no           text unique not null,
  full_name             text not null,
  role                  text,
  department            text,
  employment_type       employment_type default 'full-time',
  hire_date             date,
  phone                 text,
  email                 text,
  iqama_number          text,
  iqama_expiry          date,
  passport_number       text,
  passport_expiry       date,
  contract_end          date,
  probation_end         date,
  base_salary           numeric(12,2) default 0,
  housing_allowance     numeric(12,2) default 0,
  transport_allowance   numeric(12,2) default 0,
  food_allowance        numeric(12,2) default 0,
  emergency_contact_name  text,
  emergency_contact_phone text,
  notes                 text,
  created_at            timestamptz default now()
);

alter table employees enable row level security;
create policy "authenticated can manage employees"
  on employees for all
  to authenticated
  using (true)
  with check (true);

-- --------------------------------------------------------
-- ATTENDANCE
-- --------------------------------------------------------
create table attendance (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid references employees(id) on delete cascade not null,
  work_date       date not null,
  clock_in        time,
  clock_out       time,
  status          attendance_status default 'present',
  overtime_hours  numeric(4,2) default 0,
  notes           text,
  unique (employee_id, work_date)
);

alter table attendance enable row level security;
create policy "authenticated can manage attendance"
  on attendance for all
  to authenticated
  using (true)
  with check (true);

-- --------------------------------------------------------
-- LEAVE REQUESTS
-- --------------------------------------------------------
create table leave_requests (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid references employees(id) on delete cascade not null,
  leave_type    leave_type not null,
  start_date    date not null,
  end_date      date not null,
  days          integer generated always as (end_date - start_date + 1) stored,
  status        leave_status default 'pending',
  notes         text,
  created_at    timestamptz default now()
);

alter table leave_requests enable row level security;
create policy "authenticated can manage leave_requests"
  on leave_requests for all
  to authenticated
  using (true)
  with check (true);

-- --------------------------------------------------------
-- PAYROLL MONTHS
-- --------------------------------------------------------
create table payroll_months (
  id                    uuid primary key default gen_random_uuid(),
  employee_id           uuid references employees(id) on delete cascade not null,
  month                 date not null,  -- first day of month
  base_salary           numeric(12,2) default 0,
  housing_allowance     numeric(12,2) default 0,
  transport_allowance   numeric(12,2) default 0,
  food_allowance        numeric(12,2) default 0,
  overtime_pay          numeric(12,2) default 0,
  absence_deduction     numeric(12,2) default 0,
  late_deduction        numeric(12,2) default 0,
  advance_deduction     numeric(12,2) default 0,
  gosi_employee         numeric(12,2) default 0,  -- 9.75% of base
  gosi_employer         numeric(12,2) default 0,  -- 11.75% of base
  net_salary            numeric(12,2) generated always as (
                          base_salary + housing_allowance + transport_allowance + food_allowance
                          + overtime_pay
                          - absence_deduction - late_deduction - advance_deduction - gosi_employee
                        ) stored,
  notes                 text,
  created_at            timestamptz default now(),
  unique (employee_id, month)
);

alter table payroll_months enable row level security;
create policy "authenticated can manage payroll_months"
  on payroll_months for all
  to authenticated
  using (true)
  with check (true);

-- --------------------------------------------------------
-- PERFORMANCE REVIEWS
-- --------------------------------------------------------
create table performance_reviews (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid references employees(id) on delete cascade not null,
  review_month    date not null,
  sales_target    numeric(12,2),
  sales_actual    numeric(12,2),
  kpi_score       integer check (kpi_score between 1 and 5),
  manager_notes   text,
  created_at      timestamptz default now(),
  unique (employee_id, review_month)
);

alter table performance_reviews enable row level security;
create policy "authenticated can manage performance_reviews"
  on performance_reviews for all
  to authenticated
  using (true)
  with check (true);

-- --------------------------------------------------------
-- SAUDI PUBLIC HOLIDAYS (seed data)
-- --------------------------------------------------------
create table public_holidays (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  date  date not null unique
);

alter table public_holidays enable row level security;
create policy "authenticated can read public_holidays"
  on public_holidays for select
  to authenticated
  using (true);

insert into public_holidays (name, date) values
  ('اليوم الوطني السعودي', '2026-09-23'),
  ('يوم التأسيس', '2027-02-22'),
  ('عيد الفطر 1', '2027-03-30'),
  ('عيد الفطر 2', '2027-03-31'),
  ('عيد الفطر 3', '2027-04-01'),
  ('عيد الأضحى 1', '2027-06-06'),
  ('عيد الأضحى 2', '2027-06-07'),
  ('عيد الأضحى 3', '2027-06-08');
