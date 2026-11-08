-- Run once AFTER 0001_foundation.sql. Adds business tools without deleting data.
begin;
create table public.leads (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null check(length(name) between 2 and 100), phone text not null check(phone ~ '^\+[1-9][0-9]{7,14}$'),
 email text not null default '' check(length(email)<=254), source text not null default 'Manual' check(source in ('Manual','Phone','WhatsApp','SMS','Website','Referral')),
 status text not null default 'New' check(status in ('New','Contacted','Interested','Appointment Scheduled','Won','Lost')),
 notes text not null default '' check(length(notes)<=4000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(business_id,id), unique(business_id,phone)
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 lead_id uuid not null, channel text not null check(channel in ('WhatsApp','SMS')), unread boolean not null default false,
 assigned_to text not null default '' check(length(assigned_to)<=100), created_at timestamptz not null default now(),
 foreign key(business_id,lead_id) references public.leads(business_id,id), unique(business_id,id), unique(business_id,lead_id,channel)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 conversation_id uuid not null, body text not null check(length(btrim(body)) between 1 and 1600),
 direction text not null default 'outbound' check(direction='outbound'), status text not null default 'draft' check(status='draft'),
 created_at timestamptz not null default now(), foreign key(business_id,conversation_id) references public.conversations(business_id,id)
);
-- Real sending is intentionally impossible in this phase. Drafts cannot be marked delivered.
create table public.appointments (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 lead_id uuid not null, title text not null check(length(title) between 2 and 150), starts_at timestamptz not null, ends_at timestamptz not null,
 status text not null default 'Scheduled' check(status in ('Scheduled','Completed','Canceled')), notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now(), check(ends_at>starts_at), foreign key(business_id,lead_id) references public.leads(business_id,id)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 title text not null, read boolean not null default false, created_at timestamptz not null default now()
);
create index leads_business_updated on public.leads(business_id,updated_at desc);
create index conversations_business_created on public.conversations(business_id,created_at desc);
create index messages_conversation_created on public.messages(business_id,conversation_id,created_at);
create index appointments_business_start on public.appointments(business_id,starts_at);
create index notifications_business_created on public.notifications(business_id,created_at desc);
-- Every linked record must belong to the same business, even with direct REST access.
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
create policy leads_members on public.leads for all to authenticated using(public.is_business_member(business_id)) with check(public.is_business_member(business_id));
create policy conversations_members on public.conversations for all to authenticated using(public.is_business_member(business_id)) with check(public.is_business_member(business_id));
create policy messages_members on public.messages for all to authenticated using(public.is_business_member(business_id)) with check(public.is_business_member(business_id));
create policy appointments_members on public.appointments for all to authenticated using(public.is_business_member(business_id)) with check(public.is_business_member(business_id));
create policy notifications_read on public.notifications for select to authenticated using(public.is_business_member(business_id));
create policy notifications_update on public.notifications for update to authenticated using(public.is_business_member(business_id)) with check(public.is_business_member(business_id));
revoke all on public.leads,public.conversations,public.messages,public.appointments,public.notifications from anon,authenticated;
grant select,insert,update on public.leads,public.conversations,public.messages,public.appointments to authenticated;
grant select on public.notifications to authenticated;
grant update(read) on public.notifications to authenticated;
create function public.touch_lead() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now(); return new; end;$$;
create trigger leads_updated before update on public.leads for each row execute function public.touch_lead();
create function public.notify_business_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='leads' then
  if tg_op='INSERT' then insert into public.notifications(business_id,title) values(new.business_id,'New lead: '||new.name);
  elsif old.status is distinct from new.status then insert into public.notifications(business_id,title) values(new.business_id,new.name||' marked '||new.status); end if;
 else
  insert into public.notifications(business_id,title) values(new.business_id,'Appointment '||lower(new.status)||': '||new.title);
 end if;
 return new;
end;$$;
revoke all on function public.touch_lead(),public.notify_business_change() from public,anon,authenticated;
create trigger notify_lead after insert or update of status on public.leads for each row execute function public.notify_business_change();
create trigger notify_appointment after insert or update on public.appointments for each row execute function public.notify_business_change();
-- One business calendar in Phase 2. Lock the business row to serialize concurrent bookings.
create function public.check_appointment_overlap() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not public.is_business_member(new.business_id) then raise exception 'Business membership required'; end if;
 if new.status='Scheduled' then
  perform 1 from public.businesses where id=new.business_id for update;
  if exists(select 1 from public.appointments where business_id=new.business_id and id<>new.id and status='Scheduled' and starts_at<new.ends_at and ends_at>new.starts_at) then
   raise exception 'Another appointment overlaps this time' using errcode='23P01';
  end if;
 end if;
 return new;
end;$$;
revoke all on function public.check_appointment_overlap() from public,anon,authenticated;
create trigger appointment_overlap before insert or update on public.appointments for each row execute function public.check_appointment_overlap();
-- Owner-only, atomic edits to the business and its working hours. Messaging stays disabled.
create function public.update_business(target uuid,input jsonb) returns void language plpgsql security definer set search_path='' as $$
declare days integer[];
begin
 if not public.is_business_owner(target) then raise exception 'Owner permission required' using errcode='42501'; end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=input->>'timezone') then raise exception 'Invalid timezone'; end if;
 select array_agg(value::integer) into days from jsonb_array_elements_text(input->'workingDays');
 update public.businesses set name=input->>'name',industry=input->>'industry',phone=input->>'phone',email=input->>'email',location=input->>'location',timezone=input->>'timezone',website=coalesce(input->>'website',''),description=coalesce(input->>'description','') where id=target;
 update public.business_settings set opens=(input->>'opens')::time,closes=(input->>'closes')::time,working_days=days where business_id=target;
end;$$;
revoke all on function public.update_business(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.update_business(uuid,jsonb) to authenticated;
commit;
