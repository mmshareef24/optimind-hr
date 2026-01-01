-- Company-scoped RLS policies for companies, employees, departments, positions
-- Policies are inert until RLS is enabled on each table.

-- Helper: membership existence for a given company
-- We use EXISTS against user_company_memberships with auth.uid()

-- Companies
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'company members can select companies'
  ) then
    create policy "company members can select companies" on companies
      for select using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = companies.id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'company members can update companies'
  ) then
    create policy "company members can update companies" on companies
      for update using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = companies.id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'company members can insert companies'
  ) then
    create policy "company members can insert companies" on companies
      for insert with check (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = companies.id and m.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Employees
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employees' and policyname = 'company members can select employees'
  ) then
    create policy "company members can select employees" on employees
      for select using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = employees.company_id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employees' and policyname = 'company members can update employees'
  ) then
    create policy "company members can update employees" on employees
      for update using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = employees.company_id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employees' and policyname = 'company members can insert employees'
  ) then
    create policy "company members can insert employees" on employees
      for insert with check (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = employees.company_id and m.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Departments
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'departments' and policyname = 'company members can select departments'
  ) then
    create policy "company members can select departments" on departments
      for select using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = departments.company_id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'departments' and policyname = 'company members can update departments'
  ) then
    create policy "company members can update departments" on departments
      for update using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = departments.company_id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'departments' and policyname = 'company members can insert departments'
  ) then
    create policy "company members can insert departments" on departments
      for insert with check (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = departments.company_id and m.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Positions
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'positions' and policyname = 'company members can select positions'
  ) then
    create policy "company members can select positions" on positions
      for select using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = positions.company_id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'positions' and policyname = 'company members can update positions'
  ) then
    create policy "company members can update positions" on positions
      for update using (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = positions.company_id and m.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'positions' and policyname = 'company members can insert positions'
  ) then
    create policy "company members can insert positions" on positions
      for insert with check (
        exists (
          select 1 from user_company_memberships m
          where m.company_id = positions.company_id and m.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- To activate policies, enable RLS on tables:
--   alter table companies enable row level security;
--   alter table employees enable row level security;
--   alter table departments enable row level security;
--   alter table positions enable row level security;