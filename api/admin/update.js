import { z } from 'zod'
import { connectToDatabase } from '../lib/mongo.js'
import { Quote } from '../lib/quote-model.js'
import { setApiCors, verifyAdminCode } from '../lib/admin-auth.js'

const updateSchema = z.object({
  id: z.string().min(1),
  answered: z.boolean().optional(),
  paidDownpayment: z.boolean().optional(),
  paidFully: z.boolean().optional(),
  wantsAnotherDate: z.boolean().optional(),
  eventDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  trailerType: z.enum(['2-stall', '3-stall']).optional(),
})

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
  setApiCors(res, 'PATCH,OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH, OPTIONS')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const auth = verifyAdminCode(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const parsed = updateSchema.safeParse(normalizeBody(req.body))
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() })
  }

  const { id, ...fields } = parsed.data
  const update = { ...fields }
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
  if (update.paidFully) {
    update.paidDownpayment = true
  }
  if (Object.prototype.hasOwnProperty.call(update, 'answered')) {
    update.answeredAt = update.answered ? new Date() : null
  }

  try {
    await connectToDatabase()
    const item = await Quote.findByIdAndUpdate(id, update, { new: true }).lean()
    if (!item) {
      return res.status(404).json({ ok: false, error: 'Quote not found' })
    }
    return res.status(200).json({ ok: true, item })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to update quote',
    })
  }
}
