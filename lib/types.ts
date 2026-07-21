export type WizardStep = 1 | 2 | 3 | 4

export interface Beneficiary {
  id: string
  nombre: string
  parentesco: string
  porcentaje: number
}

export interface InsuredData {
  nombreCompleto: string
  numeroDocumento: string
  fechaNacimiento: string
}

export interface WizardState {
  step: WizardStep
  insuredData: InsuredData
  beneficiaries: Beneficiary[]
  documentImagePath: string | null
}

export const INITIAL_STATE: WizardState = {
  step: 1,
  insuredData: {
    nombreCompleto: '',
    numeroDocumento: '',
    fechaNacimiento: '',
  },
  beneficiaries: [],
  documentImagePath: null,
}

// Datos resueltos del link de activación (vienen de employee_policies en Supabase).
export interface ActivacionLinkData {
  token: string
  status: 'pending' | 'activated'
  colaboradorNombre: string
  empresaNombre: string
  montoCobertura: number
  polizaNumero: string
}

// Mock OCR result after "scanning" document
export const MOCK_OCR_DATA: InsuredData = {
  nombreCompleto: 'Camila Rosas Morales',
  numeroDocumento: 'ROMC9504128F2',
  fechaNacimiento: '1995-04-12',
}

export const PARENTESCO_OPTIONS = [
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'hijo', label: 'Hijo(a)' },
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'otro', label: 'Otro' },
]
