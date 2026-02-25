import { Router } from 'express'
import crypto from 'crypto'
import { Quote } from '../models/Quote.js'

const router = Router()

const normalizeEventDate = (value: string) => {
  const date = String(value || '').trim()
  if (!date) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const ddmmyyyy = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!ddmmyyyy) return date
  const [, d, m, y] = ddmmyyyy
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const normalizeTrailerType = (value: string) => {
  const raw = String(value || '').toLowerCase().trim()
  if (raw.includes('3')) return '3-stall'
  if (raw.includes('2')) return '2-stall'
  return raw
}

const asText = (value: unknown) => {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

router.post('/', async (req, res) => {
  const requestId = crypto.randomUUID()
  const body = req.body as Record<string, unknown> | undefined
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      ok: false,
      requestId,
      reason: 'Invalid form payload',
      error: 'Body must be a JSON object',
    })
  }

  const email = asText(body.email).toLowerCase()
  const phone = asText(body.phone)
  const eventDate = normalizeEventDate(asText(body.eventDate))
  let eventEndDate = normalizeEventDate(asText(body.eventEndDate))
  const startTime = asText(body.startTime)
  const endTime = asText(body.endTime)
  const trailerType = normalizeTrailerType(asText(body.trailerType || body.trailer))
  const cityOrArea = asText(body.cityOrArea || body.city || body.area)
  const message = asText(body.message)
  let firstName = asText(body.firstName)
  let lastName = asText(body.lastName)
  const fallbackFullName = asText(body.fullName || body.name)
  if ((!firstName || !lastName) && fallbackFullName) {
    const parts = fallbackFullName.split(/\s+/).filter(Boolean)
    if (!firstName) firstName = parts[0] || ''
    if (!lastName) lastName = parts.slice(1).join(' ') || 'N/A'
  }
  if (!firstName || !lastName) {
    return res.status(400).json({ ok: false, requestId, error: 'firstName and lastName are required' })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  const quoteData = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    eventDate,
    eventEndDate,
    startTime,
    endTime,
    cityOrArea,
    trailerType,
    message,
    wantsAnotherDate: false,
    paidDownpayment: false,
    paidFully: false,
    answered: false,
  }

  try {
    await Quote.create(quoteData)
  } catch (error) {
    console.error('Quote DB save failed', error)
    return res.status(500).json({
      ok: false,
      requestId,
      error: 'Unable to save quote request',
    })
  }

  return res.json({
    ok: true,
    requestId,
    email: {
      skipped: true,
      reason: 'Email notifications are disabled. Use /admin to view requests.',
    },
  })
})

export default router
