import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ocrProvider } from '@/lib/ocr/provider'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServerSupabaseClient()

  const { data: policy, error: policyError } = await supabase
    .from('employee_policies')
    .select('id, status')
    .eq('token', token)
    .maybeSingle()

  if (policyError || !policy) {
    return NextResponse.json({ error: 'Link no válido' }, { status: 404 })
  }
  if (policy.status === 'activated') {
    return NextResponse.json({ error: 'Este link ya fue activado' }, { status: 409 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Falta el archivo de imagen' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${token}/${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('documentos-identidad')
    .upload(path, buffer, { contentType: file.type || 'image/jpeg' })

  if (uploadError) {
    return NextResponse.json({ error: 'No se pudo subir el documento' }, { status: 500 })
  }

  const insuredData = await ocrProvider.extract(buffer)

  return NextResponse.json({ insuredData, documentImagePath: path })
}
