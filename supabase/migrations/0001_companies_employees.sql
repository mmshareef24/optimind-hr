-- Enable required extension for UUID generation (already enabled in most Supabase projects)
create extension if not exists pgcrypto;

-- Companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  company_code text not null,
  name_en text not null,
  name_ar text,
  cr_number text not null,
  tax_number text,
  gosi_number text,
  establishment_date date,
  industry text,
  address text,
  city text,
  phone text,
  email text,
  status text default 'active',
  created_at timestamptz not null default now()
);

create index if not exists companies_company_code_idx on public.companies (company_code);
create index if not exists companies_cr_number_idx on public.companies (cr_number);
create index if not exists companies_created_at_idx on public.companies (created_at desc);

-- Employees table
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  status text default 'active',
  department text,
  job_title text,
  hire_date date,
  manager_id uuid,
  company_id uuid references public.companies (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists employees_email_idx on public.employees (email);
create index if not exists employees_company_id_idx on public.employees (company_id);
create index if not exists employees_manager_id_idx on public.employees (manager_id);
create index if not exists employees_created_at_idx on public.employees (created_at desc);

-- Note on RLS:
-- For initial validation, you can keep RLS disabled. When ready, enable RLS and add policies
-- for the authenticated role to select/insert/update as appropriate.
-- Example (uncomment when you want to enable):
-- alter table public.companies enable row level security;
-- alter table public.employees enable row level security;
-- create policy "allow authenticated read companies" on public.companies
--   for select using (auth.role() = 'authenticated');
-- create policy "allow authenticated write companies" on public.companies
--   for insert with check (auth.role() = 'authenticated');
-- create policy "allow authenticated update companies" on public.companies
--   for update using (auth.role() = 'authenticated');
-- create policy "allow authenticated read employees" on public.employees
--   for select using (auth.role() = 'authenticated');
-- create policy "allow authenticated write employees" on public.employees
--   for insert with check (auth.role() = 'authenticated');
-- create policy "allow authenticated update employees" on public.employees
--   for update using (auth.role() = 'authenticated');