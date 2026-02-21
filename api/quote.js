import { z } from 'zod'
import crypto from 'node:crypto'
import { connectToDatabase } from './lib/mongo.js'
import { Quote } from './lib/quote-model.js'
import { sendQuoteEmail } from './lib/email.js'

const quoteSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  eventDate: z.string().min(1),
  cityOrArea: z.string().min(1),
  trailerType: z.enum(['2-stall', '3-stall']),
  message: z.string().optional().or(z.literal('')),
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
  const requestId = crypto.randomUUID()

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed', requestId })
  }

  const parseResult = quoteSchema.safeParse(normalizeBody(req.body))
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: parseResult.error.flatten(), requestId })
  }

  const createdAt = new Date()
  const payload = {
    ...parseResult.data,
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

  let emailResult = null
  try {
    emailResult = await sendQuoteEmail(payload)
    console.log(
      JSON.stringify({
        at: 'quote.email.sent',
        requestId,
        provider: emailResult?.provider || null,
        statusCode: emailResult?.statusCode || null,
        messageId: emailResult?.messageId || null,
        skipped: emailResult?.skipped || false,
      }),
    )
  } catch (error) {
    const details = error?.details || {}
    console.error(
      JSON.stringify({
        at: 'quote.email.failed',
        requestId,
        statusCode: details.statusCode || null,
        message: details.message || error?.message || null,
        likelyCause: details.likelyCause || null,
        field: details.field || null,
      }),
    )
    const maybeStatus = details.statusCode || 'unknown'
    const maybeMessage = details.message || error?.message || 'Unable to send quote request'
    return res.status(500).json({
      ok: false,
      error: 'Unable to send quote request',
      reason: `sendgrid:${maybeStatus}:${maybeMessage}`,
      likelyCause: details.likelyCause || null,
      requestId,
    })
  }

  try {
    await Promise.race([
      (async () => {
        await connectToDatabase()
        await Quote.create(parseResult.data)
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB save timeout')), 1200),
      ),
    ])
  } catch (error) {
    console.error(
      JSON.stringify({
        at: 'quote.db.save_failed',
        requestId,
        message: error instanceof Error ? error.message : String(error),
      }),
    )
  }

  return res.status(200).json({
    ok: true,
    requestId,
    email: {
      provider: emailResult?.provider || null,
      messageId: emailResult?.messageId || null,
      statusCode: emailResult?.statusCode || null,
      skipped: emailResult?.skipped || false,
    },
  })
}
