import crypto from 'crypto'
import { Router } from 'express'
import { z } from 'zod'
import { Quote } from '../models/Quote.js'

const router = Router()

const timingSafeEqual = (provided: string, expected: string) => {
  const left = Buffer.from(provided || '')
  const right = Buffer.from(expected || '')
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

const verifyAdmin = (code: string) => {
  const expected = process.env.ADMIN_ACCESS_CODE || ''
  if (!expected) {
    return { ok: false, status: 500, error: 'ADMIN_ACCESS_CODE is not configured' }
  }
  if (!timingSafeEqual(code, expected)) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true as const }
}

router.get('/quotes', async (req, res) => {
  const code = String(req.headers['x-admin-code'] || '')
  const auth = verifyAdmin(code)
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error })

  const { from, to, eventFrom, eventTo, trailerType, answered, payment } = req.query
  const query: Record<string, unknown> = {}

  if (typeof from === 'string' || typeof to === 'string') {
    query.createdAt = {}
    if (typeof from === 'string' && from) {
      ;(query.createdAt as Record<string, Date>).$gte = new Date(`${from}T00:00:00.000Z`)
    }
    if (typeof to === 'string' && to) {
      ;(query.createdAt as Record<string, Date>).$lte = new Date(`${to}T23:59:59.999Z`)
    }
  }

  if (typeof eventFrom === 'string' && eventFrom) {
    query.eventDate = { ...(query.eventDate as object), $gte: eventFrom }
  }
  if (typeof eventTo === 'string' && eventTo) {
    query.eventDate = { ...(query.eventDate as object), $lte: eventTo }
  }
  if (trailerType === '2-stall' || trailerType === '3-stall') {
    query.trailerType = trailerType
  }
  if (answered === 'true' || answered === 'false') {
    query.answered = answered === 'true'
  }
  if (payment === 'full') {
    query.paidFully = true
  } else if (payment === 'downpayment') {
    query.paidDownpayment = true
    query.paidFully = false
  } else if (payment === 'none') {
    query.paidDownpayment = false
    query.paidFully = false
  }

  const items = await Quote.find(query).sort({ createdAt: -1 }).lean()
  return res.json({ ok: true, count: items.length, items })
})

const updateSchema = z.object({
  id: z.string().min(1),
  answered: z.boolean().optional(),
  paidDownpayment: z.boolean().optional(),
  paidFully: z.boolean().optional(),
  wantsAnotherDate: z.boolean().optional(),
  eventDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  trailerType: z.enum(['2-stall', '3-stall']).optional(),
  note: z.string().max(2000).optional(),
})

router.patch('/update', async (req, res) => {
  const code = String(req.headers['x-admin-code'] || '')
  const auth = verifyAdmin(code)
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error })

  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() })
  }

  const { id, ...fields } = parsed.data
  const update: Record<string, unknown> = { ...fields }
  const hasEventDate = Object.prototype.hasOwnProperty.call(update, 'eventDate')
  const hasEventEndDate = Object.prototype.hasOwnProperty.call(update, 'eventEndDate')
  if (hasEventDate && !hasEventEndDate) {
    update.eventEndDate = update.eventDate
  }
  if (
    typeof update.eventDate === 'string' &&
    typeof update.eventEndDate === 'string' &&
    update.eventEndDate < update.eventDate
  ) {
    update.eventEndDate = update.eventDate
  }
  if (update.paidFully === true) {
    update.paidDownpayment = true
  }
  if (Object.prototype.hasOwnProperty.call(update, 'answered')) {
    update.answeredAt = update.answered ? new Date() : null
  }

  const item = await Quote.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!item) return res.status(404).json({ ok: false, error: 'Quote not found' })
  return res.json({ ok: true, item })
})

export default router
