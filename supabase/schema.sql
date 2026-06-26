-- Lista y Parte Digital — esquema inicial
-- Usamos un schema separado para no mezclar con otras tablas de la instancia

create schema if not exists lista_parte;

create type lista_parte.grado_cadete as enum (
  'aspirante', '1er_anio', '2do_anio', '3er_anio', '4to_anio'
);

create type lista_parte.rol_usuario as enum (
  'seccion', 'compania', 'comandante'
);

create type lista_parte.estado_parte as enum (
  'presente', 'guardia', 'comision', 'otros',
  'internado_sanidad', 'eerr', 'clases', 'cemena', 'observaciones'
);

create table lista_parte.cadetes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  compania text not null,
  seccion text not null,
  grado lista_parte.grado_cadete not null,
  created_at timestamptz not null default now()
);

create table lista_parte.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  nombre text not null,
  rol lista_parte.rol_usuario not null,
  seccion_asignada text,
  compania_asignada text,
  created_at timestamptz not null default now()
);

create table lista_parte.partes (
  id uuid primary key default gen_random_uuid(),
  fecha_hora timestamptz not null default now(),
  compania text not null,
  seccion text not null,
  creado_por uuid references lista_parte.usuarios(id),
  created_at timestamptz not null default now()
);

create table lista_parte.registros_parte (
  id uuid primary key default gen_random_uuid(),
  parte_id uuid not null references lista_parte.partes(id) on delete cascade,
  cadete_id uuid not null references lista_parte.cadetes(id),
  estado lista_parte.estado_parte not null default 'presente',
  observacion text,
  registrado_por uuid references lista_parte.usuarios(id),
  created_at timestamptz not null default now()
);

create index idx_cadetes_compania_seccion on lista_parte.cadetes (compania, seccion);
create index idx_partes_compania_seccion_fecha on lista_parte.partes (compania, seccion, fecha_hora);
create index idx_registros_parte_id on lista_parte.registros_parte (parte_id);
create index idx_registros_cadete_id on lista_parte.registros_parte (cadete_id);
