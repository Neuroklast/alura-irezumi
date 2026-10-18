-- Run once in the Supabase SQL editor. Never grant admin via user_metadata.
create table if not exists public.site_content (
  id integer primary key check (id = 1),
  content jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.content_versions (
  version integer primary key,
  content jsonb not null,
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt())->'app_metadata'->>'role', '') = 'admin';
$$;
alter table public.site_content enable row level security;
alter table public.content_versions enable row level security;
create policy "Published content is public" on public.site_content for select to anon, authenticated using (true);
create policy "Admins edit content" on public.site_content for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read history" on public.content_versions for select to authenticated using (public.is_admin());
grant select on public.site_content to anon, authenticated;
grant update on public.site_content to authenticated;
grant select on public.content_versions to authenticated;
create or replace function public.archive_content() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.content_versions(version,content) values (old.version,old.content) on conflict do nothing;
  new.updated_at := now();
  return new;
end; $$;
create trigger archive_content before update on public.site_content for each row execute function public.archive_content();

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  email text not null check (length(email) <= 254),
  type text not null check (type in ('tattoo','mirror')),
  motif text not null default '',
  placement text not null default '',
  size text not null default '',
  message text not null check (length(message) between 10 and 4000),
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;
create policy "Admins read enquiries" on public.enquiries for select to authenticated using (public.is_admin());
grant select on public.enquiries to authenticated;
-- Inserts only through the server-side service role. No anonymous insert policy.
revoke insert, update, delete on public.enquiries from anon, authenticated;

create table if not exists public.enquiry_rates (
  fingerprint text primary key,
  hits integer not null,
  window_start timestamptz not null
);
alter table public.enquiry_rates enable row level security;
revoke all on public.enquiry_rates from anon, authenticated;
create or replace function public.consume_enquiry_rate(fingerprint text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  -- Bound retention and perform an atomic upsert to avoid parallel-request bypasses.
  delete from public.enquiry_rates where window_start < now() - interval '24 hours';
  insert into public.enquiry_rates as rates(fingerprint,hits,window_start)
  values ($1,1,now())
  on conflict on constraint enquiry_rates_pkey do update set
    hits = case when rates.window_start < now() - interval '1 hour' then 1 else rates.hits + 1 end,
    window_start = case when rates.window_start < now() - interval '1 hour' then now() else rates.window_start end
  returning hits into used;
  return used <= 5;
end; $$;
revoke execute on function public.consume_enquiry_rate(text) from public, anon, authenticated;
grant execute on function public.consume_enquiry_rate(text) to service_role;
