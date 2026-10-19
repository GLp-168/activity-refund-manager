import { AppError } from './errors.js'

export const requiredString = (value, label) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    throw new AppError(`${label}不能为空`, 400, 'VALIDATION_ERROR')
  }
  return trimmed
}

export const optionalString = (value) => {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value).trim()
}

export const requiredNumber = (value, label) => {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) {
    throw new AppError(`${label}必须为数字`, 400, 'VALIDATION_ERROR')
  }
  return numberValue
}

export const optionalNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) {
    return fallback
  }
  return numberValue
}

export const optionalDateRange = (value) => {
  if (value === undefined || value === null || value === '') {
    return null
  }
  const raw = Array.isArray(value) ? value.join(',') : String(value)
  const parts = raw.split(',')
  const start = (parts[0] || '').trim()
  const end = (parts[1] || '').trim()
  if (!start && !end) {
    return null
  }
  return {
    start: start || null,
    end: end || null,
  }
}

export const ensureEnum = (value, allowed, label) => {
  if (!allowed.includes(value)) {
    throw new AppError(`${label}不合法`, 400, 'VALIDATION_ERROR')
  }
  return value
}
