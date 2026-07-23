-- Panel del piloto: funnel de 5 etapas + campos del operador.
-- Ejecutar en Supabase Dashboard -> SQL Editor después de 0001_init.sql.

alter table employee_policies
  add column if not exists telefono text,
  add column if not exists tipo_plan text,
  add column if not exists fecha_alta date not null default current_date,
  add column if not exists notas text not null default '',
  add column if not exists enviado_at timestamptz,
  add column if not exists respondio_at timestamptz,
  add column if not exists clic_at timestamptz,
  add column if not exists escaneo_at timestamptz;

create index if not exists employee_policies_company_id_idx
  on employee_policies (company_id);

-- Backfill: colaboradores existentes cuentan como "mensaje enviado" desde su alta.
update employee_policies
set enviado_at = created_at
where enviado_at is null;

-- Backfill: activaciones ya completadas marcan el funnel completo.
update employee_policies
set
  clic_at = coalesce(clic_at, activated_at),
  escaneo_at = coalesce(escaneo_at, activated_at)
where status = 'activated' and activated_at is not null;
