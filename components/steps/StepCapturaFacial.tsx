'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CheckCircle2, ScanFace } from 'lucide-react'
import { cn } from '@/lib/utils'

type FacialState = 'positioning' | 'ready' | 'capturing' | 'success' | 'error'

interface StepCapturaFacialProps {
  onNext: () => void
}

const STATE_MESSAGES: Record<FacialState, string> = {
  positioning: 'Acerca tu rostro al óvalo',
  ready: 'Mantén la mirada en la cámara',
  capturing: 'Mantente quieto...',
  success: 'Selfie capturada',
  error: 'No se pudo capturar tu rostro',
}

export function StepCapturaFacial({ onNext }: StepCapturaFacialProps) {
  const [facialState, setFacialState] = useState<FacialState>('positioning')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let mounted = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setTimeout(() => {
          if (mounted) setFacialState('ready')
        }, 1500)
      } catch {
        if (mounted) setFacialState('ready')
      }
    }

    startCamera()

    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function handleCapture() {
    setFacialState('capturing')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setFacialState('success')
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setTimeout(() => onNext(), 800)
  }

  async function handleSimulate() {
    setFacialState('capturing')
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setFacialState('success')
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setTimeout(() => onNext(), 800)
  }

  const ovalColor =
    facialState === 'positioning'
      ? 'stroke-primary-foreground/40'
      : facialState === 'ready'
        ? 'stroke-accent'
        : facialState === 'capturing'
          ? 'stroke-accent animate-pulse'
          : facialState === 'success'
            ? 'stroke-[var(--brand-success)]'
            : 'stroke-destructive'

  return (
    <div className="flex flex-col px-5 py-8 gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-xl font-bold text-balance">
          Ahora, toma una selfie
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Mantén tu rostro dentro del óvalo. Usaremos detección de presencia física.
        </p>
      </div>

      <Card className="overflow-hidden border-2 border-border">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] max-h-[360px] bg-primary overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'absolute inset-0 w-full h-full object-cover scale-x-[-1]',
                facialState === 'success' && 'opacity-40'
              )}
            />

            {!streamRef.current && facialState !== 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <ScanFace className="size-16 text-muted-foreground/40" strokeWidth={1} />
              </div>
            )}

            {/* Oval guide overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 300 400"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <mask id="oval-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <ellipse cx="150" cy="175" rx="90" ry="120" fill="black" />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(29, 42, 114, 0.55)"
                mask="url(#oval-mask)"
              />
              <ellipse
                cx="150"
                cy="175"
                rx="90"
                ry="120"
                fill="none"
                strokeWidth="3"
                className={cn('transition-colors duration-300', ovalColor)}
              />
            </svg>

            {facialState === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/60">
                <div className="size-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="size-10 text-[var(--brand-success)]" strokeWidth={1.5} />
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-0 right-0 text-center px-4">
              <p className="text-primary-foreground text-sm font-medium bg-primary/80 rounded-full px-4 py-2 inline-block">
                {STATE_MESSAGES[facialState]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(facialState === 'ready' || facialState === 'positioning') && (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-xl h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleCapture}
          >
            <Camera className="size-5" data-icon="inline-start" />
            Capturar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs h-8"
            onClick={handleSimulate}
          >
            Simular captura (modo demo)
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--brand-blue-light)] border border-accent/20">
        <ScanFace className="size-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-foreground text-xs leading-relaxed">
          Mantén la mirada en la cámara y evita usar lentes oscuros o cubrebocas.
        </p>
      </div>
    </div>
  )
}
