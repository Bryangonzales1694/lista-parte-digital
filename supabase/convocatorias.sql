-- Modelo de activación: el comandante abre una "convocatoria" (ej. Formación AM)
-- y los jefes de sección solo pueden enviar parte mientras esté abierta.

create table lista_parte.convocatorias (
  id uuid primary key default gen_random_uuid(),
  etiqueta text not null,
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz,
  creado_por uuid references lista_parte.usuarios(id)
);

alter table lista_parte.partes
  add column convocatoria_id uuid references lista_parte.convocatorias(id);

alter table lista_parte.convocatorias enable row level security;

-- Por si el rol que ejecuta esto no coincide con el de las default privileges anteriores
grant all on lista_parte.convocatorias to authenticated, service_role;
