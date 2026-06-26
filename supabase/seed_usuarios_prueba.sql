-- Usuarios de prueba (cambiar contraseñas reales antes de producción)
insert into lista_parte.usuarios (username, nombre, rol, seccion_asignada, compania_asignada, password_hash) values
('1ra-seccion1', 'Jefe 1ra Sección, 1ra Compañía', 'seccion', 'PRIMERA SECCION', 'PRIMERA COMPAÑIA', '$2b$10$IRXNRvLuQRg2txVDsr3PROfe6a9MYI2Y8xbAFodTjk7n7QYGYW/yi'),
('1ra-compania', 'Jefe Primera Compañía', 'compania', NULL, 'PRIMERA COMPAÑIA', '$2b$10$N7Rw1EV74H8QnT3KAIoDzegURl44aH3dDZjOvZOs0.zB7lmGLtPIG'),
('comandante', 'Cadete Comandante', 'comandante', NULL, NULL, '$2b$10$Lq.rcte7pKnyARX.kGio8.UHAsxt9DSJNPpvIL1Jv8PQLdnOa2V/i');
