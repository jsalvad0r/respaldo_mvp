import { MOCK_OCR_DATA, type InsuredData } from '@/lib/types'

export interface OcrProvider {
  extract(image: Buffer): Promise<InsuredData>
}

// No hay proveedor de OCR real conectado todavía (Truora/Metamap/AWS Textract, etc.
// requieren su propia cuenta y API key). Esta implementación simula la lectura
// del documento; cuando se elija un proveedor, basta con reemplazar `extract`.
class MockOcrProvider implements OcrProvider {
  async extract(_image: Buffer): Promise<InsuredData> {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return MOCK_OCR_DATA
  }
}

export const ocrProvider: OcrProvider = new MockOcrProvider()
