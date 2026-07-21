export interface EmployeePolicyRow {
  id: string
  token: string
  company_id: string
  colaborador_nombre: string
  monto_cobertura: number
  poliza_numero: string
  status: 'pending' | 'activated'
  activated_at: string | null
  companies: { nombre: string } | null
}
