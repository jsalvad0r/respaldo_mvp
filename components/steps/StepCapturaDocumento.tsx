'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, ScanLine, FileText, CheckCircle2, Sun, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InsuredData } from '@/lib/types'

type CaptureState = 'idle' | 'camera' | 'processing' | 'success' | 'error'

interface StepCapturaDocumentoProps {
  token: string
  attemptId: string
  onNext: (file: File, insuredData: InsuredData) => void
  onFailure?: (error: string, attemptsRemaining?: number) => void
  onError?: (message: string) => void
}

const CAPTURE_TIPS = [
  { icon: Sun, text: 'Buena iluminación, sin reflejos' },
  { icon: Eye, text: 'Documento completo y legible' },
]

async function captureVideoFrame(video: HTMLVideoElement): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new File([new Blob(['MOCK_DNI:71234567'], { type: 'image/jpeg' })], 'documento.jpg')
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  )
  return new File(
    [blob ?? new Blob(['MOCK_DNI:71234567'], { type: 'image/jpeg' })],
    'documento.jpg',
    { type: 'image/jpeg' }
  )
}

export function StepCapturaDocumento({
  token,
  attemptId,
  onNext,
  onFailure,
  onError,
}: StepCapturaDocumentoProps) {
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }

  useEffect(() => {
    if (captureState !== 'camera') return

    let mounted = true
    setCameraError(null)
    setCameraReady(false)

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
        setCameraReady(true)
      } catch {
        if (!mounted) return
        setCameraError(
          'No se pudo acceder a la cámara. Usa "Subir desde galería" o revisa los permisos del navegador.'
        )
      }
    }

    startCamera()

    return () => {
      mounted = false
      stopCamera()
    }
  }, [captureState])

  async function processCapture(file?: File) {
    setCaptureState('processing')
    setErrorMessage(null)

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    }

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else {
        const demoBlob = new Blob(['MOCK_DNI:71234567'], { type: 'image/jpeg' })
        formData.append('file', demoBlob, 'demo-dni.jpg')
      }
      formData.append('attemptId', attemptId)

      const res = await fetch(`/api/activacion/${token}/idv/document`, {
        method: 'POST',
        body: formData,
      })
      const body = await res.json()

      if (!res.ok) {
        if (body.error === 'data_mismatch') {
          onFailure?.(body.error, body.attemptsRemaining)
          return
        }

        const msg =
          body.message ??
          'No se pudo leer el documento. Intenta con mejor iluminación.'
        setCaptureState('error')
        setErrorMessage(msg)
        onError?.(msg)
        return
      }

      setCaptureState('success')
      const capturedFile =
        file ?? new File([new Blob(['MOCK_DNI:71234567'], { type: 'image/jpeg' })], 'demo-dni.jpg')
      setTimeout(() => onNext(capturedFile, body.extractedData), 800)
    } catch {
      const msg = 'Error de conexión. Intenta de nuevo.'
      setCaptureState('error')
      setErrorMessage(msg)
      onError?.(msg)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processCapture(file)
    e.target.value = ''
  }

  function handleOpenCamera() {
    setErrorMessage(null)
    setCaptureState('camera')
  }

  function handleCloseCamera() {
    stopCamera()
    setCaptureState('idle')
  }

  async function handleTakePhoto() {
    if (!videoRef.current || !cameraReady) return
    const file = await captureVideoFrame(videoRef.current)
    stopCamera()
    await processCapture(file)
  }

  function handleSimulate() {
    processCapture()
  }

  function handleRetry() {
    setCaptureState('idle')
    setErrorMessage(null)
    setPreviewUrl(null)
    setCameraError(null)
  }

  return (
    <div className="flex flex-col px-5 py-8 gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-xl font-bold text-balance">
          Escanea tu documento
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          DNI peruano — parte frontal. Coloca el documento dentro del marco.
        </p>
      </div>

      <Card
        className={cn(
          'border-2 border-dashed transition-colors duration-300 overflow-hidden',
          captureState === 'idle' && 'border-border',
          captureState === 'camera' && 'border-accent',
          captureState === 'processing' && 'border-accent',
          captureState === 'success' && 'border-[var(--brand-success)]',
          captureState === 'error' && 'border-destructive'
        )}
      >
        <CardContent className="p-0">
          {captureState === 'idle' && (
            <div className="relative flex flex-col items-center justify-center gap-4 py-10 px-6">
              <div className="relative w-full max-w-[280px] aspect-[1.6/1] rounded-xl border-2 border-dashed border-accent/40 bg-muted/30 flex items-center justify-center">
                <div className="absolute inset-3 rounded-lg border border-accent/20" />
                <FileText className="size-10 text-muted-foreground/60" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-foreground font-semibold text-sm">Posiciona tu DNI aquí</p>
                <p className="text-muted-foreground text-xs mt-1">Frente del documento, sin recortes</p>
              </div>
            </div>
          )}

          {captureState === 'camera' && (
            <div className="relative bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
              />

              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <ScanLine className="size-10 text-muted-foreground animate-pulse" />
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted p-6 text-center">
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                </div>
              )}

              {cameraReady && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="w-full max-w-[300px] aspect-[1.6/1] rounded-lg border-2 border-white/80 shadow-lg" />
                </div>
              )}

              <button
                type="button"
                onClick={handleCloseCamera}
                className="absolute top-3 right-3 size-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                aria-label="Cerrar cámara"
              >
                <X className="size-5" />
              </button>

              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-xs text-center mb-3">
                  Encuadra el frente de tu DNI dentro del rectángulo
                </p>
                <Button
                  size="lg"
                  disabled={!cameraReady}
                  className="w-full rounded-xl h-12 font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => void handleTakePhoto()}
                >
                  <Camera className="size-5" data-icon="inline-start" />
                  Capturar documento
                </Button>
              </div>
            </div>
          )}

          {captureState === 'processing' && (
            <div className="relative flex flex-col items-center justify-center gap-4 py-12 px-6 bg-muted/30 overflow-hidden min-h-[220px]">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Documento capturado"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="size-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <ScanLine className="size-8 text-accent animate-pulse" strokeWidth={1.5} />
                </div>
                <div className="w-48 h-0.5 bg-accent/30 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 w-1/2 bg-accent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </div>
                <p className="text-foreground font-semibold text-sm text-center">
                  Leyendo tu documento...
                </p>
                <p className="text-muted-foreground text-xs text-center">
                  Extrayendo número de documento y fecha de nacimiento
                </p>
              </div>
            </div>
          )}

          {captureState === 'success' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-[var(--brand-success)]" strokeWidth={1.5} />
              </div>
              <p className="text-foreground font-semibold text-sm">Documento capturado</p>
              <p className="text-muted-foreground text-xs">Continuando con la verificación facial...</p>
            </div>
          )}

          {captureState === 'error' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
              <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <FileText className="size-8 text-destructive" strokeWidth={1.5} />
              </div>
              <p className="text-foreground font-semibold text-sm">No se pudo leer el documento</p>
              <p className="text-muted-foreground text-xs">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Reintentar captura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {captureState === 'idle' && (
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileInputChange}
            aria-label="Subir imagen del documento"
          />
          <Button
            size="lg"
            className="w-full rounded-xl h-14 text-base font-semibold bg-primary hover:bg-primary/90"
            onClick={handleOpenCamera}
          >
            <Camera className="size-5" data-icon="inline-start" />
            Tomar foto
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl h-12 text-sm font-medium"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" data-icon="inline-start" />
            Subir desde galería
          </Button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-xs">demo</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs h-8"
            onClick={handleSimulate}
          >
            Simular captura exitosa
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {CAPTURE_TIPS.map((tip) => (
          <div key={tip.text} className="flex items-center gap-2">
            <tip.icon className="size-4 text-accent shrink-0" />
            <p className="text-muted-foreground text-xs">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
