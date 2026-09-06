-- IDV: verificación de identidad, consentimientos, expiración de enlaces.
-- Ejecutar en Supabase Dashboard -> SQL Editor después de 0003_email.sql.

alter table companies
  add column if not exists webhook_url text,
  add column if not exists notification_email text;

alter table employee_policies
  add column if not exists colaborador_documento text,
  add column if not exists colaborador_fecha_nacimiento date,
  add column if not exists expires_at timestamptz,
  add column if not exists verification_attempts_count integer not null default 0,
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_at timestamptz;

create index if not exists employee_policies_expires_at_idx
  on employee_policies (expires_at)
  where status = 'pending';

update employee_policies
set expires_at = created_at + interval '30 days'
where expires_at is null;

create or replace function set_employee_policy_expiration()
returns trigger as $$
begin
  if new.expires_at is null then
    new.expires_at := new.created_at + interval '30 days';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_set_employee_policy_expiration on employee_policies;
create trigger trigger_set_employee_policy_expiration
  before insert on employee_policies
  for each row
  execute function set_employee_policy_expiration();

create table if not exists verification_attempts (
  id uuid primary key default gen_random_uuid(),
  employee_policy_id uuid not null references employee_policies(id) on delete cascade,
  attempt_number integer not null check (attempt_number between 1 and 3),
  stage text not null default 'document_capture'
    check (stage in (
      'consent',
      'document_capture',
      'document_extraction',
      'facial_capture',
      'facial_comparison',
      'data_match',
      'completed'
    )),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'success', 'failed', 'abandoned', 'provider_error')),
  failure_reason text
    check (failure_reason is null or failure_reason in (
      'face_mismatch',
      'data_mismatch',
      'document_unreadable',
      'liveness_failed',
      'provider_unavailable',
      'timeout',
      'user_abandoned'
    )),
  provider_transaction_id text,
  confidence_score numeric(5, 4),
  extracted_data jsonb,
  match_result jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (employee_policy_id, attempt_number)
);

create index if not exists verification_attempts_policy_idx
  on verification_attempts (employee_policy_id);

create index if not exists verification_attempts_in_progress_idx
  on verification_attempts (status)
  where status = 'in_progress';

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  employee_policy_id uuid not null references employee_policies(id) on delete cascade,
  consent_type text not null
    check (consent_type in ('biometric_data_processing', 'policy_activation')),
  granted boolean not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (employee_policy_id, consent_type)
);

create index if not exists consents_policy_idx on consents (employee_policy_id);

alter table activations
  add column if not exists verification_attempt_id uuid references verification_attempts(id);

create table if not exists activation_notifications (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null references activations(id) on delete cascade,
  target_type text not null check (target_type in ('webhook', 'email')),
  target_url text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'retrying')),
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  payload jsonb not null,
  response jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  next_retry_at timestamptz
);

create index if not exists activation_notifications_pending_idx
  on activation_notifications (next_retry_at)
  where status in ('pending', 'retrying');

alter table verification_attempts enable row level security;
alter table consents enable row level security;
alter table activation_notifications enable row level security;

-- Padrón de prueba para el token demo.
update employee_policies
set
  colaborador_documento = '71234567',
  colaborador_fecha_nacimiento = '1995-04-12',
  email = coalesce(email, 'camila.demo@example.com')
where token = 'demo-camila-2026';
