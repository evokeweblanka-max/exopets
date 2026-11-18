-- Remove the superseded persistent bearer-secret bridge.
drop function if exists app_private.admin_bridge_ok(text);
delete from app_private.settings where key='admin_bridge_hash';
