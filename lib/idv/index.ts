import { MockIDVProvider } from '@/lib/idv/providers/mock'
import type { IDVProvider } from '@/lib/idv/provider'

export function createIDVProvider(): IDVProvider {
  const providerName = process.env.IDV_PROVIDER ?? 'mock'

  switch (providerName) {
    case 'mock':
    default:
      if (providerName !== 'mock') {
        console.warn(`Unknown IDV provider "${providerName}", falling back to mock`)
      }
      return new MockIDVProvider()
  }
}

export const idvProvider = createIDVProvider()

export function getConfidenceThreshold(): number {
  const raw = process.env.IDV_CONFIDENCE_THRESHOLD ?? '0.85'
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : 0.85
}
