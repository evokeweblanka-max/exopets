-- Marketplace moderation is available only to authenticated users whose
-- server-controlled profile role is admin. No anonymous privileged RPCs.

drop function if exists public.admin_marketplace_snapshot(text);
drop function if exists public.admin_marketplace_action(text,text,uuid,text,text);

create or replace function app_private.current_user_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id=(select auth.uid()) and role='admin'
  );
$$;
revoke all on function app_private.current_user_is_admin() from public, anon, authenticated;

create or replace function public.admin_marketplace_snapshot()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.current_user_is_admin() then raise exception 'Administrator access required'; end if;
  return jsonb_build_object(
    'sellers', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select s.user_id,s.email,s.business_name,s.contact_name,s.phone,s.whatsapp,s.address,s.bio,s.status,
      s.rejection_reason,s.created_at,s.updated_at,
      (select count(*) from public.marketplace_products p where p.seller_id=s.user_id) as product_count
      from public.seller_profiles s
    ) x),'[]'::jsonb),
    'products', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select p.*,s.business_name,s.contact_name,s.email,
      coalesce((select jsonb_agg(to_jsonb(i) order by i.sort_order,i.created_at)
        from public.marketplace_product_images i where i.product_id=p.id),'[]'::jsonb) as images
      from public.marketplace_products p join public.seller_profiles s on s.user_id=p.seller_id
    ) x),'[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_marketplace_snapshot() from public, anon;
grant execute on function public.admin_marketplace_snapshot() to authenticated;

create or replace function public.admin_marketplace_action(p_entity text,p_id uuid,p_action text,p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not app_private.current_user_is_admin() then raise exception 'Administrator access required'; end if;
  if p_entity='seller' then
    if p_action not in ('approve','reject','suspend','pending') then raise exception 'Invalid seller action'; end if;
    update public.seller_profiles set
      status=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'suspend' then 'suspended' else 'pending' end,
      rejection_reason=case when p_action='reject' then nullif(p_note,'') else null end
    where user_id=p_id returning to_jsonb(public.seller_profiles.*) into result;
    if p_action='suspend' then update public.marketplace_products set is_active=false where seller_id=p_id; end if;
  elsif p_entity='product' then
    if p_action not in ('approve','reject','draft','hide','show') then raise exception 'Invalid product action'; end if;
    if p_action='approve' and not exists (
      select 1 from public.marketplace_products p join public.seller_profiles s on s.user_id=p.seller_id
      where p.id=p_id and s.status='approved'
    ) then raise exception 'Approve the seller before approving this product'; end if;
    update public.marketplace_products set
      status=case when p_action='approve' then 'approved' when p_action='reject' then 'rejected' when p_action='draft' then 'draft' else status end,
      is_active=case when p_action='hide' then false when p_action in ('show','approve') then true else is_active end,
      reviewed_at=case when p_action in ('approve','reject') then now() else reviewed_at end,
      rejection_reason=case when p_action='reject' then nullif(p_note,'') else null end
    where id=p_id returning to_jsonb(public.marketplace_products.*) into result;
  else raise exception 'Invalid entity'; end if;
  if result is null then raise exception 'Record not found'; end if;
  insert into public.marketplace_moderation_events(actor,entity_type,entity_id,action,note)
  values ((select auth.uid())::text,p_entity,p_id,p_action,nullif(p_note,''));
  return result;
end;
$$;
revoke all on function public.admin_marketplace_action(text,uuid,text,text) from public, anon;
grant execute on function public.admin_marketplace_action(text,uuid,text,text) to authenticated;
