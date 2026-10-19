const parseNumber = (value, fallback) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return fallback
  }
  return parsed
}

const parseList = (value, fallback) => {
  if (!value) {
    return fallback
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const normalized = String(value).toLowerCase()
  if (['true', '1', 'yes'].includes(normalized)) {
    return true
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false
  }
  return fallback
}

const requiredSecret = (name, minLength) => {
  const value = process.env[name] || ''
  if (value.length < minLength || /^(change[-_]?me|replace[-_]?me)/i.test(value)) {
    throw new Error(`${name} must be configured with at least ${minLength} characters`)
  }
  return value
}

export const env = {
  host: process.env.HOST || '127.0.0.1',
  port: parseNumber(process.env.PORT, 3000),
  jwtSecret: requiredSecret('JWT_SECRET', 32),
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN || '8h',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: requiredSecret('ADMIN_PASSWORD', 12),
  corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:5173']),
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: parseNumber(process.env.DB_PORT, 3306),
  dbName: process.env.DB_NAME || 'activity_refund_manager',
  dbUser: process.env.DB_USER || 'activity_refund_app',
  dbPassword: process.env.DB_PASSWORD || '',
  dbSync: parseBoolean(process.env.DB_SYNC, false),
  dbLogging: parseBoolean(process.env.DB_LOGGING, false),
}
