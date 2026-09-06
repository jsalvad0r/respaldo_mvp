export interface CompanyRow {
  nombre: string
  webhook_url?: string | null
  notification_email?: string | null
}

export interface EmployeePolicyRow {
  id: string
  token: string
  company_id: string
  colaborador_nombre: string
  colaborador_documento?: string | null
  colaborador_fecha_nacimiento?: string | null
  monto_cobertura: number
  poliza_numero: string
  status: 'pending' | 'activated'
  activated_at: string | null
  created_at: string
  expires_at?: string | null
  verification_attempts_count?: number
  is_blocked?: boolean
  blocked_at?: string | null
  telefono?: string | null
  email?: string | null
  tipo_plan?: string | null
  fecha_alta?: string
  notas?: string
  enviado_at?: string | null
  respondio_at?: string | null
  clic_at?: string | null
  escaneo_at?: string | null
  companies: CompanyRow | null
}

export interface VerificationAttemptRow {
  id: string
  employee_policy_id: string
  attempt_number: number
  stage: string
  status: string
  failure_reason?: string | null
  provider_transaction_id?: string | null
  confidence_score?: number | null
  extracted_data?: Record<string, unknown> | null
  match_result?: Record<string, unknown> | null
  started_at: string
  completed_at?: string | null
}

export interface ConsentRow {
  id: string
  employee_policy_id: string
  consent_type: 'biometric_data_processing' | 'policy_activation'
  granted: boolean
  created_at: string
}
