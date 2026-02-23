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
  phone: z.string().trim().min(6),
  eventDate: z.string().min(1),
  cityOrArea: z.string().optional().or(z.literal('')),
  trailerType: z.enum(['2-stall', '3-stall']),
  message: z.string().optional().or(z.literal('')),
  wantsAnotherDate: z.boolean().optional(),
})

router.post('/', async (req, res) => {
  const requestId = crypto.randomUUID()
  const parseResult = quoteSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, requestId, error: parseResult.error.flatten() })
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

  const quoteData = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email: parseResult.data.email.trim(),
    phone: parseResult.data.phone.trim(),
    eventDate: parseResult.data.eventDate.trim(),
    cityOrArea: parseResult.data.cityOrArea?.trim() || '',
    trailerType: parseResult.data.trailerType,
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
