import { Op } from 'sequelize'
import { Signup } from '../models/index.js'
import { buildSignupCode } from '../utils/ids.js'

export const listSignups = async (filters = {}, options = {}) => {
  const where = {}
  if (filters.id) {
    if (Array.isArray(filters.id)) {
      where.id = { [Op.in]: filters.id }
    } else {
      where.id = filters.id
    }
  }
  if (filters.activity_id) {
    where.activity_id = filters.activity_id
  }
  if (filters.status) {
    where.status = filters.status
  }
  if (filters.comment_result) {
    where.comment_result = filters.comment_result
  }
  if (filters.refund_status) {
    where.refund_status = filters.refund_status
  }
  if (filters.store_id) {
    where.store_id = filters.store_id
  }
  if (filters.wechat_nickname) {
    where.wechat_nickname = filters.wechat_nickname
  }
  if (filters.phone_number) {
    where.phone_number = filters.phone_number
  }
  if (filters.signup_code) {
    where.signup_code = filters.signup_code
  }
  return Signup.findAll({ where, ...options, raw: true, order: [['id', 'ASC']] })
}

export const listSignupsByIds = async (ids, options = {}) => {
  if (!ids.length) {
    return []
  }
  return Signup.findAll({
    where: { id: { [Op.in]: ids } },
    ...options,
    raw: true,
  })
}

export const getSignupById = async (id, options = {}) =>
  Signup.findByPk(id, { ...options, raw: true })

export const findDuplicateSignup = async (activityId, wechatNickname, phoneNumber, options = {}) =>
  Signup.findOne({
    where: {
      activity_id: activityId,
      wechat_nickname: wechatNickname,
      phone_number: phoneNumber,
    },
    ...options,
    raw: true,
  })

export const createSignup = async (payload, options = {}) => {
  const signup = await Signup.create(
    {
      ...payload,
      signup_code: payload.signup_code || buildSignupCode(Math.floor(Math.random() * 9000 + 1000)),
    },
    options,
  )
  return signup.get({ plain: true })
}

export const updateSignup = async (id, payload, options = {}) => {
  await Signup.update(payload, { where: { id }, ...options })
  return getSignupById(id, options)
}

export const bulkUpdateSignups = async (ids, payload, options = {}) => {
  await Signup.update(payload, {
    where: { id: { [Op.in]: ids } },
    ...options,
  })
  return listSignups({ id: ids }, options)
}

export const deleteSignupsByActivity = async (activityId, options = {}) => {
  await Signup.destroy({ where: { activity_id: activityId }, ...options })
}
