import { RefundRecord } from '../models/index.js'

import { Op } from 'sequelize'

export const listRefundRecords = async (filters = {}, options = {}) => {
  const where = {}
  if (filters.status) {
    where.status = filters.status
  }
  if (filters.batch_no) {
    where.batch_no = filters.batch_no
  }
  if (filters.date_range) {
    const start = filters.date_range.start
    const end = filters.date_range.end
    if (start && end) {
      where.created_at = { [Op.between]: [start, end] }
    } else if (start) {
      where.created_at = { [Op.gte]: start }
    } else if (end) {
      where.created_at = { [Op.lte]: end }
    }
  }
  return RefundRecord.findAll({ where, ...options, raw: true, order: [['id', 'ASC']] })
}

export const getRefundRecordById = async (id, options = {}) =>
  RefundRecord.findByPk(id, { ...options, raw: true })

export const createRefundRecords = async (records, options = {}) => {
  const created = []
  for (const record of records) {
    const item = await RefundRecord.create(record, options)
    created.push(item.get({ plain: true }))
  }
  return created
}

export const updateRefundRecord = async (id, payload, options = {}) => {
  await RefundRecord.update(payload, { where: { id }, ...options })
  return getRefundRecordById(id, options)
}

export const deleteRefundRecordsByActivity = async (activityId, options = {}) => {
  await RefundRecord.destroy({ where: { activity_id: activityId }, ...options })
}
