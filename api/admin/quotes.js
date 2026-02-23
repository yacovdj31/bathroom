import { connectToDatabase } from '../lib/mongo.js'
import { Quote } from '../lib/quote-model.js'
import { setApiCors, verifyAdminCode } from '../lib/admin-auth.js'

const normalizeToDate = (value, endOfDay = false) => {
  if (!value || typeof value !== 'string') return null
  const iso = endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export default async function handler(req, res) {
  setApiCors(res, 'GET,OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const auth = verifyAdminCode(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  try {
    await connectToDatabase()

    const { from, to, eventFrom, eventTo, trailerType, answered, payment } = req.query
    const query = {}

    const createdAtFrom = normalizeToDate(from)
    const createdAtTo = normalizeToDate(to, true)
    if (createdAtFrom || createdAtTo) {
      query.createdAt = {}
      if (createdAtFrom) query.createdAt.$gte = createdAtFrom
      if (createdAtTo) query.createdAt.$lte = createdAtTo
    }

    if (typeof eventFrom === 'string' && eventFrom) {
      query.eventDate = { ...(query.eventDate || {}), $gte: eventFrom }
    }
    if (typeof eventTo === 'string' && eventTo) {
      query.eventDate = { ...(query.eventDate || {}), $lte: eventTo }
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
    return res.status(200).json({ ok: true, count: items.length, items })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to load quotes',
    })
  }
}
