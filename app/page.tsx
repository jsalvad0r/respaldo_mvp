import { RespaldoLogo } from '@/components/brand/logo'

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center bg-background">
      <RespaldoLogo width={240} height={160} priority className="max-w-[220px]" />
      <div className="flex flex-col gap-2">
        <p className="text-foreground font-semibold">
          Usa el link que te compartió tu empresa
        </p>
        <p className="text-muted-foreground text-sm">
          Ese link incluye tu código de activación personal.
        </p>
      </div>
    </div>
  )
}
