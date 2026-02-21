import { sendQuoteEmail } from './lib/email.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
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
