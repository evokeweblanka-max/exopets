-- Keep seller contact details private while allowing storefront policies to
-- verify that a product belongs to an approved seller.
create or replace function public.is_approved_marketplace_seller(p_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.seller_profiles
    where user_id = p_seller_id and status = 'approved'
  );
$$;
revoke all on function public.is_approved_marketplace_seller(uuid) from public;
grant execute on function public.is_approved_marketplace_seller(uuid) to anon, authenticated;

drop policy if exists products_public_read_approved on public.marketplace_products;
create policy products_public_read_approved on public.marketplace_products
for select to anon
using (status = 'approved' and is_active and public.is_approved_marketplace_seller(seller_id));

drop policy if exists products_seller_read on public.marketplace_products;
create policy products_seller_read on public.marketplace_products
for select to authenticated
using (
  (select auth.uid()) = seller_id
  or (status = 'approved' and is_active and public.is_approved_marketplace_seller(seller_id))
);

drop policy if exists product_images_public_read on public.marketplace_product_images;
create policy product_images_public_read on public.marketplace_product_images
for select to anon
using (exists (
  select 1 from public.marketplace_products p
  where p.id = product_id and p.status = 'approved' and p.is_active
    and public.is_approved_marketplace_seller(p.seller_id)
));

drop policy if exists product_images_seller_read on public.marketplace_product_images;
create policy product_images_seller_read on public.marketplace_product_images
for select to authenticated
using (
  (select auth.uid()) = seller_id
  or exists (
    select 1 from public.marketplace_products p
    where p.id = product_id and p.status = 'approved' and p.is_active
      and public.is_approved_marketplace_seller(p.seller_id)
  )
);
