import { randomUUID } from 'crypto'

import type {
  DocumentExtractionResult,
  FacialComparisonResult,
  IDVProvider,
} from '@/lib/idv/provider'

interface MockDniRecord {
  fullName: string
  dateOfBirth: string
  documentType: 'DNI' | 'CE' | 'PASSPORT'
  scenario?: 'unreadable' | 'face_mismatch' | 'liveness_failed'
}

const MOCK_DNI_REGISTRY: Record<string, MockDniRecord> = {
  '71234567': {
    fullName: 'Camila Rosas Morales',
    dateOfBirth: '1995-04-12',
    documentType: 'DNI',
  },
  '72345678': {
    fullName: 'Juan Perez Lopez',
    dateOfBirth: '1990-01-15',
    documentType: 'DNI',
    scenario: 'face_mismatch',
  },
  '73456789': {
    fullName: 'Maria Garcia Ruiz',
    dateOfBirth: '1988-07-20',
    documentType: 'DNI',
    scenario: 'liveness_failed',
  },
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function detectScenario(image: Buffer): MockDniRecord['scenario'] | undefined {
  const marker = image.toString('utf8', 0, Math.min(image.length, 512))
  if (marker.includes('MOCK_UNREADABLE')) return 'unreadable'
  if (marker.includes('MOCK_FACE_MISMATCH')) return 'face_mismatch'
  if (marker.includes('MOCK_LIVENESS_FAILED')) return 'liveness_failed'
  return undefined
}

function extractDniFromImage(image: Buffer): string | null {
  const marker = image.toString('utf8', 0, Math.min(image.length, 512))
  const match = marker.match(/MOCK_DNI:(\d{8})/)
  if (match) return match[1]

  // Demo fallback when frontend sends a plain JPEG without marker.
  return '71234567'
}

export class MockIDVProvider implements IDVProvider {
  name = 'mock'

  async extractDocument(image: Buffer): Promise<DocumentExtractionResult> {
    await delay(800)

    const scenario = detectScenario(image)
    if (scenario === 'unreadable') {
      return {
        success: false,
        transactionId: randomUUID(),
        extractedFields: {},
        allFieldsExtracted: false,
        rawResponse: { scenario: 'unreadable' },
      }
    }

    const dni = extractDniFromImage(image)
    if (!dni || !MOCK_DNI_REGISTRY[dni]) {
      return {
        success: false,
        transactionId: randomUUID(),
        extractedFields: {},
        allFieldsExtracted: false,
        rawResponse: { reason: 'unknown_document' },
      }
    }

    const record = MOCK_DNI_REGISTRY[dni]
    return {
      success: true,
      transactionId: randomUUID(),
      extractedFields: {
        documentNumber: dni,
        dateOfBirth: record.dateOfBirth,
        fullName: record.fullName,
        documentType: record.documentType,
      },
      allFieldsExtracted: true,
      rawResponse: { provider: 'mock', dni, scenario: record.scenario ?? null },
    }
  }

  async compareFacial(
    facialImage: Buffer,
    _documentImage: Buffer,
    options?: { simulateFailure?: boolean }
  ): Promise<FacialComparisonResult> {
    await delay(1200)

    const scenario = detectScenario(facialImage)
    const transactionId = randomUUID()

    if (options?.simulateFailure || scenario === 'face_mismatch') {
      return {
        success: false,
        transactionId,
        confidenceScore: 0.42,
        livenessDetected: true,
        matchesDocument: false,
        rawResponse: { scenario: 'face_mismatch' },
      }
    }

    if (scenario === 'liveness_failed') {
      return {
        success: false,
        transactionId,
        confidenceScore: 0,
        livenessDetected: false,
        matchesDocument: false,
        rawResponse: { scenario: 'liveness_failed' },
      }
    }

    return {
      success: true,
      transactionId,
      confidenceScore: 0.97,
      livenessDetected: true,
      matchesDocument: true,
      rawResponse: { provider: 'mock' },
    }
  }

  async getEvidence(transactionId: string) {
    return {
      metadata: { provider: 'mock', transactionId },
    }
  }

  async healthCheck() {
    return true
  }
}

export const MOCK_DNI_TEST_CASES = MOCK_DNI_REGISTRY
