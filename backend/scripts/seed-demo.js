import { sequelize, closeDatabase } from '../src/config/db.js'
import { Activity, Store, Signup, WeightConfig } from '../src/models/index.js'
import { createActivityService } from '../src/services/activity-service.js'
import { createSignupService } from '../src/services/signup-service.js'

try {
  if (await Activity.count() || await Store.count() || await Signup.count() || await WeightConfig.count()) {
    throw new Error('Demo seed requires an empty database; no existing data has been changed.')
  }
  await sequelize.transaction(async (transaction) => {
    await Store.create({ name: '演示店铺（虚构）', platform_type: 'other' }, { transaction })
  })
  const store = await Store.findOne()
  const activity = await createActivityService({
    name: '示例商品体验活动', product_intro: '仅供本地演示，所有信息均为虚构。',
    product_images: ['/demo-product.svg'], status: 'active', max_participants: 20,
    store_links: [{ store_id: store.id, product_url: 'https://example.com/demo-product' }],
  })
  await createSignupService({
    activity_id: activity.id, store_id: store.id,
    wechat_nickname: '演示用户', phone_number: '00000000000',
  })
  console.log('Demo activity, store and signup created. No real accounts or payment data used.')
} finally {
  await closeDatabase()
}
