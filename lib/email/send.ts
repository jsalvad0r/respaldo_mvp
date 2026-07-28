import { readFile } from 'fs/promises'
import path from 'path'

import nodemailer from 'nodemailer'

const LOGO_CID = 'respaldo-logo'
const FAMILY_CID = 'family-hero'

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null
let brandAssetsPromise: Promise<{
  logo: Buffer
  family: Buffer
}> | null = null

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function getBrandAssets() {
  if (!brandAssetsPromise) {
    brandAssetsPromise = Promise.all([
      readFile(path.join(process.cwd(), 'public', 'logo.png')),
      readFile(path.join(process.cwd(), 'public', 'family-hero.png')),
    ]).then(([logo, family]) => ({ logo, family }))
  }

  return brandAssetsPromise
}

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
  const safeNombre = escapeHtml(nombre)
  const safeEmpresa = escapeHtml(empresa)
  const safeLink = escapeHtml(link)

  const montoFormateado = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(montoCobertura)

  const assets = await getBrandAssets()

  const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 32px 16px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="padding: 28px 24px 20px; text-align: center; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
          <img src="cid:${LOGO_CID}" alt="Respaldo · Seguros de vida" width="200" style="display: block; width: 200px; max-width: 100%; height: auto; margin: 0 auto;" />
        </div>

        <img src="cid:${FAMILY_CID}" alt="Una familia protegida por su seguro de vida" width="520" style="display: block; width: 100%; max-width: 520px; height: auto;" />

        <div style="padding: 28px 24px 24px;">
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 10px;">
            ${safeEmpresa} te protege
          </p>
          <p style="color: #111827; font-size: 18px; font-weight: 700; line-height: 1.4; margin: 0 0 16px;">
            Hola ${safeNombre}, tu seguro de vida ya está esperándote
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            <strong>${safeEmpresa}</strong> activó un seguro de vida para ti, sin costo.
            Tu cobertura es de <strong style="color: #1d2a72;">${montoFormateado}</strong> para tu familia.
          </p>

          <div style="background: #eaf1ff; border: 1px solid #c7d7fe; border-radius: 14px; padding: 16px 18px; margin: 0 0 24px; text-align: center;">
            <p style="color: #6b7280; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px;">
              Cobertura total
            </p>
            <p style="color: #2f80ff; font-size: 28px; font-weight: 800; margin: 0;">
              ${montoFormateado}
            </p>
          </div>

          <p style="margin: 0 0 20px; text-align: center;">
            <a href="${safeLink}" style="background: #1d2a72; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Activar mi seguro
            </a>
          </p>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
            Toma menos de 1 minuto. Si el botón no funciona, copia este link:<br />
            <a href="${safeLink}" style="color: #2f80ff; word-break: break-all;">${safeLink}</a>
          </p>
        </div>
      </div>
    </div>
  `.trim()

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `${nombre}, tu seguro de vida ya está esperándote`,
    html,
    attachments: [
      {
        filename: 'logo.png',
        content: assets.logo,
        cid: LOGO_CID,
      },
      {
        filename: 'family-hero.png',
        content: assets.family,
        cid: FAMILY_CID,
      },
    ],
  })
}
