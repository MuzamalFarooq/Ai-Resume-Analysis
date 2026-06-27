const rateLimitMap = new Map();

export function rateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }

  const timestamps = rateLimitMap.get(identifier);
  const validTimestamps = timestamps.filter((t) => t > windowStart);
  rateLimitMap.set(identifier, validTimestamps);

  if (validTimestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  validTimestamps.push(now);
  return { success: true, remaining: limit - validTimestamps.length };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => t > now - 300000);
    if (valid.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, valid);
  }
}, 300000);
