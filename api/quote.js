import { z } from 'zod'
import crypto from 'node:crypto'
import { connectToDatabase } from './lib/mongo.js'
import { Quote } from './lib/quote-model.js'

const quoteSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  fullName: z.string().trim().min(1).optional(),
  email: z.string().email(),
  phone: z.union([z.string(), z.number()]).transform((value) => String(value).trim()),
  eventDate: z.string().min(1),
  cityOrArea: z.string().optional().or(z.literal('')),
  trailerType: z.string().min(1),
  message: z.string().optional().or(z.literal('')),
  wantsAnotherDate: z.boolean().optional(),
})

const normalizeEventDate = (value) => {
  const date = String(value || '').trim()
  if (!date) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const ddmmyyyy = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!ddmmyyyy) return date
  const [, d, m, y] = ddmmyyyy
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
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

  const parseResult = quoteSchema.safeParse(normalizeBody(req.body))
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten()
    console.warn(
      JSON.stringify({
        at: 'quote.validation_failed',
        requestId,
        fieldErrors: flattened.fieldErrors,
      }),
    )
    return res.status(400).json({
      ok: false,
      requestId,
      reason: 'Invalid form payload',
      error: flattened,
    })
  }

  let firstName = parseResult.data.firstName?.trim() || ''
  let lastName = parseResult.data.lastName?.trim() || ''
  const fallbackFullName = parseResult.data.fullName?.trim() || ''

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

  const trailerType = normalizeTrailerType(parseResult.data.trailerType)
  const eventDate = normalizeEventDate(parseResult.data.eventDate)
  if (!['2-stall', '3-stall'].includes(trailerType)) {
    return res.status(400).json({
      ok: false,
      requestId,
      reason: 'Invalid trailer type',
      error: { trailerType: parseResult.data.trailerType },
    })
  }

  const createdAt = new Date()
  const payload = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email: parseResult.data.email.trim(),
    phone: parseResult.data.phone.trim(),
    eventDate,
    cityOrArea: parseResult.data.cityOrArea?.trim() || '',
    trailerType,
    message: parseResult.data.message?.trim() || '',
    wantsAnotherDate: Boolean(parseResult.data.wantsAnotherDate),
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
