import { Op } from 'sequelize'
import { Store } from '../models/index.js'

export const listStores = async (options = {}) =>
  Store.findAll({ ...options, raw: true, order: [['id', 'ASC']] })

export const listStoresByIds = async (ids, options = {}) => {
  if (!ids.length) {
    return []
  }
  return Store.findAll({
    where: { id: { [Op.in]: ids } },
    ...options,
    raw: true,
  })
}

export const getStoreById = async (id, options = {}) =>
  Store.findByPk(id, { ...options, raw: true })

export const createStore = async (payload, options = {}) => {
  const store = await Store.create(payload, options)
  return store.get({ plain: true })
}

export const updateStore = async (id, payload, options = {}) => {
  await Store.update(payload, { where: { id }, ...options })
  return getStoreById(id, options)
}

export const deleteStore = async (id, options = {}) => {
  const removed = await Store.destroy({ where: { id }, ...options })
  return removed > 0
}
