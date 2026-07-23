// Tipos, configuración del funnel y plantillas del panel interno.

export type FunnelStage =
  | "enviado"
  | "respondio"
  | "clic"
  | "escaneo"
  | "activado"

export const FUNNEL_ORDER: FunnelStage[] = [
  "enviado",
  "respondio",
  "clic",
  "escaneo",
  "activado",
]

export interface StageConfig {
  key: FunnelStage
  label: string
  short: string
  badgeClass: string
  chartColor: string
}

export const STAGE_CONFIG: Record<FunnelStage, StageConfig> = {
  enviado: {
    key: "enviado",
    label: "Mensaje enviado",
    short: "Enviado",
    badgeClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    chartColor: "var(--chart-5)",
  },
  respondio: {
    key: "respondio",
    label: "Respondió",
    short: "Respondió",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    chartColor: "var(--chart-4)",
  },
  clic: {
    key: "clic",
    label: "Clic en link",
    short: "Clic",
    badgeClass:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    chartColor: "var(--chart-3)",
  },
  escaneo: {
    key: "escaneo",
    label: "Escaneó documento",
    short: "Escaneó",
    badgeClass:
      "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    chartColor: "var(--chart-2)",
  },
  activado: {
    key: "activado",
    label: "Activado",
    short: "Activado",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    chartColor: "var(--chart-1)",
  },
}

export interface FunnelEvent {
  stage: FunnelStage
  timestamp: string
}

export interface Colaborador {
  id: string
  nombre: string
  empresa: string
  fechaAlta: string
  fechaAltaLabel: string
  stage: FunnelStage
  token: string
  montoCobertura: number
  tipoPlan: string
  telefono: string
  notas: string
  historial: FunnelEvent[]
  enviadoAt: string | null
  activatedAt: string | null
}

export const PLAN_OPTIONS = [
  { nombre: "Vida Básico", monto: 250_000 },
  { nombre: "Vida Plus", monto: 500_000 },
  { nombre: "Vida Familiar", monto: 750_000 },
  { nombre: "Vida Premium", monto: 1_000_000 },
] as const

export function linkFor(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (base) {
    return `${base}/activar/${token}`
  }
  return `/activar/${token}`
}

export function funnelCounts(colaboradores: Colaborador[]) {
  return FUNNEL_ORDER.map((stage) => {
    const stageIdx = FUNNEL_ORDER.indexOf(stage)
    const count = colaboradores.filter(
      (c) => FUNNEL_ORDER.indexOf(c.stage) >= stageIdx
    ).length
    return { stage, count }
  })
}

export interface Metrica {
  activationRate: number
  clickRate: number
  avgActivationLabel: string
  avgActivationMetGoal: boolean
  total: number
  activados: number
}

function formatDuration(ms: number): string {
  if (ms <= 0 || !Number.isFinite(ms)) return "—"
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} s`
  return `${minutes} min ${seconds.toString().padStart(2, "0")} s`
}

export function computeMetricas(colaboradores: Colaborador[]): Metrica {
  const total = colaboradores.length
  const activados = colaboradores.filter((c) => c.stage === "activado").length
  const conClic = colaboradores.filter(
    (c) => FUNNEL_ORDER.indexOf(c.stage) >= FUNNEL_ORDER.indexOf("clic")
  ).length

  const durations = colaboradores
    .filter((c) => c.stage === "activado" && c.enviadoAt && c.activatedAt)
    .map(
      (c) =>
        new Date(c.activatedAt!).getTime() - new Date(c.enviadoAt!).getTime()
    )

  const avgMs =
    durations.length > 0
      ? durations.reduce((sum, ms) => sum + ms, 0) / durations.length
      : 0

  return {
    total,
    activados,
    activationRate:
      total > 0 ? Math.round((activados / total) * 1000) / 10 : 0,
    clickRate: total > 0 ? Math.round((conClic / total) * 1000) / 10 : 0,
    avgActivationLabel:
      durations.length > 0 ? formatDuration(avgMs) : "—",
    avgActivationMetGoal:
      durations.length > 0 && avgMs < 5 * 60 * 1000,
  }
}

export interface PlantillaRapida {
  id: string
  titulo: string
  descripcion: string
  texto: string
}

export const PLANTILLAS: PlantillaRapida[] = [
  {
    id: "inicial",
    titulo: "Mensaje inicial",
    descripcion: "Primer contacto de activación",
    texto:
      "¡Hola! 👋 Te escribimos de VidaSegura. Tu empresa activó un seguro de vida para ti, sin costo. Puedes activarlo en menos de 1 minuto desde tu celular. ¿Quieres saber cuánto te cubre?",
  },
  {
    id: "cuanto-cubre",
    titulo: "¿Cuánto cubre?",
    descripcion: "Respuesta al monto de cobertura",
    texto:
      "Tu seguro de vida te protege con una cobertura de {MONTO}. En caso de cualquier eventualidad, ese monto se entrega a los beneficiarios que tú designes. Para activarlo y registrar a tus beneficiarios, entra aquí: {LINK}",
  },
  {
    id: "que-cubre",
    titulo: "¿Qué cubre?",
    descripcion: "Alcance del beneficio",
    texto:
      "Tu póliza cubre fallecimiento por cualquier causa las 24 horas, en cualquier lugar. El beneficio se paga directo a tus beneficiarios designados. Actívalo aquí para elegirlos: {LINK}",
  },
  {
    id: "como-activo",
    titulo: "¿Cómo activo?",
    descripcion: "Instrucciones de activación",
    texto:
      "Es muy fácil: 1) Abre este link {LINK}  2) Toma una foto de tu INE/DNI  3) Confirma tus datos y beneficiarios. Listo, tu seguro queda activo. Toma menos de 1 minuto. ✅",
  },
  {
    id: "es-gratis",
    titulo: "¿Es gratis?",
    descripcion: "Aclaración de costo",
    texto:
      "Sí, es completamente gratis para ti. 🙌 Tu empresa paga la póliza como parte de tus beneficios. Tú solo tienes que activarla aquí: {LINK}",
  },
  {
    id: "confirmacion",
    titulo: "Confirmación final",
    descripcion: "Post-activación",
    texto:
      "¡Listo! 🎉 Tu seguro de vida quedó activo. Tu familia está protegida por {MONTO}. Guarda este mensaje como comprobante. Cualquier duda, escríbenos por aquí.",
  },
  {
    id: "recordatorio",
    titulo: "Recordatorio",
    descripcion: "Para quien no activó",
    texto:
      "¡Hola de nuevo! 😊 Notamos que aún no activas tu seguro de vida gratuito. Solo te toma 1 minuto y tu familia queda protegida. Aquí está tu link personal: {LINK}",
  },
  {
    id: "agradecimiento",
    titulo: "Agradecimiento",
    descripcion: "Respuesta genérica",
    texto:
      "¡Con gusto! 🙌 Si tienes cualquier otra duda sobre tu seguro, aquí estamos para ayudarte. Que tengas un excelente día.",
  },
]
