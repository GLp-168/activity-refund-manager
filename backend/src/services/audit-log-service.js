import { createAuditLog } from '../repositories/audit-log-repo.js'

export const buildAuditContext = ({ user, ip, userAgent } = {}) => ({
  operator_id: user?.id ?? null,
  operator_role: user?.role ?? null,
  ip_address: ip ? String(ip).slice(0, 45) : null,
  user_agent: userAgent ? String(userAgent).slice(0, 255) : null,
})

export const createAuditLogService = async ({ action, target_type, target_id, payload, context }) =>
  createAuditLog({
    action,
    target_type: target_type || null,
    target_id: target_id ?? null,
    payload: payload ?? null,
    ...context,
  })
