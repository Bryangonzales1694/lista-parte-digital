-- Otorga permisos sobre el schema lista_parte a los roles de PostgREST
-- anon NO recibe permisos: esta app requiere login, nadie sin sesión debe leer datos

grant usage on schema lista_parte to authenticated, service_role;

grant all on all tables in schema lista_parte to authenticated, service_role;
grant all on all sequences in schema lista_parte to authenticated, service_role;

alter default privileges in schema lista_parte
  grant all on tables to authenticated, service_role;
alter default privileges in schema lista_parte
  grant all on sequences to authenticated, service_role;

-- Habilitamos RLS ahora (sin policies todavia = acceso denegado por defecto
-- para 'authenticated'; service_role siempre la salta). Las policies reales
-- las escribimos en el siguiente paso del checklist.
alter table lista_parte.cadetes enable row level security;
alter table lista_parte.usuarios enable row level security;
alter table lista_parte.partes enable row level security;
alter table lista_parte.registros_parte enable row level security;
