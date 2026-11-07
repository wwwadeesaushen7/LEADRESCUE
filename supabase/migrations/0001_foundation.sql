-- Phase 1. Apply once with the Supabase SQL editor or `supabase db push`.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 100),
  created_at timestamptz not null default now()
);
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 100),
  industry text not null check (industry in ('Plumbing','Electrical services','Cleaning services','Auto repair','HVAC','Landscaping','Other businesses')),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email text not null check (length(email) between 3 and 254),
  location text not null check (length(location) between 2 and 200),
  timezone text not null,
  website text not null default '' check (website = '' or website ~ '^https?://'),
  description text not null default '' check (length(description) <= 1000),
  created_at timestamptz not null default now()
);
create table public.memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (business_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id);
create table public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  opens time not null default '09:00', closes time not null default '17:00',
  working_days integer[] not null default array[1,2,3,4,5] check (cardinality(working_days) between 1 and 7 and working_days <@ array[0,1,2,3,4,5,6]),
  recovery_mode text not null default 'both' check (recovery_mode in ('both','sms','whatsapp')),
  automatic_recovery boolean not null default false check (automatic_recovery = false),
  -- Removed only when messaging permissions, sender verification and jobs are implemented.
  check (opens < closes)
);
create table public.subscriptions (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter','growth','pro')),
  status text not null default 'development' check (status in ('development','trialing','active','past_due','canceled')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);
-- Security-definer helpers avoid recursive membership policies. No public writes
-- to memberships/subscriptions; users cannot grant roles or activate billing.
create function public.is_business_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships where business_id = target and user_id = auth.uid());
$$;
create function public.is_business_owner(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships where business_id = target and user_id = auth.uid() and role = 'owner');
$$;
revoke all on function public.is_business_member(uuid), public.is_business_owner(uuid) from public;
grant execute on function public.is_business_member(uuid), public.is_business_owner(uuid) to authenticated;
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
alter table public.business_settings enable row level security;
alter table public.subscriptions enable row level security;
create policy profile_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profile_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profile_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy business_read on public.businesses for select to authenticated using (public.is_business_member(id));
create policy business_update on public.businesses for update to authenticated using (public.is_business_owner(id)) with check (public.is_business_owner(id));
create policy membership_read on public.memberships for select to authenticated using (user_id = auth.uid());
create policy settings_read on public.business_settings for select to authenticated using (public.is_business_member(business_id));
create policy settings_update on public.business_settings for update to authenticated using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy subscription_read on public.subscriptions for select to authenticated using (public.is_business_member(business_id));
revoke all on public.profiles, public.businesses, public.memberships, public.business_settings, public.subscriptions from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, update on public.businesses, public.business_settings to authenticated;
grant select on public.memberships, public.subscriptions to authenticated;
-- Atomic, idempotent first-business creation. Limits Phase 1 to one owned
-- business per account; separate accounts remain isolated. Team UI is Phase 6.
create function public.create_business(input jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); existing uuid; business uuid; days integer[];
begin
 if actor is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from auth.users where id = actor and email_confirmed_at is not null) then raise exception 'Verified email required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select business_id into existing from public.memberships where user_id = actor and role = 'owner' order by created_at limit 1;
 if existing is not null then return existing; end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name = input->>'timezone') then raise exception 'Invalid timezone'; end if;
 select array_agg(value::integer) into days from jsonb_array_elements_text(input->'workingDays');
 insert into public.businesses(name,industry,phone,email,location,timezone,website,description)
 values (input->>'name',input->>'industry',input->>'phone',input->>'email',input->>'location',input->>'timezone',coalesce(input->>'website',''),coalesce(input->>'description','')) returning id into business;
 insert into public.memberships(business_id,user_id,role) values (business,actor,'owner');
 insert into public.business_settings(business_id,opens,closes,working_days) values (business,(input->>'opens')::time,(input->>'closes')::time,days);
 insert into public.subscriptions(business_id) values (business);
 insert into public.profiles(id) values (actor) on conflict do nothing;
 return business;
end;
$$;
revoke all on function public.create_business(jsonb) from public;
grant execute on function public.create_business(jsonb) to authenticated;
commit;
