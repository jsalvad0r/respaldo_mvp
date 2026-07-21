import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { EmployeePolicyRow } from '@/lib/supabase/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('employee_policies')
    .select('*, companies(nombre)')
    .eq('token', token)
    .maybeSingle<EmployeePolicyRow>()

  if (error) {
    return NextResponse.json({ error: 'No se pudo resolver el link' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Link no válido' }, { status: 404 })
  }

  return NextResponse.json({
    status: data.status,
    colaboradorNombre: data.colaborador_nombre,
    empresaNombre: data.companies?.nombre ?? '',
    montoCobertura: data.monto_cobertura,
    polizaNumero: data.poliza_numero,
  })
}
