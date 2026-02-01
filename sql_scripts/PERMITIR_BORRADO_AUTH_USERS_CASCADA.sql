-- Permite borrar auth.users sin errores de FK
-- Ejecutar manualmente en Supabase SQL Editor (con rol owner de las tablas public)

-- 1) Ajustar FKs que hoy bloquean el borrado (NO ACTION)
--    Se pasan a ON DELETE SET NULL para conservar datos históricos.

alter table public.alerts
  drop constraint if exists alerts_created_by_fkey;
alter table public.alerts
  add constraint alerts_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.alert_votes
  drop constraint if exists alert_votes_user_id_fkey;
alter table public.alert_votes
  add constraint alert_votes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.audit_log
  drop constraint if exists audit_log_usuario_id_fkey;
alter table public.audit_log
  add constraint audit_log_usuario_id_fkey
  foreign key (usuario_id) references auth.users(id) on delete set null;

alter table public.configuracion_sistema
  drop constraint if exists configuracion_sistema_updated_by_fkey;
alter table public.configuracion_sistema
  add constraint configuracion_sistema_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

alter table public.estacionamientos
  drop constraint if exists estacionamientos_propietario_id_fkey;
alter table public.estacionamientos
  add constraint estacionamientos_propietario_id_fkey
  foreign key (propietario_id) references auth.users(id) on delete set null;

alter table public.estacionamientos
  drop constraint if exists estacionamientos_verificado_por_fkey;
alter table public.estacionamientos
  add constraint estacionamientos_verificado_por_fkey
  foreign key (verificado_por) references auth.users(id) on delete set null;

alter table public.kyc_submissions
  drop constraint if exists kyc_submissions_revisado_por_fkey;
alter table public.kyc_submissions
  add constraint kyc_submissions_revisado_por_fkey
  foreign key (revisado_por) references auth.users(id) on delete set null;

alter table public.parking_slots
  drop constraint if exists parking_slots_last_reported_by_fkey;
alter table public.parking_slots
  add constraint parking_slots_last_reported_by_fkey
  foreign key (last_reported_by) references auth.users(id) on delete set null;

alter table public.reservas
  drop constraint if exists reservas_cancelada_por_fkey;
alter table public.reservas
  add constraint reservas_cancelada_por_fkey
  foreign key (cancelada_por) references auth.users(id) on delete set null;

alter table public.user_roles
  drop constraint if exists user_roles_asignado_por_fkey;
alter table public.user_roles
  add constraint user_roles_asignado_por_fkey
  foreign key (asignado_por) references auth.users(id) on delete set null;

-- 2) Borrado de usuario (ejecutar luego de ajustar FKs)
-- Reemplaza <USER_ID> por el uuid real.
-- Nota: requiere permisos de owner/superuser para borrar de auth.users.
-- delete from auth.users where id = '<USER_ID>';

-- 3) (Opcional) Si querés limpiar Storage del usuario:
-- delete from storage.objects where owner = '<USER_ID>';
-- delete from storage.buckets where owner = '<USER_ID>';
