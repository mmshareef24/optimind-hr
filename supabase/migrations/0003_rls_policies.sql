-- Base RLS policies for core tables (companies, employees)
-- These policies are inert until RLS is enabled on each table.

-- Companies policies
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'allow select for authenticated'
  ) then
    create policy "allow select for authenticated" on companies
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'allow insert for authenticated'
  ) then
    create policy "allow insert for authenticated" on companies
      for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'allow update for authenticated'
  ) then
    create policy "allow update for authenticated" on companies
      for update using (auth.role() = 'authenticated');
  end if;
end $$;

-- Employees policies
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employees' and policyname = 'allow select for authenticated'
  ) then
    create policy "allow select for authenticated" on employees
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employees' and policyname = 'allow insert for authenticated'
  ) then
    create policy "allow insert for authenticated" on employees
      for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'employees' and policyname = 'allow update for authenticated'
  ) then
    create policy "allow update for authenticated" on employees
      for update using (auth.role() = 'authenticated');
  end if;
end $$;

-- Note: To activate these, run:
--   alter table companies enable row level security;
--   alter table employees enable row level security;