import { sendQuoteEmail } from './lib/email.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const now = new Date()
  try {
    const result = await sendQuoteEmail({
      fullName: 'Email Debug Probe',
      email: 'debug@bathroomsheli.local',
      eventDate: now.toISOString().slice(0, 10),
      cityOrArea: 'N/A',
      trailerType: '2-stall',
      message: `Debug probe from /api/email-debug at ${now.toISOString()}`,
      createdAt: now,
    })
    return res.status(200).json({ ok: true, result })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Email debug failed',
      details: error?.details || null,
    })
  }
}
