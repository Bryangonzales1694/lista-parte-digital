-- Borrado lógico de cadetes: los cadetes dados de baja se marcan activo=false
-- y dejan de aparecer en nuevas listas, pero siguen en el historial.
-- Ejecutar en el SQL Editor de Supabase antes de usar el panel admin.
ALTER TABLE lista_parte.cadetes
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
