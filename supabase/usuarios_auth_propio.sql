-- Ajusta usuarios para autenticación propia (sin GoTrue/Supabase Auth)
alter table lista_parte.usuarios drop column if exists auth_user_id;

alter table lista_parte.usuarios
  add column username text not null unique,
  add column password_hash text not null;
