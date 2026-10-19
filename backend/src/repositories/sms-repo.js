import { SmsRecord } from '../models/index.js'

export const listSmsRecords = async (options = {}) =>
  SmsRecord.findAll({ ...options, raw: true, order: [['id', 'ASC']] })

export const createSmsRecord = async (payload, options = {}) => {
  const record = await SmsRecord.create(payload, options)
  return record.get({ plain: true })
}
