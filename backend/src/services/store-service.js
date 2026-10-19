import { AppError } from '../utils/errors.js'
import { ensureEnum, requiredString } from '../utils/validation.js'
import {
  createStore,
  deleteStore,
  getStoreById,
  listStores,
  updateStore,
} from '../repositories/store-repo.js'

const platformTypes = ['taobao', 'jd', 'pdd', 'other']

export const listStoresService = async () => listStores()

export const createStoreService = async (payload) => {
  const name = requiredString(payload.name, '店铺名称')
  const platformType = ensureEnum(payload.platform_type, platformTypes, '平台类型')
  return createStore({
    name,
    platform_type: platformType,
  })
}

export const updateStoreService = async (id, payload) => {
  const store = await getStoreById(id)
  if (!store) {
    throw new AppError('店铺不存在', 404, 'NOT_FOUND')
  }
  const name = requiredString(payload.name, '店铺名称')
  const platformType = ensureEnum(payload.platform_type, platformTypes, '平台类型')
  return updateStore(id, {
    name,
    platform_type: platformType,
  })
}

export const deleteStoreService = async (id) => {
  try {
    const removed = await deleteStore(id)
    if (!removed) {
      throw new AppError('店铺不存在', 404, 'NOT_FOUND')
    }
  } catch (error) {
    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      throw new AppError('店铺已被引用，无法删除', 400, 'STORE_IN_USE')
    }
    throw error
  }
}
