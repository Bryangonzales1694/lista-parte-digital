-- Fuerza a PostgREST a refrescar su caché de relaciones (FKs nuevas como
-- partes -> convocatorias no se detectan automáticamente en este servidor).
notify pgrst, 'reload schema';
