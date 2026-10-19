import { AuditLog } from '../models/index.js'

export const listAuditLogs = async (filters = {}, options = {}) => {
  const where = {}
  if (filters.action) {
    where.action = filters.action
  }
  if (filters.target_type) {
    where.target_type = filters.target_type
  }
  if (filters.target_id) {
    where.target_id = filters.target_id
  }
  return AuditLog.findAll({ where, ...options, raw: true, order: [['id', 'ASC']] })
}

export const createAuditLog = async (payload, options = {}) => {
  const log = await AuditLog.create(payload, options)
  return log.get({ plain: true })
}
