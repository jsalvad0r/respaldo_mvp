'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type InsuredData, type Beneficiary, PARENTESCO_OPTIONS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Plus, Trash2, AlertCircle, Cpu, Users } from 'lucide-react'

interface StepDatosProps {
  insuredData: InsuredData
  onNext: (data: InsuredData, beneficiaries: Beneficiary[]) => void
  submitting: boolean
  submitError: string | null
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
  autoDetected?: boolean
}

function Field({ label, error, children, autoDetected }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {autoDetected && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 gap-1">
            <Cpu className="size-2.5" />
            Detectado
          </Badge>
        )}
      </div>
      {children}
      {error && (
        <p className="text-destructive text-xs flex items-center gap-1">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

interface BeneficiaryCardProps {
  beneficiary: Beneficiary
  index: number
  onChange: (id: string, field: keyof Omit<Beneficiary, 'id'>, value: string | number) => void
  onRemove: (id: string) => void
  errors: Record<string, string>
  canRemove: boolean
}

function BeneficiaryCard({ beneficiary, index, onChange, onRemove, errors, canRemove }: BeneficiaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Beneficiario {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(beneficiary.id)}
            className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Eliminar beneficiario ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <Field label="Nombre completo" error={errors[`${beneficiary.id}-nombre`]}>
        <Input
          placeholder="Nombre y apellidos"
          value={beneficiary.nombre}
          onChange={(e) => onChange(beneficiary.id, 'nombre', e.target.value)}
          aria-invalid={!!errors[`${beneficiary.id}-nombre`]}
          className="rounded-lg"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Parentesco" error={errors[`${beneficiary.id}-parentesco`]}>
          <Select
            value={beneficiary.parentesco}
            onValueChange={(v) => onChange(beneficiary.id, 'parentesco', v)}
          >
            <SelectTrigger
              className={cn('rounded-lg', errors[`${beneficiary.id}-parentesco`] && 'border-destructive')}
              aria-invalid={!!errors[`${beneficiary.id}-parentesco`]}
            >
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {PARENTESCO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="% Cobertura" error={errors[`${beneficiary.id}-porcentaje`]}>
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="0"
              value={beneficiary.porcentaje || ''}
              onChange={(e) => onChange(beneficiary.id, 'porcentaje', parseInt(e.target.value) || 0)}
              aria-invalid={!!errors[`${beneficiary.id}-porcentaje`]}
              className="rounded-lg pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
        </Field>
      </div>
    </div>
  )
}

export function StepDatos({ insuredData: initialData, onNext, submitting, submitError }: StepDatosProps) {
  const [data, setData] = useState<InsuredData>(initialData)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { id: generateId(), nombre: '', parentesco: '', porcentaje: 100 },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updateData(field: keyof InsuredData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function addBeneficiary() {
    setBeneficiaries((prev) => [
      ...prev,
      { id: generateId(), nombre: '', parentesco: '', porcentaje: 0 },
    ])
  }

  function removeBeneficiary(id: string) {
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id))
  }

  function updateBeneficiary(
    id: string,
    field: keyof Omit<Beneficiary, 'id'>,
    value: string | number
  ) {
    setBeneficiaries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`${id}-${field}`]
      return next
    })
  }

  const totalPorcentaje = beneficiaries.reduce((sum, b) => sum + (b.porcentaje || 0), 0)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!data.nombreCompleto.trim()) newErrors.nombreCompleto = 'Ingresa tu nombre completo'
    if (!data.numeroDocumento.trim()) newErrors.numeroDocumento = 'Ingresa tu número de documento'
    if (!data.fechaNacimiento) newErrors.fechaNacimiento = 'Ingresa tu fecha de nacimiento'

    beneficiaries.forEach((b) => {
      if (!b.nombre.trim()) newErrors[`${b.id}-nombre`] = 'Nombre requerido'
      if (!b.parentesco) newErrors[`${b.id}-parentesco`] = 'Selecciona parentesco'
      if (!b.porcentaje || b.porcentaje <= 0) newErrors[`${b.id}-porcentaje`] = 'Ingresa porcentaje'
    })

    if (totalPorcentaje !== 100) {
      newErrors.totalPorcentaje = `El total es ${totalPorcentaje}%, debe ser exactamente 100%`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (validate()) {
      onNext(data, beneficiaries)
    }
  }

  return (
    <div className="flex flex-col px-5 py-8 gap-6">
      {/* Personal data section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-xl font-bold">Confirma tus datos</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Leímos tu documento automáticamente. Verifica que todo esté correcto.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
          <Field label="Nombre completo" error={errors.nombreCompleto} autoDetected>
            <Input
              value={data.nombreCompleto}
              onChange={(e) => updateData('nombreCompleto', e.target.value)}
              aria-invalid={!!errors.nombreCompleto}
              className="rounded-lg"
            />
          </Field>
          <Field label="Número de documento" error={errors.numeroDocumento} autoDetected>
            <Input
              value={data.numeroDocumento}
              onChange={(e) => updateData('numeroDocumento', e.target.value)}
              aria-invalid={!!errors.numeroDocumento}
              className="rounded-lg"
            />
          </Field>
          <Field label="Fecha de nacimiento" error={errors.fechaNacimiento} autoDetected>
            <Input
              type="date"
              value={data.fechaNacimiento}
              onChange={(e) => updateData('fechaNacimiento', e.target.value)}
              aria-invalid={!!errors.fechaNacimiento}
              className="rounded-lg"
            />
          </Field>
        </div>
      </div>

      <Separator />

      {/* Beneficiaries section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-accent" />
              <h3 className="text-foreground text-base font-bold">Beneficiarios</h3>
            </div>
            <p className="text-muted-foreground text-xs">¿Quién recibe la cobertura?</p>
          </div>

          {/* Percentage counter */}
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
              totalPorcentaje === 100
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {totalPorcentaje}% / 100%
          </div>
        </div>

        {errors.totalPorcentaje && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0" />
            <p className="text-destructive text-xs">{errors.totalPorcentaje}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {beneficiaries.map((b, i) => (
            <BeneficiaryCard
              key={b.id}
              beneficiary={b}
              index={i}
              onChange={updateBeneficiary}
              onRemove={removeBeneficiary}
              errors={errors}
              canRemove={beneficiaries.length > 1}
            />
          ))}
        </div>

        {beneficiaries.length < 5 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl h-10 border-dashed text-muted-foreground hover:text-foreground"
            onClick={addBeneficiary}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Agregar beneficiario
          </Button>
        )}
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-3 pt-2">
        {submitError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="size-4 text-destructive shrink-0" />
            <p className="text-destructive text-xs">{submitError}</p>
          </div>
        )}
        <Button
          size="lg"
          className="w-full rounded-xl h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Activando...' : 'Confirmar y activar'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Al confirmar, aceptas que tus datos sean usados para emitir tu póliza
        </p>
      </div>
    </div>
  )
}
