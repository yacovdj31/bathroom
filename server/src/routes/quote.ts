import { Router } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { Quote } from '../models/Quote.js'
import { QuoteEmailError, sendQuoteEmail } from '../lib/email.js'

const router = Router()

const quoteSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  eventDate: z.string().min(1),
  cityOrArea: z.string().min(1),
  trailerType: z.enum(['2-stall', '3-stall']),
  message: z.string().optional().or(z.literal('')),
})

router.post('/', async (req, res) => {
  const requestId = crypto.randomUUID()
  const parseResult = quoteSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, requestId, error: parseResult.error.flatten() })
  }

  let createdAt = new Date()
  try {
    const quote = await Quote.create(parseResult.data)
    createdAt = quote.createdAt ?? createdAt
  } catch (error) {
    console.error('Quote DB save failed, sending email only', error)
  }

  try {
    const emailResult = await sendQuoteEmail({
      ...parseResult.data,
      createdAt,
    })

    console.log('Quote email status', {
      requestId,
      provider: emailResult.provider,
      statusCode: emailResult.statusCode,
      messageId: emailResult.messageId,
      to: emailResult.to,
      from: emailResult.from,
    })
  } catch (error) {
    if (error instanceof QuoteEmailError) {
      console.error('Quote email failed', {
        requestId,
        ...error.details,
      })
      return res.status(502).json({
        ok: false,
        requestId,
        error: 'EMAIL_SEND_FAILED',
        details: error.details,
      })
    }

    console.error('Quote email failed (unknown error)', { requestId, error })
    return res.status(500).json({
      ok: false,
      requestId,
      error: 'EMAIL_UNKNOWN_ERROR',
    })
  }

  return res.json({ ok: true, requestId })
})

export default router
