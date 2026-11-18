-- Authenticated queries and RLS policies may execute this private helper; the
-- app_private schema is not exposed through the Data API.
grant execute on function app_private.current_user_is_admin() to authenticated;
