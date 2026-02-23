export default async function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (_req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const provider = (process.env.EMAIL_PROVIDER || 'SENDGRID').toUpperCase()
  const sendingEnabled = String(process.env.SEND_QUOTE_EMAIL || '').toLowerCase() === 'true'
  const from = process.env.SENDGRID_FROM || ''
  const hasApiKey = Boolean(process.env.SENDGRID_API_KEY)
  const to = 'bathroomsheli@gmail.com'
  const fromDomain = from.includes('@') ? from.split('@')[1].toLowerCase() : ''
  const riskyDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']

  const warnings = []
  if (provider !== 'SENDGRID') {
    warnings.push('EMAIL_PROVIDER is not SENDGRID, so quote email sending is skipped.')
  }
  if (!sendingEnabled) {
    warnings.push('SEND_QUOTE_EMAIL is false, so quote email sending is disabled.')
  }
  if (!hasApiKey) {
    warnings.push('SENDGRID_API_KEY is missing.')
  }
  if (!from) {
    warnings.push('SENDGRID_FROM is missing.')
  }
  if (fromDomain && riskyDomains.includes(fromDomain)) {
    warnings.push(
      `SENDGRID_FROM uses ${fromDomain}. This often fails unless that sender identity is explicitly verified in SendGrid.`,
    )
  }

  return res.status(200).json({
    ok: true,
    provider,
    sendgridConfigured: sendingEnabled && provider === 'SENDGRID' && hasApiKey && Boolean(from),
    sendingEnabled,
    hasApiKey,
    fromConfigured: Boolean(from),
    from,
    to,
    warnings,
  })
}
