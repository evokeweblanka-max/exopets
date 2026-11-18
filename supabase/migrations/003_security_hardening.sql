-- Harden public API surfaces and remove avoidable security/performance advisories.

grant usage on schema app_private to anon, authenticated;
create or replace function app_private.is_approved_seller(p_seller_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.seller_profiles where user_id=p_seller_id and status='approved');
$$;
revoke all on function app_private.is_approved_seller(uuid) from public;
grant execute on function app_private.is_approved_seller(uuid) to anon, authenticated;

drop policy if exists products_public_read_approved on public.marketplace_products;
drop policy if exists products_seller_read on public.marketplace_products;
drop policy if exists product_images_public_read on public.marketplace_product_images;
drop policy if exists product_images_seller_read on public.marketplace_product_images;
drop function if exists public.is_approved_marketplace_seller(uuid);

create policy products_public_read_approved on public.marketplace_products for select to anon
using (status='approved' and is_active and app_private.is_approved_seller(seller_id));
create policy products_seller_read on public.marketplace_products for select to authenticated
using ((select auth.uid())=seller_id or (status='approved' and is_active and app_private.is_approved_seller(seller_id)));
create policy product_images_public_read on public.marketplace_product_images for select to anon
using (exists (select 1 from public.marketplace_products p where p.id=product_id and p.status='approved' and p.is_active and app_private.is_approved_seller(p.seller_id)));
create policy product_images_seller_read on public.marketplace_product_images for select to authenticated
using ((select auth.uid())=seller_id or exists (select 1 from public.marketplace_products p where p.id=product_id and p.status='approved' and p.is_active and app_private.is_approved_seller(p.seller_id)));

grant update (status,is_active,submitted_at,reviewed_at,rejection_reason) on public.marketplace_products to authenticated;
drop policy if exists products_seller_update_draft on public.marketplace_products;
create policy products_seller_update_own on public.marketplace_products for update to authenticated
using ((select auth.uid())=seller_id) with check ((select auth.uid())=seller_id);

create or replace function app_private.guard_seller_product_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> old.seller_id then return new; end if;
  if new.seller_id is distinct from old.seller_id then raise exception 'Product ownership cannot be changed'; end if;
  if old.status in ('pending','approved') and (
    new.name is distinct from old.name or new.slug is distinct from old.slug or
    new.category is distinct from old.category or new.description is distinct from old.description or
    new.price is distinct from old.price or new.stock is distinct from old.stock or
    new.availability_note is distinct from old.availability_note
  ) then raise exception 'Withdraw this product before editing it'; end if;
  if new.status is distinct from old.status then
    if old.status in ('draft','rejected') and new.status='pending' then
      if not app_private.is_approved_seller(old.seller_id) then raise exception 'Seller account is not approved yet'; end if;
      if not exists (select 1 from public.marketplace_product_images where product_id=old.id and seller_id=old.seller_id) then raise exception 'Add at least one product image before submitting'; end if;
      new.submitted_at=now(); new.rejection_reason=null;
    elsif old.status in ('pending','approved') and new.status='draft' then
      new.is_active=false; new.reviewed_at=null; new.rejection_reason=null;
    else raise exception 'Invalid product status change'; end if;
  elsif new.is_active is distinct from old.is_active or new.reviewed_at is distinct from old.reviewed_at or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'Moderation fields cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_seller_product_update on public.marketplace_products;
create trigger guard_seller_product_update before update on public.marketplace_products
for each row execute function app_private.guard_seller_product_update();

alter function public.submit_marketplace_product(uuid) security invoker;
alter function public.withdraw_marketplace_product(uuid) security invoker;

revoke all on function public.admin_marketplace_snapshot(text) from anon, authenticated, public;
revoke all on function public.admin_marketplace_action(text,text,uuid,text,text) from anon, authenticated, public;
grant execute on function public.admin_marketplace_snapshot(text) to service_role;
grant execute on function public.admin_marketplace_action(text,text,uuid,text,text) to service_role;

drop policy if exists moderation_service_role on public.marketplace_moderation_events;
create policy moderation_service_role on public.marketplace_moderation_events for all to service_role using (true) with check (true);

create index if not exists marketplace_products_seller_id_idx on public.marketplace_products(seller_id);
create index if not exists marketplace_products_storefront_idx on public.marketplace_products(status,is_active,created_at desc);
create index if not exists marketplace_product_images_product_id_idx on public.marketplace_product_images(product_id);
create index if not exists marketplace_product_images_seller_id_idx on public.marketplace_product_images(seller_id);
