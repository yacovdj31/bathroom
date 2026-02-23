import crypto from 'node:crypto'
import { connectToDatabase } from './lib/mongo.js'
import { Quote } from './lib/quote-model.js'

const normalizeEventDate = (value) => {
  const date = String(value || '').trim()
  if (!date) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const ddmmyyyy = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!ddmmyyyy) return date
  const [, d, m, y] = ddmmyyyy
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const asText = (value) => {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

const asBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
  }
  if (typeof value === 'number') return value === 1
  return false
}

const normalizeTrailerType = (value) => {
  const raw = String(value || '').toLowerCase().trim()
  if (raw.includes('3')) return '3-stall'
  if (raw.includes('2')) return '2-stall'
  return raw
}

const normalizeBody = (body) => {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return body
}

export default async function handler(req, res) {
  const requestId = crypto.randomUUID()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ ok: false, error: 'Method not allowed', requestId })
  }

  const body = normalizeBody(req.body)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      ok: false,
      requestId,
      reason: 'Invalid form payload',
      error: 'Body must be a JSON object',
    })
  }

  const email = asText(body.email)
  const phone = asText(body.phone)
  const eventDate = normalizeEventDate(asText(body.eventDate))
  let eventEndDate = normalizeEventDate(asText(body.eventEndDate))
  const trailerType = normalizeTrailerType(asText(body.trailerType || body.trailer))
  const cityOrArea = asText(body.cityOrArea || body.city || body.area)
  const message = asText(body.message)
  const wantsAnotherDate = asBoolean(body.wantsAnotherDate)
  let firstName = asText(body.firstName)
  let lastName = asText(body.lastName)
  const fallbackFullName = asText(body.fullName || body.name)

  if ((!firstName || !lastName) && fallbackFullName) {
    const parts = fallbackFullName.split(/\s+/).filter(Boolean)
    if (!firstName) {
      firstName = parts[0] || ''
    }
    if (!lastName) {
      lastName = parts.slice(1).join(' ') || 'N/A'
    }
  }

  if (!firstName || !lastName) {
    return res.status(400).json({
      ok: false,
      error: 'firstName and lastName are required',
      requestId,
    })
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ ok: false, requestId, reason: 'Invalid email' })
  }
  if (!phone || phone.length < 6) {
    return res.status(400).json({ ok: false, requestId, reason: 'Invalid phone number' })
  }
  if (!eventDate) {
    return res.status(400).json({ ok: false, requestId, reason: 'Event date is required' })
  }
  if (!eventEndDate) {
    eventEndDate = eventDate
  }
  if (eventEndDate < eventDate) {
    eventEndDate = eventDate
  }
  if (!['2-stall', '3-stall'].includes(trailerType)) {
    return res.status(400).json({
      ok: false,
      requestId,
      reason: 'Invalid trailer type',
      error: { trailerType: body.trailerType || body.trailer },
    })
  }

  const createdAt = new Date()
  const payload = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    eventDate,
    eventEndDate,
    cityOrArea,
    trailerType,
    message,
    wantsAnotherDate,
    paidDownpayment: false,
    paidFully: false,
    answered: false,
    createdAt,
  }

  console.log(
    JSON.stringify({
      at: 'quote.submit.start',
      requestId,
      trailerType: payload.trailerType,
      hasMessage: Boolean(payload.message?.trim()),
      createdAt: createdAt.toISOString(),
    }),
  )

  let savedQuote = null
  try {
    await connectToDatabase()
    savedQuote = await Quote.create(payload)
  } catch (error) {
    console.error(
      JSON.stringify({
        at: 'quote.db.save_failed',
        requestId,
        message: error instanceof Error ? error.message : String(error),
      }),
    )
    return res.status(500).json({
      ok: false,
      error: 'Unable to save quote request',
      requestId,
    })
  }

  return res.status(200).json({
    ok: true,
    requestId,
    quoteId: String(savedQuote?._id || ''),
    email: {
      provider: (process.env.EMAIL_PROVIDER || 'SENDGRID').toUpperCase(),
      skipped: true,
      reason: 'Email notifications are disabled. Use /admin to view requests.',
      messageId: null,
      statusCode: null,
    },
    warning: null,
  })
}
