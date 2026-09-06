const rateLimiter = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(token: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const limit = rateLimiter.get(token)

  if (!limit || now > limit.resetAt) {
    rateLimiter.set(token, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}
