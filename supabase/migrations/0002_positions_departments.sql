-- Positions and Departments tables for Optimind HR
-- Safe to run multiple times if tables already exist (use IF NOT EXISTS)

-- Departments
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  code text,
  name text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_departments_company_id on departments(company_id);
create index if not exists idx_departments_created_at on departments(created_at);

-- Positions
create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  position_code text,
  position_title text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_positions_company_id on positions(company_id);
create index if not exists idx_positions_department_id on positions(department_id);
create index if not exists idx_positions_created_at on positions(created_at);

-- Optional RLS enablement (keep disabled until policies are ready)
-- alter table departments enable row level security;
-- alter table positions enable row level security;

-- Example policies (apply after enabling RLS)
-- Allow authenticated users to read departments/positions
-- create policy "allow select for authenticated" on departments
--   for select using (auth.role() = 'authenticated');
-- create policy "allow select for authenticated" on positions
--   for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update departments
-- create policy "allow insert for authenticated" on departments
--   for insert with check (auth.role() = 'authenticated');
-- create policy "allow update for authenticated" on departments
--   for update using (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update positions
-- create policy "allow insert for authenticated" on positions
--   for insert with check (auth.role() = 'authenticated');
-- create policy "allow update for authenticated" on positions
--   for update using (auth.role() = 'authenticated');