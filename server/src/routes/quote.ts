import { Router } from 'express'
import { z } from 'zod'
import { Quote } from '../models/Quote'
import { sendQuoteEmail } from '../lib/email'

const router = Router()

const quoteSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  eventDate: z.string().min(1),
  cityOrArea: z.string().min(1),
  trailerType: z.enum(['2-stall', '3-stall']),
  message: z.string().optional().or(z.literal('')),
})

router.post('/', async (req, res) => {
  const parseResult = quoteSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: parseResult.error.flatten() })
  }

  let createdAt = new Date()
  try {
    const quote = await Quote.create(parseResult.data)
    createdAt = quote.createdAt ?? createdAt
  } catch (error) {
    console.error('Quote DB save failed, sending email only', error)
  }

  await sendQuoteEmail({
    ...parseResult.data,
    createdAt,
  })

  return res.json({ ok: true })
})

export default router
