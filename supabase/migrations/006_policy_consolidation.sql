-- Consolidate permissive policies so each role/action evaluates one policy.

drop policy if exists seller_profiles_admin_select on public.seller_profiles;
drop policy if exists seller_profiles_select_self on public.seller_profiles;
create policy seller_profiles_select on public.seller_profiles for select to authenticated
using ((select auth.uid())=user_id or app_private.current_user_is_admin());

drop policy if exists seller_profiles_admin_update on public.seller_profiles;
drop policy if exists seller_profiles_update_self on public.seller_profiles;
create policy seller_profiles_update on public.seller_profiles for update to authenticated
using ((select auth.uid())=user_id or app_private.current_user_is_admin())
with check ((select auth.uid())=user_id or app_private.current_user_is_admin());

drop policy if exists products_admin_select on public.marketplace_products;
drop policy if exists products_seller_read on public.marketplace_products;
create policy products_authenticated_read on public.marketplace_products for select to authenticated
using (
  (select auth.uid())=seller_id
  or app_private.current_user_is_admin()
  or (status='approved' and is_active and app_private.is_approved_seller(seller_id))
);

drop policy if exists products_admin_update on public.marketplace_products;
drop policy if exists products_seller_update_own on public.marketplace_products;
create policy products_authenticated_update on public.marketplace_products for update to authenticated
using ((select auth.uid())=seller_id or app_private.current_user_is_admin())
with check ((select auth.uid())=seller_id or app_private.current_user_is_admin());

drop policy if exists product_images_admin_select on public.marketplace_product_images;
drop policy if exists product_images_seller_read on public.marketplace_product_images;
create policy product_images_authenticated_read on public.marketplace_product_images for select to authenticated
using (
  (select auth.uid())=seller_id
  or app_private.current_user_is_admin()
  or exists (
    select 1 from public.marketplace_products p
    where p.id=product_id and p.status='approved' and p.is_active
      and app_private.is_approved_seller(p.seller_id)
  )
);
