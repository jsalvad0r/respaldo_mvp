"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  label?: string
  copiedLabel?: string
  size?: "default" | "xs" | "sm" | "lg"
  variant?: "default" | "outline" | "secondary" | "ghost"
  className?: string
  /** Evita que el clic propague (útil dentro de filas clickeables). */
  stopPropagation?: boolean
}

export function CopyButton({
  value,
  label,
  copiedLabel = "Copiado",
  size = "sm",
  variant = "outline",
  className,
  stopPropagation = true,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [])

  async function handleCopy(e: React.MouseEvent) {
    if (stopPropagation) e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timeout.current) clearTimeout(timeout.current)
      timeout.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      // Silencioso: en prototipos el clipboard puede fallar sin HTTPS.
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(className)}
      aria-label={label ?? "Copiar"}
    >
      {copied ? (
        <Check
          className="text-[var(--brand-success)]"
          data-icon="inline-start"
        />
      ) : (
        <Copy data-icon="inline-start" />
      )}
      {label != null && <span>{copied ? copiedLabel : label}</span>}
    </Button>
  )
}
