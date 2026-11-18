-- Give authenticated administrators explicit RLS access, allowing moderation
-- RPCs to run as SECURITY INVOKER instead of bypassing row security.

grant update (status,rejection_reason) on public.seller_profiles to authenticated;
grant insert (actor,entity_type,entity_id,action,note) on public.marketplace_moderation_events to authenticated;

drop policy if exists seller_profiles_admin_select on public.seller_profiles;
create policy seller_profiles_admin_select on public.seller_profiles for select to authenticated
using (app_private.current_user_is_admin());
drop policy if exists seller_profiles_admin_update on public.seller_profiles;
create policy seller_profiles_admin_update on public.seller_profiles for update to authenticated
using (app_private.current_user_is_admin()) with check (app_private.current_user_is_admin());

drop policy if exists products_admin_select on public.marketplace_products;
create policy products_admin_select on public.marketplace_products for select to authenticated
using (app_private.current_user_is_admin());
drop policy if exists products_admin_update on public.marketplace_products;
create policy products_admin_update on public.marketplace_products for update to authenticated
using (app_private.current_user_is_admin()) with check (app_private.current_user_is_admin());

drop policy if exists product_images_admin_select on public.marketplace_product_images;
create policy product_images_admin_select on public.marketplace_product_images for select to authenticated
using (app_private.current_user_is_admin());

drop policy if exists moderation_admin_insert on public.marketplace_moderation_events;
create policy moderation_admin_insert on public.marketplace_moderation_events for insert to authenticated
with check (app_private.current_user_is_admin());

create or replace function app_private.guard_seller_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null or app_private.current_user_is_admin() then return new; end if;
  if (select auth.uid())=old.user_id and (
    new.status is distinct from old.status or
    new.rejection_reason is distinct from old.rejection_reason or
    new.email is distinct from old.email or
    new.user_id is distinct from old.user_id
  ) then raise exception 'Seller approval fields cannot be changed'; end if;
  return new;
end;
$$;
drop trigger if exists guard_seller_profile_update on public.seller_profiles;
create trigger guard_seller_profile_update before update on public.seller_profiles
for each row execute function app_private.guard_seller_profile_update();

alter function public.admin_marketplace_snapshot() security invoker;
alter function public.admin_marketplace_action(text,uuid,text,text) security invoker;
