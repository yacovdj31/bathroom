import crypto from 'node:crypto'

const timingSafeEqual = (a, b) => {
  const left = Buffer.from(String(a || ''))
  const right = Buffer.from(String(b || ''))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export function verifyAdminCode(req) {
  const expected = process.env.ADMIN_ACCESS_CODE || ''
  if (!expected) {
    return { ok: false, status: 500, error: 'ADMIN_ACCESS_CODE is not configured' }
  }
  const provided = req.headers['x-admin-code']
  if (!timingSafeEqual(provided, expected)) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true }
}

export function setApiCors(res, methods) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-code')
}
