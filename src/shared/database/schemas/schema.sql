-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- DROP EXISTING TABLES
drop table if exists settlements cascade;
drop table if exists splits cascade;
drop table if exists expenses cascade;
drop table if exists members cascade;
drop table if exists groups cascade;

-- GROUPS
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  currency text default 'USD',
  created_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MEMBERS
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- EXPENSES
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  paid_by uuid references auth.users(id) not null,
  amount numeric(10,2) not null,
  description text not null,
  category text default 'general',
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SPLITS
create table if not exists splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  amount_owed numeric(10,2) not null,
  group_id uuid references groups(id) on delete cascade not null
);

-- SETTLEMENTS
create table if not exists settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  payer_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  amount numeric(10,2) not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PUBLICATION FOR POWERSYNC
drop publication if exists powersync;
create publication powersync for table groups, members, expenses, splits, settlements;

-- RLS POLICIES
alter table groups enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;
alter table splits enable row level security;
alter table settlements enable row level security;

-- HELPER FUNCTION TO AVOID RECURSION
-- This function runs with security definer privileges to bypass RLS when checking membership
create or replace function get_user_group_ids(uid uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from members where user_id = uid;
$$;

-- POLICIES

-- GROUPS
-- Users can see groups they are members of (using the helper function)
drop policy if exists "Users can view groups they belong to" on groups;
create policy "Users can view groups they belong to" on groups
  for select using (
    id in (select get_user_group_ids(auth.uid()))
  );

drop policy if exists "Users can create groups" on groups;
create policy "Users can create groups" on groups
  for insert with check (auth.uid() = created_by);

-- MEMBERS
-- Members can view other members of their groups
drop policy if exists "Members can view other members" on members;
create policy "Members can view other members" on members
  for select using (
    group_id in (select get_user_group_ids(auth.uid()))
  );

-- Users can add themselves (join) or be added by existing members
drop policy if exists "Users can manage members" on members;
create policy "Users can manage members" on members
  for insert with check (
    -- User adding themselves
    auth.uid() = user_id
    OR
    -- Existing member adding someone else
    group_id in (select get_user_group_ids(auth.uid()))
  );

-- EXPENSES
drop policy if exists "Members can view expenses" on expenses;
create policy "Members can view expenses" on expenses
  for select using (
    group_id in (select get_user_group_ids(auth.uid()))
  );

drop policy if exists "Members can create expenses" on expenses;
create policy "Members can create expenses" on expenses
  for insert with check (
    group_id in (select get_user_group_ids(auth.uid()))
  );

-- SPLITS
drop policy if exists "Members can view splits" on splits;
create policy "Members can view splits" on splits
  for select using (
    exists (
      select 1 from expenses
      where expenses.id = splits.expense_id
      and expenses.group_id in (select get_user_group_ids(auth.uid()))
    )
  );

drop policy if exists "Members can create splits" on splits;
create policy "Members can create splits" on splits
  for insert with check (
    exists (
      select 1 from expenses
      where expenses.id = splits.expense_id
      and expenses.group_id in (select get_user_group_ids(auth.uid()))
    )
  );

-- SETTLEMENTS
drop policy if exists "Members can view settlements" on settlements;
create policy "Members can view settlements" on settlements
  for select using (
    group_id in (select get_user_group_ids(auth.uid()))
  );

drop policy if exists "Members can create settlements" on settlements;
create policy "Members can create settlements" on settlements
  for insert with check (
    group_id in (select get_user_group_ids(auth.uid()))
  );
