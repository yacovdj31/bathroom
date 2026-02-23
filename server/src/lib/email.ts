import sgMail from '@sendgrid/mail'

type QuoteEmailInput = {
  fullName: string
  email?: string
  eventDate: string
  cityOrArea: string
  trailerType: string
  message?: string
  createdAt: Date
}

export type QuoteEmailResult = {
  provider: 'SENDGRID' | 'DISABLED'
  to?: string
  from?: string
  messageId?: string
  statusCode?: number
}

export class QuoteEmailError extends Error {
  readonly details: Record<string, unknown>

  constructor(message: string, details: Record<string, unknown>) {
    super(message)
    this.name = 'QuoteEmailError'
    this.details = details
  }
}

const formatLine = (label: string, value?: string) =>
  `${label}: ${value && value.trim().length > 0 ? value : 'N/A'}`

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const normalizeError = (error: unknown) => {
  const err = error as
    | {
        message?: string
        response?: {
          statusCode?: number
          body?: unknown
          headers?: Record<string, string>
        }
      }
    | undefined

  return {
    message: err?.message ?? 'Unknown SendGrid error',
    statusCode: err?.response?.statusCode,
    body: err?.response?.body,
    headers: err?.response?.headers,
  }
}

export const sendQuoteEmail = async (payload: QuoteEmailInput): Promise<QuoteEmailResult> => {
  const provider = (process.env.EMAIL_PROVIDER || 'SENDGRID').toUpperCase()
  const sendingEnabled = String(process.env.SEND_QUOTE_EMAIL || '').toLowerCase() === 'true'
  if (!sendingEnabled) {
    return { provider: 'DISABLED' }
  }

  if (provider !== 'SENDGRID') {
    return { provider: 'DISABLED' }
  }

  const apiKey = process.env.SENDGRID_API_KEY
  const from = process.env.SENDGRID_FROM
  const to = process.env.ADMIN_EMAIL || 'bathroomsheli@gmail.com'

  if (!apiKey || !from || !to) {
    throw new QuoteEmailError('Email configuration is missing', {
      provider,
      missing: {
        SENDGRID_API_KEY: !apiKey,
        SENDGRID_FROM: !from,
        ADMIN_EMAIL: !to,
      },
    })
  }

  sgMail.setApiKey(apiKey)

  const timestamp = payload.createdAt.toISOString()
  const eventDate = payload.eventDate?.trim() || 'N/A'
  const cityOrArea = payload.cityOrArea?.trim() || 'N/A'
  const fullName = payload.fullName?.trim() || 'N/A'
  const email = payload.email?.trim() || 'N/A'
  const message = payload.message?.trim() || 'N/A'
  const trailerLabel =
    payload.trailerType === '2-stall'
      ? '2-stall suite'
      : payload.trailerType === '3-stall'
        ? '3-stall suite'
        : payload.trailerType
  const submittedAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(payload.createdAt)

  const plainText = [
    'New bathroomsheli Quote Request',
    '',
    formatLine('Name', fullName),
    formatLine('Email', email),
    formatLine('Event date', eventDate),
    formatLine('City/Area', cityOrArea),
    formatLine('Trailer type', trailerLabel),
    formatLine('Message', message),
    formatLine('Submitted (ET)', submittedAt),
    formatLine('Timestamp (UTC)', timestamp),
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.45; color: #111827;">
      <h2 style="margin: 0 0 14px; font-size: 20px;">New bathroomsheli Quote Request</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 680px; border: 1px solid #e5e7eb;">
        <tr style="background: #f8fafc;"><td style="width: 180px; font-weight: 700;">Name</td><td>${escapeHtml(fullName)}</td></tr>
        <tr><td style="font-weight: 700;">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">Event date</td><td>${escapeHtml(eventDate)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">City/Area</td><td>${escapeHtml(cityOrArea)}</td></tr>
        <tr><td style="font-weight: 700;">Trailer type</td><td>${escapeHtml(trailerLabel)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">Message</td><td>${escapeHtml(message)}</td></tr>
        <tr><td style="font-weight: 700;">Submitted (ET)</td><td>${escapeHtml(submittedAt)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">Timestamp (UTC)</td><td>${escapeHtml(timestamp)}</td></tr>
      </table>
    </div>
  `

  try {
    const [response] = await sgMail.send({
      to,
      from,
      replyTo: email !== 'N/A' ? email : undefined,
      subject: 'New bathroomsheli Quote Request',
      text: plainText,
      html,
    })

    return {
      provider: 'SENDGRID',
      to,
      from,
      statusCode: response?.statusCode,
      messageId: response?.headers?.['x-message-id'],
    }
  } catch (error) {
    const sendgrid = normalizeError(error)
    throw new QuoteEmailError('Failed to send quote email', {
      provider: 'SENDGRID',
      to,
      from,
      ...sendgrid,
    })
  }
}
