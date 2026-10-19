import { Op } from 'sequelize'
import { WeightConfig } from '../models/index.js'

export const listWeightConfigs = async (options = {}) =>
  WeightConfig.findAll({ ...options, raw: true, order: [['id', 'ASC']] })

export const getWeightConfigById = async (id, options = {}) =>
  WeightConfig.findByPk(id, { ...options, raw: true })

export const getDefaultWeightConfig = async (options = {}) =>
  WeightConfig.findOne({ where: { is_default: true }, ...options, raw: true })

export const createWeightConfig = async (payload, options = {}) => {
  const config = await WeightConfig.create(payload, options)
  return config.get({ plain: true })
}

export const updateWeightConfig = async (id, payload, options = {}) => {
  await WeightConfig.update(payload, { where: { id }, ...options })
  return getWeightConfigById(id, options)
}

export const deleteWeightConfig = async (id, options = {}) => {
  const removed = await WeightConfig.destroy({ where: { id }, ...options })
  return removed > 0
}

export const clearDefaultWeightConfig = async (keepId, options = {}) => {
  if (keepId) {
    await WeightConfig.update(
      { is_default: false },
      { where: { id: { [Op.ne]: keepId } }, ...options },
    )
    await WeightConfig.update({ is_default: true }, { where: { id: keepId }, ...options })
    return
  }
  await WeightConfig.update({ is_default: false }, { where: {}, ...options })
}
