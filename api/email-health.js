export default async function handler(_req, res) {
  const provider = (process.env.EMAIL_PROVIDER || 'SENDGRID').toUpperCase()
  const from = process.env.SENDGRID_FROM || ''
  const hasApiKey = Boolean(process.env.SENDGRID_API_KEY)
  const to = 'bathroomsheli@gmail.com'
  const fromDomain = from.includes('@') ? from.split('@')[1].toLowerCase() : ''
  const riskyDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']

  const warnings = []
  if (provider !== 'SENDGRID') {
    warnings.push('EMAIL_PROVIDER is not SENDGRID, so quote email sending is skipped.')
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
    sendgridConfigured: provider === 'SENDGRID' && hasApiKey && Boolean(from),
    hasApiKey,
    fromConfigured: Boolean(from),
    from,
    to,
    warnings,
  })
}
