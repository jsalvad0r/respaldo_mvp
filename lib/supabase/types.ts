export interface EmployeePolicyRow {
  id: string
  token: string
  company_id: string
  colaborador_nombre: string
  monto_cobertura: number
  poliza_numero: string
  status: 'pending' | 'activated'
  activated_at: string | null
  created_at: string
  telefono?: string | null
  tipo_plan?: string | null
  fecha_alta?: string
  notas?: string
  enviado_at?: string | null
  respondio_at?: string | null
  clic_at?: string | null
  escaneo_at?: string | null
  companies: { nombre: string } | null
}
