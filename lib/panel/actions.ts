'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { linkFor, type Colaborador } from '@/lib/panel/model'
import { getColaborador } from '@/lib/panel/server'

export interface ActionResult {
  ok: boolean
  error?: string
  colaborador?: Colaborador
}

export interface CrearColaboradorInput {
  nombre: string
  empresa: string
  telefono?: string
  tipoPlan: string
  montoCobertura: number
  fechaAlta?: string
}

export interface CrearColaboradorResult extends ActionResult {
  id?: string
  token?: string
  link?: string
}

async function findOrCreateCompany(nombre: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()

  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('nombre', nombre.trim())
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('companies')
    .insert({ nombre: nombre.trim() })
    .select('id')
    .single()

  if (error || !created) return null
  return created.id
}

function revalidatePanel() {
  revalidatePath('/panel')
  revalidatePath('/panel/metricas')
}

export async function crearColaborador(
  input: CrearColaboradorInput
): Promise<CrearColaboradorResult> {
  const nombre = input.nombre?.trim()
  const empresa = input.empresa?.trim()

  if (!nombre) {
    return { ok: false, error: 'El nombre es requerido' }
  }
  if (!empresa) {
    return { ok: false, error: 'La empresa es requerida' }
  }
  if (!input.montoCobertura || input.montoCobertura <= 0) {
    return { ok: false, error: 'El monto de cobertura debe ser mayor a 0' }
  }

  const companyId = await findOrCreateCompany(empresa)
  if (!companyId) {
    return { ok: false, error: 'No se pudo registrar la empresa' }
  }

  const supabase = createServerSupabaseClient()
  const token = crypto.randomUUID()
  const polizaNumero = `VG-${Date.now().toString(36).toUpperCase()}`
  const now = new Date().toISOString()
  const fechaAlta =
    input.fechaAlta ?? new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('employee_policies')
    .insert({
      token,
      company_id: companyId,
      colaborador_nombre: nombre,
      monto_cobertura: input.montoCobertura,
      poliza_numero: polizaNumero,
      tipo_plan: input.tipoPlan,
      telefono: input.telefono?.trim() || null,
      fecha_alta: fechaAlta,
      enviado_at: now,
      status: 'pending',
    })
    .select('id, token')
    .single()

  if (error || !data) {
    return { ok: false, error: 'No se pudo crear el colaborador' }
  }

  revalidatePanel()

  return {
    ok: true,
    id: data.id,
    token: data.token,
    link: linkFor(data.token),
  }
}

export async function marcarRespondio(id: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('employee_policies')
    .update({ respondio_at: new Date().toISOString() })
    .eq('id', id)
    .is('respondio_at', null)

  if (error) {
    return { ok: false, error: 'No se pudo marcar como respondió' }
  }

  revalidatePanel()
  const colaborador = await getColaborador(id)
  return { ok: true, colaborador: colaborador ?? undefined }
}

export async function guardarNotas(
  id: string,
  notas: string
): Promise<ActionResult> {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('employee_policies')
    .update({ notas })
    .eq('id', id)

  if (error) {
    return { ok: false, error: 'No se pudieron guardar las notas' }
  }

  revalidatePanel()
  const colaborador = await getColaborador(id)
  return { ok: true, colaborador: colaborador ?? undefined }
}
