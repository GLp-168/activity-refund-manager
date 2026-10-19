import { Activity } from '../models/index.js'

export const listActivities = async (options = {}) =>
  Activity.findAll({ ...options, raw: true, order: [['id', 'ASC']] })

export const getActivityById = async (id, options = {}) =>
  Activity.findByPk(id, { ...options, raw: true })

export const listActivitiesByIds = async (ids, options = {}) => {
  if (!ids.length) {
    return []
  }
  return Activity.findAll({
    where: { id: ids },
    ...options,
    raw: true,
  })
}

export const createActivity = async (payload, options = {}) => {
  const activity = await Activity.create(payload, options)
  return activity.get({ plain: true })
}

export const updateActivity = async (id, payload, options = {}) => {
  await Activity.update(payload, { where: { id }, ...options })
  return getActivityById(id, options)
}

export const deleteActivity = async (id, options = {}) => {
  const removed = await Activity.destroy({ where: { id }, ...options })
  return removed > 0
}
