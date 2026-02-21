import sgMail from '@sendgrid/mail'

const formatLine = (label, value) => `${label}: ${value && value.trim().length > 0 ? value : 'N/A'}`

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const extractSendgridError = (error) => {
  const statusCode = error?.code || error?.response?.statusCode || null
  const responseBody = error?.response?.body || null
  const firstError = responseBody?.errors?.[0] || null
  const message = firstError?.message || error?.message || 'Unknown email error'

  return {
    statusCode,
    message,
    field: firstError?.field || null,
    help: firstError?.help || null,
    responseBody,
  }
}

const inferLikelyCause = ({ statusCode, message }) => {
  const lower = String(message || '').toLowerCase()
  if (statusCode === 401 || lower.includes('permission') || lower.includes('unauthorized')) {
    return 'Invalid or unauthorized SENDGRID_API_KEY'
  }
  if (
    statusCode === 403 &&
    (lower.includes('verified sender') ||
      lower.includes('from address') ||
      lower.includes('sender identity'))
  ) {
    return 'SENDGRID_FROM is not a verified sender identity in SendGrid'
  }
  if (statusCode === 429) {
    return 'SendGrid rate limit exceeded'
  }
  return null
}

export async function sendQuoteEmail(payload) {
  const provider = (process.env.EMAIL_PROVIDER || 'SENDGRID').toUpperCase()
  if (provider !== 'SENDGRID') {
    return {
      ok: true,
      skipped: true,
      provider,
      reason: 'Email provider is not SENDGRID',
    }
  }

  const apiKey = process.env.SENDGRID_API_KEY
  const from = process.env.SENDGRID_FROM
  const to = 'bathroomsheli@gmail.com'

  if (!apiKey || !from || !to) {
    throw new Error('Email configuration is missing')
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
      ok: true,
      skipped: false,
      provider,
      to,
      from,
      statusCode: response?.statusCode || null,
      messageId:
        response?.headers?.['x-message-id'] ||
        response?.headers?.['X-Message-Id'] ||
        null,
    }
  } catch (error) {
    const sendgridError = extractSendgridError(error)
    const likelyCause = inferLikelyCause(sendgridError)
    const wrappedError = new Error(`SendGrid send failed: ${sendgridError.message}`)
    wrappedError.details = {
      provider,
      to,
      from,
      ...sendgridError,
      likelyCause,
    }
    throw wrappedError
  }
}
