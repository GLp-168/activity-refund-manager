import { Op } from 'sequelize'
import { ActivityStoreLink, Store } from '../models/index.js'

const buildWhere = (filters = {}) => {
  const where = {}
  if (filters.activity_id) {
    if (Array.isArray(filters.activity_id)) {
      where.activity_id = { [Op.in]: filters.activity_id }
    } else {
      where.activity_id = filters.activity_id
    }
  }
  if (filters.store_id) {
    if (Array.isArray(filters.store_id)) {
      where.store_id = { [Op.in]: filters.store_id }
    } else {
      where.store_id = filters.store_id
    }
  }
  return where
}

export const listActivityStoreLinks = async (filters = {}, options = {}) =>
  ActivityStoreLink.findAll({
    where: buildWhere(filters),
    ...options,
    raw: true,
    order: [['id', 'ASC']],
  })

export const listActivityStoreLinksWithStores = async (filters = {}, options = {}) =>
  ActivityStoreLink.findAll({
    where: buildWhere(filters),
    include: [
      {
        model: Store,
        attributes: ['name', 'platform_type'],
      },
    ],
    ...options,
    raw: true,
    nest: true,
    order: [['id', 'ASC']],
  })

export const getActivityStoreLink = async (activityId, storeId, options = {}) =>
  ActivityStoreLink.findOne({
    where: { activity_id: activityId, store_id: storeId },
    ...options,
    raw: true,
  })

export const createActivityStoreLinks = async (records, options = {}) => {
  if (!records.length) {
    return []
  }
  const items = await ActivityStoreLink.bulkCreate(records, options)
  return items.map((item) => item.get({ plain: true }))
}

export const replaceActivityStoreLinks = async (activityId, records, options = {}) => {
  await ActivityStoreLink.destroy({ where: { activity_id: activityId }, ...options })
  return createActivityStoreLinks(records, options)
}

export const deleteActivityStoreLinksByActivityId = async (activityId, options = {}) => {
  await ActivityStoreLink.destroy({ where: { activity_id: activityId }, ...options })
}
