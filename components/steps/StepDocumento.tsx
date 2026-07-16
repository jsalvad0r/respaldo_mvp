'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_OCR_DATA, type InsuredData } from '@/lib/types'
import { Camera, Upload, ScanLine, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScanState = 'idle' | 'scanning' | 'done'

interface StepDocumentoProps {
  onNext: (data: InsuredData) => void
}

async function mockOCR(): Promise<InsuredData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_OCR_DATA), 2200)
  })
}

export function StepDocumento({ onNext }: StepDocumentoProps) {
  const [scanState, setScanState] = useState<ScanState>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleFileSelected(file: File) {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setScanState('scanning')
    const data = await mockOCR()
    setScanState('done')
    setTimeout(() => onNext(data), 800)
  }

  async function handleSimulate() {
    setScanState('scanning')
    const data = await mockOCR()
    setScanState('done')
    setTimeout(() => onNext(data), 800)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelected(file)
  }

  return (
    <div className="flex flex-col px-5 py-8 gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-xl font-bold text-balance">
          Verifica tu identidad
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Toma o sube una foto de tu INE o pasaporte. La información se lee automáticamente.
        </p>
      </div>

      {/* Document card area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors duration-300 overflow-hidden',
          scanState === 'idle' && 'border-border',
          scanState === 'scanning' && 'border-accent',
          scanState === 'done' && 'border-[var(--brand-success)]'
        )}
      >
        <CardContent className="p-0">
          {scanState === 'idle' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <FileText className="size-8 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">INE, pasaporte o cédula</p>
                <p className="text-muted-foreground text-xs mt-1">Frente del documento, buena iluminación</p>
              </div>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="relative flex flex-col items-center justify-center gap-4 py-12 px-6 bg-muted/30 overflow-hidden">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Documento cargado"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="size-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <ScanLine className="size-8 text-accent animate-pulse" strokeWidth={1.5} />
                </div>
                {/* Animated scan line */}
                <div className="w-48 h-0.5 bg-accent/30 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 w-1/2 bg-accent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
                <p className="text-foreground font-semibold text-sm text-center">Leyendo tu documento...</p>
                <p className="text-muted-foreground text-xs text-center">Extrayendo datos automáticamente</p>
              </div>
            </div>
          )}

          {scanState === 'done' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-[var(--brand-success)]" strokeWidth={1.5} />
              </div>
              <p className="text-foreground font-semibold text-sm">Documento leído correctamente</p>
              <p className="text-muted-foreground text-xs">Cargando tus datos...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons — only shown when idle */}
      {scanState === 'idle' && (
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileInputChange}
            aria-label="Capturar documento con cámara"
          />
          <Button
            size="lg"
            className="w-full rounded-xl h-14 text-base font-semibold bg-primary hover:bg-primary/90"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="size-5" data-icon="inline-start" />
            Tomar foto con cámara
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl h-12 text-sm font-medium"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture')
                fileInputRef.current.click()
                setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 1000)
              }
            }}
          >
            <Upload className="size-4" data-icon="inline-start" />
            Subir desde galería
          </Button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-xs">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs underline underline-offset-2 h-8"
            onClick={handleSimulate}
          >
            Simular captura (modo demo)
          </Button>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--brand-teal-light)] border border-accent/20">
        <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-foreground text-xs leading-relaxed">
          Tus datos se usan únicamente para activar tu póliza y nunca se comparten con terceros.
        </p>
      </div>
    </div>
  )
}
