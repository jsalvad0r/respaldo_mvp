import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { InsuredData, Beneficiary } from '@/lib/types'

interface ActivarBody {
  insuredData: InsuredData
  beneficiaries: Beneficiary[]
  documentImagePath?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body: ActivarBody = await request.json()
  const { insuredData, beneficiaries, documentImagePath } = body

  if (!insuredData?.nombreCompleto || !insuredData?.numeroDocumento || !insuredData?.fechaNacimiento) {
    return NextResponse.json({ error: 'Faltan datos del asegurado' }, { status: 400 })
  }
  const totalPorcentaje = beneficiaries.reduce((sum, b) => sum + (b.porcentaje || 0), 0)
  if (!beneficiaries.length || totalPorcentaje !== 100) {
    return NextResponse.json({ error: 'Los porcentajes de beneficiarios deben sumar 100%' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: policy, error: policyError } = await supabase
    .from('employee_policies')
    .select('id, status, poliza_numero')
    .eq('token', token)
    .maybeSingle()

  if (policyError || !policy) {
    return NextResponse.json({ error: 'Link no válido' }, { status: 404 })
  }
  if (policy.status === 'activated') {
    return NextResponse.json({ error: 'Este link ya fue activado' }, { status: 409 })
  }

  const { data: activation, error: activationError } = await supabase
    .from('activations')
    .insert({
      employee_policy_id: policy.id,
      nombre_completo: insuredData.nombreCompleto,
      numero_documento: insuredData.numeroDocumento,
      fecha_nacimiento: insuredData.fechaNacimiento,
      document_image_path: documentImagePath ?? null,
    })
    .select('id, created_at')
    .single()

  if (activationError || !activation) {
    return NextResponse.json({ error: 'No se pudo guardar la activación' }, { status: 500 })
  }

  const { error: beneficiariesError } = await supabase.from('beneficiaries').insert(
    beneficiaries.map((b) => ({
      activation_id: activation.id,
      nombre: b.nombre,
      parentesco: b.parentesco,
      porcentaje: b.porcentaje,
    }))
  )

  if (beneficiariesError) {
    return NextResponse.json({ error: 'No se pudieron guardar los beneficiarios' }, { status: 500 })
  }

  const activatedAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('employee_policies')
    .update({ status: 'activated', activated_at: activatedAt })
    .eq('id', policy.id)

  if (updateError) {
    return NextResponse.json({ error: 'No se pudo confirmar la activación' }, { status: 500 })
  }

  return NextResponse.json({
    polizaNumero: policy.poliza_numero,
    activatedAt,
  })
}
