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
  polizaNumero: string
  montoCobertura: number
  colaboradorNombre: string
  empresaNombre: string
  alreadyActivated: boolean
}

export const INITIAL_STATE: WizardState = {
  step: 1,
  insuredData: {
    nombreCompleto: '',
    numeroDocumento: '',
    fechaNacimiento: '',
  },
  beneficiaries: [],
  polizaNumero: 'VG-2024-084521',
  montoCobertura: 50000,
  colaboradorNombre: 'Camila',
  empresaNombre: 'Constructora Andina',
  alreadyActivated: false,
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
