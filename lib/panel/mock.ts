// Datos mock para el panel interno del piloto Wizard of Oz.
// Todo es hardcoded/determinístico (sin Math.random) para evitar
// desajustes de hidratación entre servidor y cliente.

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
  /** Clases del badge de estado (con soporte dark). */
  badgeClass: string
  /** Color sólido para gráficos (token de chart). */
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
  /** Timestamp legible ya formateado, ej "10 jul, 9:03 a. m." */
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
}

export const BASE_ACTIVATION_URL = "https://vidasegura.mx/activar"

export function linkFor(token: string): string {
  return `${BASE_ACTIVATION_URL}/${token}`
}

const NOMBRES = [
  "Sofía Ramírez",
  "Mateo Herrera",
  "Valentina Castro",
  "Santiago Morales",
  "Isabella Vargas",
  "Sebastián Rojas",
  "Camila Fuentes",
  "Diego Mendoza",
  "Luciana Paredes",
  "Nicolás Guerrero",
  "Mariana Delgado",
  "Alejandro Ríos",
  "Gabriela Salinas",
  "Emiliano Ortega",
  "Daniela Cordero",
  "Andrés Villalobos",
  "Renata Aguilar",
  "Joaquín Bravo",
  "Antonella Cabrera",
  "Tomás Escobar",
  "Regina Navarro",
  "Benjamín Cárdenas",
  "Fernanda Peña",
  "Maximiliano Soto",
  "Paula Miranda",
  "Ignacio Fuenzalida",
]

const EMPRESAS = [
  "Cafetería Luna",
  "Constructora Andes",
  "TechNova SA",
  "Grupo Marimar",
  "Logística del Sur",
]

interface PlanDef {
  nombre: string
  monto: number
}

const PLANES: PlanDef[] = [
  { nombre: "Vida Básico", monto: 250000 },
  { nombre: "Vida Plus", monto: 500000 },
  { nombre: "Vida Familiar", monto: 750000 },
  { nombre: "Vida Premium", monto: 1000000 },
]

// Estado actual de cada colaborador (mezclado, suma controlada):
// activado x9 · respondio x4 · clic x5 · escaneo x2 · enviado x6 = 26
const STAGE_BY_INDEX: FunnelStage[] = [
  "activado",
  "respondio",
  "clic",
  "activado",
  "enviado",
  "activado",
  "respondio",
  "escaneo",
  "activado",
  "clic",
  "enviado",
  "activado",
  "respondio",
  "clic",
  "activado",
  "enviado",
  "escaneo",
  "activado",
  "clic",
  "respondio",
  "enviado",
  "activado",
  "clic",
  "enviado",
  "activado",
  "enviado",
]

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

function fmtFecha(day: number): string {
  return `${day} jul 2026`
}

function fmtEvento(day: number, hour: number, minute: number): string {
  const suffix = hour < 12 ? "a. m." : "p. m."
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  const mm = minute.toString().padStart(2, "0")
  return `${day} ${MESES[6]}, ${h12}:${mm} ${suffix}`
}

// Notas de ejemplo para algunos colaboradores (el resto sin notas).
const NOTAS_MUESTRA: Record<number, string> = {
  1: "Preguntó si podía agregar a su mamá como beneficiaria. Confirmado que sí.",
  6: "No respondió al primer mensaje, reenviado al día siguiente.",
  7: "Pidió el link por segunda vez, se lo reenvié.",
  10: "Cliente muy interesado, activó en menos de 2 min.",
  16: "Número parece equivocado, verificar con RRHH de la empresa.",
  19: "Dudó sobre si el seguro tenía costo. Aclarado que es gratuito.",
}

function buildHistorial(
  stage: FunnelStage,
  altaDay: number,
  seed: number
): FunnelEvent[] {
  const reachedIndex = FUNNEL_ORDER.indexOf(stage)
  const events: FunnelEvent[] = []
  // Minutos acumulados entre etapas, variados por seed pero determinísticos.
  const gaps = [0, 12 + (seed % 7), 4 + (seed % 5), 3 + (seed % 4), 2 + (seed % 3)]
  let minutes = 3 + (seed % 25) // primer envío entre 9:03 y 9:27
  let hour = 9
  for (let i = 0; i <= reachedIndex; i++) {
    minutes += gaps[i]
    while (minutes >= 60) {
      minutes -= 60
      hour += 1
    }
    events.push({
      stage: FUNNEL_ORDER[i],
      timestamp: fmtEvento(altaDay, hour, minutes),
    })
  }
  return events
}

export const COLABORADORES: Colaborador[] = NOMBRES.map((nombre, i) => {
  const empresa = EMPRESAS[i % EMPRESAS.length]
  const plan = PLANES[(i * 3 + 1) % PLANES.length]
  const stage = STAGE_BY_INDEX[i]
  const altaDay = 6 + (i % 6) // altas del 6 al 11 de julio
  const token = `AC-${(1000 + i * 37).toString(36).toUpperCase()}-${(i + 1)
    .toString()
    .padStart(2, "0")}`
  const telefono = `+52 55 ${(1000 + i * 131).toString().slice(0, 4)} ${(
    5000 +
    i * 77
  )
    .toString()
    .slice(0, 4)}`

  return {
    id: `col-${(i + 1).toString().padStart(2, "0")}`,
    nombre,
    empresa,
    fechaAlta: `2026-07-${altaDay.toString().padStart(2, "0")}`,
    fechaAltaLabel: fmtFecha(altaDay),
    stage,
    token,
    montoCobertura: plan.monto,
    tipoPlan: plan.nombre,
    telefono,
    notas: NOTAS_MUESTRA[i] ?? "",
    historial: buildHistorial(stage, altaDay, i * 13 + 5),
  }
})

export const EMPRESAS_LIST = EMPRESAS

// --- Métricas derivadas ---

export function funnelCounts(colaboradores: Colaborador[] = COLABORADORES) {
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
  total: number
  activados: number
}

export function computeMetricas(
  colaboradores: Colaborador[] = COLABORADORES
): Metrica {
  const total = colaboradores.length
  const activados = colaboradores.filter((c) => c.stage === "activado").length
  const conClic = colaboradores.filter(
    (c) => FUNNEL_ORDER.indexOf(c.stage) >= FUNNEL_ORDER.indexOf("clic")
  ).length
  return {
    total,
    activados,
    activationRate: Math.round((activados / total) * 1000) / 10,
    clickRate: Math.round((conClic / total) * 1000) / 10,
    avgActivationLabel: "4 min 12 s",
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
