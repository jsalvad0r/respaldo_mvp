'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RespaldoWordmark } from '@/components/brand/logo'
import { Clock, Mail, Phone, CheckCircle2 } from 'lucide-react'

interface StepEnlaceExpiradoProps {
  token: string
  empresaNombre?: string
}

export function StepEnlaceExpirado({
  token,
  empresaNombre = 'tu empresa',
}: StepEnlaceExpiradoProps) {
  const [contact, setContact] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/activacion/${token}/resend`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.message ?? 'No se pudo solicitar el reenvío')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar reenvío')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 gap-8 text-center bg-background">
      <RespaldoWordmark />

      <div className="size-24 rounded-full bg-muted flex items-center justify-center">
        <div className="size-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
          <Clock className="size-9 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-xs">
        <h1 className="text-foreground text-2xl font-bold text-balance">
          Este enlace ha expirado
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Los enlaces de activación tienen una validez de 30 días. Solicita uno nuevo para
          continuar con la activación de tu seguro.
        </p>
      </div>

      {submitted ? (
        <div className="w-full max-w-xs flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--brand-blue-light)] border border-accent/20">
          <CheckCircle2 className="size-8 text-[var(--brand-success)]" strokeWidth={1.5} />
          <p className="text-foreground text-sm font-medium">
            Solicitud enviada
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Recibirás un nuevo enlace en los próximos minutos si tu registro es válido.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="contact" className="text-sm font-medium text-foreground">
              Correo o teléfono registrado
            </label>
            <Input
              id="contact"
              type="text"
              placeholder="correo@empresa.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="rounded-xl h-12"
              required
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full rounded-xl h-12 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Mail className="size-4" data-icon="inline-start" />
            {loading ? 'Enviando...' : 'Solicitar nuevo enlace'}
          </Button>
          {error && <p className="text-destructive text-xs text-center">{error}</p>}
        </form>
      )}

      <div className="w-full max-w-xs flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border text-left">
          <Phone className="size-4 text-accent shrink-0" strokeWidth={2} />
          <p className="text-foreground text-xs leading-relaxed">
            También puedes contactar a Recursos Humanos de {empresaNombre} para recibir asistencia.
          </p>
        </div>

        <a
          href="tel:+5112345678"
          className="inline-flex w-full items-center justify-center rounded-xl h-12 text-sm font-medium border border-border bg-background hover:bg-muted transition-all"
        >
          Contactar Recursos Humanos
        </a>
      </div>
    </div>
  )
}
