export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type ProgressStep = 1 | 2 | 3 | 4 | 5

export type VerificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'blocked'

export type VerificationFailureReason =
  | 'face_mismatch'
  | 'data_mismatch'
  | 'document_unreadable'
  | 'provider_unavailable'

export type VerificationStage = 'document' | 'facial' | 'comparison' | 'data_match'

export const MAX_VERIFICATION_ATTEMPTS = 3

export const MAX_BENEFICIARIES = 3

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

export interface VerificationAttempt {
  timestamp: string
  stage: VerificationStage
  result: 'success' | 'failed'
  failureReason?: VerificationFailureReason
}

export interface IDVState {
  biometricConsentGiven: boolean
  biometricConsentTimestamp?: string
  documentImageCaptured: boolean
  facialImageCaptured: boolean
  verificationStatus: VerificationStatus
  attemptsUsed: number
  maxAttempts: number
  lastAttempt?: VerificationAttempt
  lastFailureReason?: VerificationFailureReason
}

export interface WizardState {
  step: WizardStep
  insuredData: InsuredData
  beneficiaries: Beneficiary[]
  documentImagePath: string | null
  idv: IDVState
  policyConsentGiven: boolean
  policyConsentTimestamp?: string
}

export const INITIAL_IDV_STATE: IDVState = {
  biometricConsentGiven: false,
  documentImageCaptured: false,
  facialImageCaptured: false,
  verificationStatus: 'not_started',
  attemptsUsed: 0,
  maxAttempts: MAX_VERIFICATION_ATTEMPTS,
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
  idv: INITIAL_IDV_STATE,
  policyConsentGiven: false,
}

/** Maps internal wizard steps to the 5-step progress bar shown to the user. */
export function getProgressStep(step: WizardStep): ProgressStep {
  if (step === 1) return 1
  if (step >= 2 && step <= 5) return 2
  if (step === 6) return 3
  if (step === 7) return 4
  return 5
}

export const FAILURE_MESSAGES: Record<VerificationFailureReason, string> = {
  face_mismatch: 'El rostro no coincide con la fotografía del documento.',
  data_mismatch: 'Los datos del documento no coinciden con tu registro.',
  document_unreadable: 'No se pudo leer el documento. Asegúrate de que esté bien iluminado y completo.',
  provider_unavailable: 'El servicio de verificación no está disponible en este momento. Intenta más tarde.',
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
