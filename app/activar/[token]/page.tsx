import { notFound } from 'next/navigation'
import { InsuranceWizard } from '@/components/InsuranceWizard'
import { AlreadyActivated } from '@/components/AlreadyActivated'
import { stampClicAt } from '@/lib/panel/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { EmployeePolicyRow } from '@/lib/supabase/types'

export default async function ActivarPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createServerSupabaseClient()

  const { data } = await supabase
    .from('employee_policies')
    .select('*, companies(nombre)')
    .eq('token', token)
    .maybeSingle<EmployeePolicyRow>()

  if (!data) {
    notFound()
  }

  if (data.status === 'activated') {
    return (
      <AlreadyActivated
        colaboradorNombre={data.colaborador_nombre}
        polizaNumero={data.poliza_numero}
      />
    )
  }

  await stampClicAt(data.id)

  return (
    <InsuranceWizard
      token={data.token}
      colaboradorNombre={data.colaborador_nombre}
      empresaNombre={data.companies?.nombre ?? ''}
      montoCobertura={data.monto_cobertura}
      polizaNumero={data.poliza_numero}
    />
  )
}
