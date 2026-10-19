import { sequelize } from '../config/db.js'
import {
  createActivity,
  deleteActivity,
  getActivityById,
  listActivities,
  updateActivity,
} from '../repositories/activity-repo.js'
import {
  createActivityStoreLinks,
  listActivityStoreLinksWithStores,
  replaceActivityStoreLinks,
} from '../repositories/activity-store-link-repo.js'
import { listStoresByIds } from '../repositories/store-repo.js'
import { AppError } from '../utils/errors.js'
import {
  ensureEnum,
  optionalNumber,
  optionalString,
  requiredNumber,
  requiredString,
} from '../utils/validation.js'

const activityStatuses = ['draft', 'active', 'ended', 'cancelled']

const normalizeOutputImages = (images) => {
  if (Array.isArray(images)) {
    return images
  }
  if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      return []
    }
  }
  return []
}

const normalizeProductImages = (images) => {
  const list = Array.isArray(images) ? images : []
  const normalized = list.map((item) => String(item ?? '').trim()).filter(Boolean)
  if (!normalized.length) {
    throw new AppError('至少需要一张商品图片', 400, 'VALIDATION_ERROR')
  }
  return normalized
}

const ensureStoreLinks = async (links, options = {}) => {
  if (!Array.isArray(links) || !links.length) {
    throw new AppError('请至少选择一个店铺', 400, 'VALIDATION_ERROR')
  }
  const normalized = links.map((link) => ({
    store_id: requiredNumber(link.store_id, '店铺ID'),
    product_url: requiredString(link.product_url, '商品链接'),
  }))
  const storeIds = normalized.map((item) => item.store_id)
  const uniqueStoreIds = Array.from(new Set(storeIds))
  if (uniqueStoreIds.length !== storeIds.length) {
    throw new AppError('店铺不能重复', 400, 'VALIDATION_ERROR')
  }
  const stores = await listStoresByIds(uniqueStoreIds, options)
  if (stores.length !== uniqueStoreIds.length) {
    throw new AppError('存在无效店铺', 400, 'VALIDATION_ERROR')
  }
  return normalized
}

const buildStoreLinksMap = (links) => {
  const map = new Map()
  links.forEach((link) => {
    const item = {
      id: link.id,
      activity_id: link.activity_id,
      store_id: link.store_id,
      store_name: link.Store?.name ?? '',
      store_platform: link.Store?.platform_type ?? 'other',
      product_url: link.product_url,
    }
    if (!map.has(link.activity_id)) {
      map.set(link.activity_id, [])
    }
    map.get(link.activity_id).push(item)
  })
  return map
}

const attachStoreLinks = async (activities, options = {}) => {
  if (!activities.length) {
    return []
  }
  const activityIds = activities.map((item) => item.id)
  const storeLinks = await listActivityStoreLinksWithStores({ activity_id: activityIds }, options)
  const storeLinkMap = buildStoreLinksMap(storeLinks)
  return activities.map((activity) => ({
    ...activity,
    product_images: normalizeOutputImages(activity.product_images),
    store_links: storeLinkMap.get(activity.id) ?? [],
  }))
}

export const listActivitiesService = async ({ status, page, size }) => {
  let items = await listActivities()
  if (status) {
    items = items.filter((item) => item.status === status)
  }
  const total = items.length
  const currentPage = page && page > 0 ? page : 1
  const pageSize = size && size > 0 ? size : total
  const start = (currentPage - 1) * pageSize
  const paged = items.slice(start, start + pageSize)
  const hydrated = await attachStoreLinks(paged)
  return {
    items: hydrated,
    total,
    page: currentPage,
    size: pageSize,
  }
}

export const getActivityService = async (id) => {
  const activity = await getActivityById(id)
  if (!activity) {
    throw new AppError('活动不存在', 404, 'NOT_FOUND')
  }
  const [hydrated] = await attachStoreLinks([activity])
  return hydrated
}

export const createActivityService = async (payload) =>
  sequelize.transaction(async (transaction) => {
    const name = requiredString(payload.name, '活动名称')
    const productIntro = requiredString(payload.product_intro, '商品简介')
    const productImages = normalizeProductImages(payload.product_images)
    const storeLinks = await ensureStoreLinks(payload.store_links, { transaction })
    const maxParticipants = optionalNumber(payload.max_participants, 0)
    const status = ensureEnum(payload.status || 'draft', activityStatuses, '活动状态')
    const activity = await createActivity(
      {
        name,
        product_intro: productIntro,
        product_images: productImages,
        max_participants: maxParticipants,
        current_participants: 0,
        status,
        start_time: optionalString(payload.start_time) || null,
        end_time: optionalString(payload.end_time) || null,
        weight_config_id: payload.weight_config_id || null,
      },
      { transaction },
    )
    await createActivityStoreLinks(
      storeLinks.map((link) => ({ ...link, activity_id: activity.id })),
      { transaction },
    )
    const [hydrated] = await attachStoreLinks([activity], { transaction })
    return hydrated
  })

export const updateActivityService = async (id, payload) =>
  sequelize.transaction(async (transaction) => {
    const activity = await getActivityById(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    if (!activity) {
      throw new AppError('活动不存在', 404, 'NOT_FOUND')
    }
    const name = requiredString(payload.name, '活动名称')
    const productIntro = requiredString(payload.product_intro, '商品简介')
    const productImages = normalizeProductImages(payload.product_images)
    const storeLinks = await ensureStoreLinks(payload.store_links, { transaction })
    const maxParticipants = optionalNumber(payload.max_participants, 0)
    const status = ensureEnum(payload.status || activity.status, activityStatuses, '活动状态')
    await updateActivity(
      id,
      {
        name,
        product_intro: productIntro,
        product_images: productImages,
        max_participants: maxParticipants,
        status,
        start_time: optionalString(payload.start_time) || null,
        end_time: optionalString(payload.end_time) || null,
        weight_config_id: payload.weight_config_id || null,
      },
      { transaction },
    )
    await replaceActivityStoreLinks(
      id,
      storeLinks.map((link) => ({ ...link, activity_id: id })),
      { transaction },
    )
    const updated = await getActivityById(id, { transaction })
    const [hydrated] = await attachStoreLinks([updated], { transaction })
    return hydrated
  })

export const deleteActivityService = async (id) => {
  const removed = await deleteActivity(id)
  if (!removed) {
    throw new AppError('活动不存在', 404, 'NOT_FOUND')
  }
}
