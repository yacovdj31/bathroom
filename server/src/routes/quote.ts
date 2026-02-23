import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { Quote } from '../models/Quote.js'

const router = Router()

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

router.post('/', async (req, res) => {
  const requestId = crypto.randomUUID()
  const parseResult = quoteSchema.safeParse(req.body)
  if (!parseResult.success) {
    const flattened = parseResult.error.flatten()
    console.warn('Quote validation failed', { requestId, fieldErrors: flattened.fieldErrors })
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
    if (!firstName) firstName = parts[0] || ''
    if (!lastName) lastName = parts.slice(1).join(' ') || 'N/A'
  }
  if (!firstName || !lastName) {
    return res.status(400).json({ ok: false, requestId, error: 'firstName and lastName are required' })
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

  const quoteData = {
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
