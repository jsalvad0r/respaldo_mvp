import type { InsuredData } from '@/lib/types'

export interface IDVProviderConfig {
  confidenceThreshold: number
}

export interface DocumentExtractionResult {
  success: boolean
  transactionId: string
  extractedFields: {
    documentNumber?: string
    dateOfBirth?: string
    fullName?: string
    documentType?: 'DNI' | 'CE' | 'PASSPORT'
  }
  allFieldsExtracted: boolean
  rawResponse: unknown
}

export interface FacialComparisonResult {
  success: boolean
  transactionId: string
  confidenceScore: number
  livenessDetected: boolean
  matchesDocument: boolean
  rawResponse: unknown
}

export interface IDVProvider {
  name: string
  extractDocument(
    image: Buffer,
    options?: { documentType?: string }
  ): Promise<DocumentExtractionResult>
  compareFacial(
    facialImage: Buffer,
    documentImage: Buffer,
    options?: { livenessData?: string; simulateFailure?: boolean }
  ): Promise<FacialComparisonResult>
  getEvidence(transactionId: string): Promise<{
    documentImage?: Buffer
    facialImage?: Buffer
    metadata: Record<string, unknown>
  }>
  healthCheck(): Promise<boolean>
}

export interface ExtractedInsuredData extends InsuredData {
  documentType?: 'DNI' | 'CE' | 'PASSPORT'
}

export function toInsuredData(fields: DocumentExtractionResult['extractedFields']): ExtractedInsuredData {
  return {
    nombreCompleto: fields.fullName ?? '',
    numeroDocumento: fields.documentNumber ?? '',
    fechaNacimiento: fields.dateOfBirth ?? '',
    documentType: fields.documentType,
  }
}
