-- Correo del colaborador, para enviar el link de activación por email.
-- Ejecutar en Supabase Dashboard -> SQL Editor después de 0002_panel.sql.

alter table employee_policies
  add column if not exists email text;
