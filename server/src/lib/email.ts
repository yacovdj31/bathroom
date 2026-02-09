import sgMail from '@sendgrid/mail'

type QuoteEmailInput = {
  fullName: string
  email?: string
  phone?: string
  eventDate: string
  cityOrArea: string
  trailerType: string
  message?: string
  createdAt: Date
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

export const sendQuoteEmail = async (payload: QuoteEmailInput) => {
  const provider = process.env.EMAIL_PROVIDER
  if (provider !== 'SENDGRID') {
    return
  }

  const apiKey = process.env.SENDGRID_API_KEY
  const from = process.env.SENDGRID_FROM
  const to = process.env.ADMIN_EMAIL || 'yacovjacobson@gmail.com'

  if (!apiKey || !from || !to) {
    throw new Error('Email configuration is missing')
  }

  sgMail.setApiKey(apiKey)

  const timestamp = payload.createdAt.toISOString()
  const eventDate = payload.eventDate?.trim() || 'N/A'
  const cityOrArea = payload.cityOrArea?.trim() || 'N/A'
  const fullName = payload.fullName?.trim() || 'N/A'
  const email = payload.email?.trim() || 'N/A'
  const phone = payload.phone?.trim() || 'N/A'
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
    'New JewHaven Quote Request',
    '',
    formatLine('Name', fullName),
    formatLine('Email', email),
    formatLine('Phone', phone),
    formatLine('Event date', eventDate),
    formatLine('City/Area', cityOrArea),
    formatLine('Trailer type', trailerLabel),
    formatLine('Message', message),
    formatLine('Submitted (ET)', submittedAt),
    formatLine('Timestamp (UTC)', timestamp),
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.45; color: #111827;">
      <h2 style="margin: 0 0 14px; font-size: 20px;">New JewHaven Quote Request</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 680px; border: 1px solid #e5e7eb;">
        <tr style="background: #f8fafc;"><td style="width: 180px; font-weight: 700;">Name</td><td>${escapeHtml(fullName)}</td></tr>
        <tr><td style="font-weight: 700;">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">Phone</td><td>${escapeHtml(phone)}</td></tr>
        <tr><td style="font-weight: 700;">Event date</td><td>${escapeHtml(eventDate)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">City/Area</td><td>${escapeHtml(cityOrArea)}</td></tr>
        <tr><td style="font-weight: 700;">Trailer type</td><td>${escapeHtml(trailerLabel)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">Message</td><td>${escapeHtml(message)}</td></tr>
        <tr><td style="font-weight: 700;">Submitted (ET)</td><td>${escapeHtml(submittedAt)}</td></tr>
        <tr style="background: #f8fafc;"><td style="font-weight: 700;">Timestamp (UTC)</td><td>${escapeHtml(timestamp)}</td></tr>
      </table>
    </div>
  `

  await sgMail.send({
    to,
    from,
    subject: 'New JewHaven Quote Request',
    text: plainText,
    html,
  })
}
