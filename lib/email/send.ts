import nodemailer from 'nodemailer'

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !port || !user || !pass) {
    throw new Error('Faltan variables de entorno SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD')
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  })

  return transporter
}

interface SendActivationEmailInput {
  to: string
  nombre: string
  empresa: string
  montoCobertura: number
  link: string
}

export async function sendActivationEmail({
  to,
  nombre,
  empresa,
  montoCobertura,
  link,
}: SendActivationEmailInput): Promise<void> {
  const montoFormateado = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(montoCobertura)

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <p style="color: #1c2b28; font-size: 16px;">Hola ${nombre},</p>
      <p style="color: #1c2b28; font-size: 16px; line-height: 1.5;">
        <strong>${empresa}</strong> activó un seguro de vida para ti, sin costo.
        Tu cobertura es de <strong>${montoFormateado}</strong> para tu familia.
      </p>
      <p style="margin: 24px 0;">
        <a href="${link}" style="background: #1f7a5c; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          Activar mi seguro
        </a>
      </p>
      <p style="color: #6f6656; font-size: 13px;">Toma menos de 1 minuto. Si el botón no funciona, copia este link: ${link}</p>
    </div>
  `.trim()

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `${nombre}, tu seguro de vida ya está esperándote`,
    html,
  })
}
