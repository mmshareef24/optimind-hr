-- User-to-company membership mapping to support company-scoped RLS

create table if not exists user_company_memberships (
  user_id uuid not null,
  company_id uuid not null references companies(id) on delete cascade,
  role text,
  created_at timestamp with time zone default now(),
  primary key (user_id, company_id)
);

-- Optional FK to auth.users (commented by default; enable if desired)
-- alter table user_company_memberships
--   add constraint user_company_memberships_user_fk
--   foreign key (user_id) references auth.users(id) on delete cascade;

create index if not exists idx_user_company_memberships_company on user_company_memberships(company_id);
create index if not exists idx_user_company_memberships_user on user_company_memberships(user_id);