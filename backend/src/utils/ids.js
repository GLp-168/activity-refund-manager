export const nextId = (items) => {
  if (!items.length) {
    return 1
  }
  return Math.max(...items.map((item) => item.id)) + 1
}

export const buildSignupCode = (id, date = new Date()) => {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`
  return `SU-${stamp}-${String(id).padStart(4, '0')}`
}

export const buildBatchNo = (date = new Date()) => {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `BATCH-${stamp}-${random}`
}

export const nowIso = () => new Date().toISOString()
