import { sequelize } from '../config/db.js'
import { getActivityById, updateActivity } from '../repositories/activity-repo.js'
import {
  getActivityStoreLink,
  listActivityStoreLinksWithStores,
} from '../repositories/activity-store-link-repo.js'
import {
  createSignup,
  findDuplicateSignup,
  getSignupById,
  listSignups,
  updateSignup,
} from '../repositories/signup-repo.js'
import { AppError } from '../utils/errors.js'
import { optionalString, requiredNumber, requiredString } from '../utils/validation.js'

const buildSignupViews = async (activity, signups) => {
  const storeLinks = await listActivityStoreLinksWithStores({ activity_id: activity.id })
  const linkMap = new Map(storeLinks.map((link) => [link.store_id, link]))
  return signups.map((signup) => {
    const link = linkMap.get(signup.store_id)
    return {
      ...signup,
      activity_name: activity.name,
      store_name: link?.Store?.name ?? '未知店铺',
      store_platform: link?.Store?.platform_type ?? 'other',
      product_url: link?.product_url ?? '',
      refund_amount: signup.refund_amount ?? 0,
    }
  })
}

export const createSignupService = async (payload) =>
  sequelize.transaction(async (transaction) => {
    const activityId = requiredNumber(payload.activity_id, '活动ID')
    const activity = await getActivityById(activityId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    if (!activity) {
      throw new AppError('活动不存在', 404, 'NOT_FOUND')
    }
    if (activity.status !== 'active') {
      throw new AppError('活动未开始或已结束', 400, 'ACTIVITY_INACTIVE')
    }
    if (
      activity.max_participants > 0 &&
      activity.current_participants >= activity.max_participants
    ) {
      throw new AppError('活动名额已满', 400, 'ACTIVITY_FULL')
    }
    const storeId = requiredNumber(payload.store_id, '店铺ID')
    const storeLink = await getActivityStoreLink(activity.id, storeId, { transaction })
    if (!storeLink) {
      throw new AppError('店铺链接不存在', 400, 'STORE_LINK_MISSING')
    }
    const wechatNickname = requiredString(payload.wechat_nickname, '微信昵称')
    const phoneNumber = requiredString(payload.phone_number, '手机号')
    const exists = await findDuplicateSignup(activity.id, wechatNickname, phoneNumber, {
      transaction,
    })
    if (exists) {
      throw new AppError('您已报名此活动', 400, 'DUPLICATE_SIGNUP')
    }

    const signup = await createSignup(
      {
        activity_id: activity.id,
        store_id: storeId,
        wechat_nickname: wechatNickname,
        phone_number: phoneNumber,
        status: 'signed_up',
        comment_fetch_status: 'pending',
        comment_result: 'unknown',
      },
      { transaction },
    )

    await updateActivity(
      activity.id,
      { current_participants: activity.current_participants + 1 },
      { transaction },
    )

    return { signup, product_url: storeLink.product_url }
  })

export const querySignupsService = async ({
  activity_id,
  wechat_nickname,
  phone_number,
  signup_code,
}) => {
  const activityId = requiredNumber(activity_id, '活动ID')
  const activity = await getActivityById(activityId)
  if (!activity) {
    throw new AppError('活动不存在', 404, 'NOT_FOUND')
  }
  const wechatNickname = requiredString(wechat_nickname, '微信昵称')
  const phoneNumber = requiredString(phone_number, '手机号')
  const code = optionalString(signup_code)
  const list = await listSignups({
    activity_id: activityId,
    wechat_nickname: wechatNickname,
    phone_number: phoneNumber,
    signup_code: code || null,
  })
  if (!list.length) {
    return []
  }
  return buildSignupViews(activity, list)
}

export const updateSignupService = async (id, payload) => {
  const signup = await getSignupById(id)
  if (!signup) {
    throw new AppError('报名记录不存在', 404, 'NOT_FOUND')
  }
  if (signup.status === 'refunded' || signup.status === 'voided') {
    throw new AppError('当前状态不可修改', 400, 'STATUS_LOCKED')
  }
  const orderNumber = optionalString(payload.order_number)
  const alipayAccount = optionalString(payload.alipay_account)
  const alipayName = optionalString(payload.alipay_name)
  const hasOrderInfo = Boolean(orderNumber) && Boolean(alipayAccount) && Boolean(alipayName)

  return updateSignup(id, {
    order_number: orderNumber || signup.order_number,
    alipay_account: alipayAccount || signup.alipay_account,
    alipay_name: alipayName || signup.alipay_name,
    status: hasOrderInfo && signup.status === 'signed_up' ? 'ordered' : signup.status,
  })
}

export const adminUpdateSignupService = async (id, payload) => {
  const signup = await getSignupById(id)
  if (!signup) {
    throw new AppError('报名记录不存在', 404, 'NOT_FOUND')
  }
  return updateSignup(id, payload)
}

export const listSignupsByActivityService = async ({
  activity_id,
  status,
  comment_result,
  refund_status,
}) => {
  const activityId = requiredNumber(activity_id, '活动ID')
  const activity = await getActivityById(activityId)
  if (!activity) {
    throw new AppError('活动不存在', 404, 'NOT_FOUND')
  }
  const signups = await listSignups({
    activity_id: activityId,
    status,
    comment_result,
    refund_status,
  })
  if (!signups.length) {
    return []
  }
  return buildSignupViews(activity, signups)
}
