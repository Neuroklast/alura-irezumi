-- Additive migration, run after schema.sql. Safe to rerun.
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  checkout_key uuid not null unique,
  session_id text unique,
  payment_intent text,
  payment text not null default 'pending' check(payment in ('pending','paid','failed','refunded','partially_refunded')),
  customer text not null default '', email text not null default '', address text not null default '',
  items jsonb not null check(jsonb_typeof(items) = 'array'),
  shipping integer not null check(shipping >= 0), total integer not null check(total > 0),
  return_status text not null default 'none' check(return_status in ('none','requested','received','closed')),
  note text not null default '', version integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists shop_orders_created on public.shop_orders(created_at desc);
create index if not exists shop_orders_payment_intent on public.shop_orders(payment_intent);
create table if not exists public.shop_events (id text primary key, created_at timestamptz not null default now());
create table if not exists public.shop_notifications (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.shop_orders(id),
  kind text not null check(kind in ('paid','problem','refund')), sent_at timestamptz, error text not null default '',
  created_at timestamptz not null default now(), unique(order_id,kind)
);
alter table public.shop_orders enable row level security;
alter table public.shop_events enable row level security;
alter table public.shop_notifications enable row level security;
revoke all on public.shop_orders, public.shop_events, public.shop_notifications from anon, authenticated;
drop policy if exists "Admins read orders" on public.shop_orders;
create policy "Admins read orders" on public.shop_orders for select to authenticated using(public.is_admin());
drop policy if exists "Admins read shop notifications" on public.shop_notifications;
create policy "Admins read shop notifications" on public.shop_notifications for select to authenticated using(public.is_admin());
grant select on public.shop_orders, public.shop_notifications to authenticated;

-- One transaction validates catalog revision and reserves finite stock. Never trust a browser total.
create or replace function public.reserve_print_order(p_key uuid, p_items jsonb, p_shipping integer, p_total integer, p_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing public.shop_orders; current_version integer; item jsonb; used integer; calculated integer;
begin
  select version into current_version from public.site_content where id = 1 for update;
  select * into existing from public.shop_orders where checkout_key = p_key;
  if found then
    if existing.items <> p_items or existing.total <> p_total then raise exception 'Warenkorb geändert. Bitte erneut starten.'; end if;
    if existing.payment <> 'pending' then raise exception 'Bestellversuch bereits abgeschlossen.'; end if;
    return to_jsonb(existing);
  end if;
  if current_version <> p_version then raise exception 'Katalog wurde geändert. Bitte neu laden.'; end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then raise exception 'Ungültiger Warenkorb'; end if;
  calculated := p_shipping;
  for item in select value from jsonb_array_elements(p_items) loop
    calculated := calculated + (item->>'price')::integer * (item->>'quantity')::integer;
    if item->>'stockMode' = 'limited' then
      -- Pending reservations are released only by a verified Stripe expiry/failure event.
      -- Refunded stock is not automatically resold before a physical return is checked.
      select coalesce(sum((line->>'quantity')::integer),0)::integer into used
      from public.shop_orders o, jsonb_array_elements(o.items) line
      where o.payment <> 'failed' and line->>'variantId' = item->>'variantId';
      if used + (item->>'quantity')::integer > (item->>'stock')::integer then raise exception 'Ein Print ist inzwischen ausverkauft.'; end if;
    end if;
  end loop;
  if calculated <> p_total then raise exception 'Ungültige Summe'; end if;
  insert into public.shop_orders(checkout_key,items,shipping,total)
  values(p_key,p_items,p_shipping,p_total) returning * into existing;
  return to_jsonb(existing);
end $$;
revoke all on function public.reserve_print_order(uuid,jsonb,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.reserve_print_order(uuid,jsonb,integer,integer,integer) to service_role;

-- Event receipt and effects commit together. Repeated deliveries are harmless.
create or replace function public.apply_print_event(p_event text, p_order uuid, p_session text, p_action text, p_total integer, p_customer text, p_email text, p_address text, p_intent text)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.shop_orders; duplicate integer;
begin
  insert into public.shop_events(id) values(p_event) on conflict do nothing;
  get diagnostics duplicate = row_count;
  if duplicate = 0 then return; end if;
  select * into o from public.shop_orders where id = p_order for update;
  if not found then raise exception 'Bestellung fehlt'; end if;
  if o.session_id is not null and o.session_id <> p_session then raise exception 'Checkout stimmt nicht überein'; end if;
  if p_action = 'paid' then
    if o.total <> p_total then raise exception 'Zahlbetrag stimmt nicht überein'; end if;
    if o.payment = 'pending' then
      update public.shop_orders set payment='paid', session_id=p_session, payment_intent=p_intent,
        customer=p_customer,email=p_email,address=p_address,version=version+1,
        items=(select jsonb_agg(case when value->>'fulfillment' = 'manual' then jsonb_set(value,'{status}','"ready"') else value end) from jsonb_array_elements(o.items))
      where id=p_order;
      insert into public.shop_notifications(order_id,kind) values(p_order,'paid') on conflict do nothing;
    end if;
  elsif p_action = 'failed' and o.payment = 'pending' then
    update public.shop_orders set payment='failed',session_id=p_session,version=version+1 where id=p_order;
    insert into public.shop_notifications(order_id,kind) values(p_order,'problem') on conflict do nothing;
  end if;
end $$;
revoke all on function public.apply_print_event(text,uuid,text,text,integer,text,text,text,text) from public, anon, authenticated;
grant execute on function public.apply_print_event(text,uuid,text,text,integer,text,text,text,text) to service_role;

-- Admin updates may never set a payment state. Payment belongs to the verified webhook.
create or replace function public.update_print_order(p_id uuid, p_version integer, p_items jsonb, p_return text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.shop_orders; item jsonb; original jsonb; result jsonb := '[]';
begin
  if not public.is_admin() then raise exception 'Nicht berechtigt'; end if;
  select * into o from public.shop_orders where id=p_id for update;
  if not found or o.version <> p_version then raise exception 'Bestellung wurde geändert. Bitte neu laden.'; end if;
  if p_return not in ('none','requested','received','closed') or length(p_note)>2000 then raise exception 'Ungültige Angaben'; end if;
  if jsonb_array_length(p_items) <> jsonb_array_length(o.items) then raise exception 'Positionen dürfen nicht entfernt werden'; end if;
  for original in select value from jsonb_array_elements(o.items) loop
    select value into item from jsonb_array_elements(p_items) where value->>'variantId'=original->>'variantId';
    if item is null or item->>'status' not in ('blocked','ready','processing','shipped','cancelled') or length(coalesce(item->>'tracking',''))>120 then raise exception 'Ungültige Position'; end if;
    if item->>'fulfillment' not in ('unassigned','manual','pod') then raise exception 'Ungültige Versandart'; end if;
    if (o.payment <> 'paid' or item->>'fulfillment' <> 'manual') and item->>'status' in ('ready','processing','shipped') then raise exception 'Versand ist noch nicht freigegeben'; end if;
    result := result || jsonb_build_array(original || jsonb_build_object('status',item->>'status','tracking',coalesce(item->>'tracking',''),'fulfillment',item->>'fulfillment'));
  end loop;
  update public.shop_orders set items=result,return_status=p_return,note=p_note,version=version+1 where id=p_id returning * into o;
  return to_jsonb(o);
end $$;
revoke all on function public.update_print_order(uuid,integer,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.update_print_order(uuid,integer,jsonb,text,text) to authenticated;

create or replace function public.apply_print_refund(p_event text, p_intent text, p_refunded integer)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.shop_orders; inserted integer;
begin
  select * into o from public.shop_orders where payment_intent=p_intent for update;
  if not found then raise exception 'Bestellung noch nicht zugeordnet'; end if;
  insert into public.shop_events(id) values(p_event) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return; end if;
  if p_refunded >= o.total then
    update public.shop_orders set payment='refunded',version=version+1,
      items=(select jsonb_agg(case when value->>'status' <> 'shipped' then jsonb_set(value,'{status}','"cancelled"') else value end) from jsonb_array_elements(o.items)) where id=o.id;
  elsif p_refunded > 0 and o.payment <> 'refunded' then
    update public.shop_orders set payment='partially_refunded',version=version+1 where id=o.id;
  end if;
  insert into public.shop_notifications(order_id,kind) values(o.id,'refund') on conflict do nothing;
end $$;
revoke all on function public.apply_print_refund(text,text,integer) from public, anon, authenticated;
grant execute on function public.apply_print_refund(text,text,integer) to service_role;
