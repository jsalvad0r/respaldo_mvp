-- Esquema inicial: activación de seguro de vida vía link único por colaborador.
-- Pega este archivo completo en Supabase Dashboard -> SQL Editor -> Run.

create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create table if not exists employee_policies (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  company_id uuid not null references companies(id),
  colaborador_nombre text not null,
  monto_cobertura numeric not null,
  poliza_numero text not null,
  status text not null default 'pending' check (status in ('pending', 'activated')),
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists employee_policies_token_idx on employee_policies (token);

create table if not exists activations (
  id uuid primary key default gen_random_uuid(),
  employee_policy_id uuid not null unique references employee_policies(id),
  nombre_completo text not null,
  numero_documento text not null,
  fecha_nacimiento date not null,
  document_image_path text,
  created_at timestamptz not null default now()
);

create table if not exists beneficiaries (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null references activations(id),
  nombre text not null,
  parentesco text not null,
  porcentaje numeric not null check (porcentaje > 0 and porcentaje <= 100),
  created_at timestamptz not null default now()
);

-- RLS: default-deny para anon/authenticated. Todo el acceso pasa por
-- Route Handlers de Next.js usando la service_role key (que ignora RLS).
alter table companies enable row level security;
alter table employee_policies enable row level security;
alter table activations enable row level security;
alter table beneficiaries enable row level security;

-- Bucket privado para las fotos de identificación (subidas solo vía servidor).
insert into storage.buckets (id, name, public)
values ('documentos-identidad', 'documentos-identidad', false)
on conflict (id) do nothing;

-- Seed de prueba para poder correr el flujo end-to-end.
with c as (
  insert into companies (nombre) values ('Constructora Andina')
  returning id
)
insert into employee_policies (token, company_id, colaborador_nombre, monto_cobertura, poliza_numero, status)
select 'demo-camila-2026', c.id, 'Camila', 50000, 'VG-2024-084521', 'pending'
from c;
