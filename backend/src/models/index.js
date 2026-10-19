import { Activity } from './activity.js'
import { ActivityStoreLink } from './activity-store-link.js'
import { Signup } from './signup.js'
import { RefundRecord } from './refund-record.js'
import { WeightConfig } from './weight-config.js'
import { SmsRecord } from './sms-record.js'
import { AuditLog } from './audit-log.js'
import { Store } from './store.js'

Activity.hasMany(Signup, { foreignKey: 'activity_id' })
Signup.belongsTo(Activity, { foreignKey: 'activity_id' })

Activity.hasMany(ActivityStoreLink, { foreignKey: 'activity_id' })
ActivityStoreLink.belongsTo(Activity, { foreignKey: 'activity_id' })

Store.hasMany(ActivityStoreLink, { foreignKey: 'store_id' })
ActivityStoreLink.belongsTo(Store, { foreignKey: 'store_id' })

Store.hasMany(Signup, { foreignKey: 'store_id' })
Signup.belongsTo(Store, { foreignKey: 'store_id' })

WeightConfig.hasMany(Activity, { foreignKey: 'weight_config_id' })
Activity.belongsTo(WeightConfig, { foreignKey: 'weight_config_id' })

Signup.hasMany(RefundRecord, { foreignKey: 'signup_id' })
RefundRecord.belongsTo(Signup, { foreignKey: 'signup_id' })

Activity.hasMany(RefundRecord, { foreignKey: 'activity_id' })
RefundRecord.belongsTo(Activity, { foreignKey: 'activity_id' })

Signup.hasMany(SmsRecord, { foreignKey: 'signup_id' })
SmsRecord.belongsTo(Signup, { foreignKey: 'signup_id' })

export {
  Activity,
  ActivityStoreLink,
  Signup,
  RefundRecord,
  WeightConfig,
  SmsRecord,
  AuditLog,
  Store,
}
