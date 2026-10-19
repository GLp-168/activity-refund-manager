import express from 'express'
import { asyncHandler } from '../middleware/async-handler.js'
import { requireAdmin } from '../middleware/auth.js'
import { sendSuccess } from '../utils/response.js'
import { AppError } from '../utils/errors.js'
import { authenticateAdmin } from '../services/auth-service.js'
import {
  createActivityService,
  deleteActivityService,
  getActivityService,
  listActivitiesService,
  updateActivityService,
} from '../services/activity-service.js'
import {
  createStoreService,
  deleteStoreService,
  listStoresService,
  updateStoreService,
} from '../services/store-service.js'
import {
  adminUpdateSignupService,
  listSignupsByActivityService,
} from '../services/signup-service.js'
import {
  bulkUpdateSignups,
  deleteSignupsByActivity,
  getSignupById,
  listSignups,
} from '../repositories/signup-repo.js'
import { deleteRefundRecordsByActivity, listRefundRecords } from '../repositories/refund-repo.js'
import {
  clearDefaultWeightConfig,
  createWeightConfig,
  deleteWeightConfig,
  getWeightConfigById,
  listWeightConfigs,
  updateWeightConfig,
} from '../repositories/weight-config-repo.js'
import { fetchCommentsService } from '../services/comment-service.js'
import { createRefundBatchService, retryRefundService } from '../services/refund-service.js'
import { sendSmsService } from '../services/sms-service.js'
import {
  optionalDateRange,
  optionalString,
  requiredNumber,
  requiredString,
} from '../utils/validation.js'
import { buildAuditContext, createAuditLogService } from '../services/audit-log-service.js'

const router = express.Router()

const getRequestAuditContext = (req) =>
  buildAuditContext({
    user: req.user,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  })

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const username = requiredString(req.body?.username, '账号')
    const password = requiredString(req.body?.password, '密码')
    const result = authenticateAdmin(username, password)
    sendSuccess(res, result)
  }),
)

router.use(requireAdmin)

router.get(
  '/stores',
  asyncHandler(async (req, res) => {
    const items = await listStoresService()
    sendSuccess(res, { items })
  }),
)

router.post(
  '/stores',
  asyncHandler(async (req, res) => {
    const store = await createStoreService(req.body)
    sendSuccess(res, store)
  }),
)

router.put(
  '/stores/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!id) {
      throw new AppError('店铺ID不合法', 400, 'VALIDATION_ERROR')
    }
    const store = await updateStoreService(id, req.body)
    sendSuccess(res, store)
  }),
)

router.delete(
  '/stores/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!id) {
      throw new AppError('店铺ID不合法', 400, 'VALIDATION_ERROR')
    }
    await deleteStoreService(id)
    sendSuccess(res, true)
  }),
)

router.get(
  '/activities',
  asyncHandler(async (req, res) => {
    const data = await listActivitiesService({
      status: req.query.status || null,
      page: Number(req.query.page || 1),
      size: Number(req.query.size || 50),
    })
    sendSuccess(res, data)
  }),
)

router.post(
  '/activities',
  asyncHandler(async (req, res) => {
    const activity = await createActivityService(req.body)
    sendSuccess(res, activity)
  }),
)

router.get(
  '/activities/:id',
  asyncHandler(async (req, res) => {
    const activity = await getActivityService(Number(req.params.id))
    sendSuccess(res, activity)
  }),
)

router.put(
  '/activities/:id',
  asyncHandler(async (req, res) => {
    const activity = await updateActivityService(Number(req.params.id), req.body)
    sendSuccess(res, activity)
  }),
)

router.delete(
  '/activities/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    await deleteActivityService(id)
    await deleteSignupsByActivity(id)
    await deleteRefundRecordsByActivity(id)
    sendSuccess(res, true)
  }),
)

router.get(
  '/activities/:id/signups',
  asyncHandler(async (req, res) => {
    const activityId = Number(req.params.id)
    if (!activityId) {
      throw new AppError('活动ID不合法', 400, 'VALIDATION_ERROR')
    }
    const items = await listSignupsByActivityService({
      activity_id: activityId,
      status: req.query.status || null,
      comment_result: req.query.comment_result || null,
      refund_status: req.query.refund_status || null,
    })
    sendSuccess(res, { items })
  }),
)

router.put(
  '/signups/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const before = await getSignupById(id)
    const signup = await adminUpdateSignupService(id, req.body)
    if (before && before.status !== 'voided' && signup.status === 'voided') {
      await createAuditLogService({
        action: 'signup_void',
        target_type: 'signup',
        target_id: signup.id,
        payload: {
          void_reason: signup.void_reason || null,
        },
        context: getRequestAuditContext(req),
      })
    }
    sendSuccess(res, signup)
  }),
)

router.post(
  '/signups/bulk-status',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.signup_ids) ? req.body.signup_ids : []
    if (!ids.length) {
      throw new AppError('报名记录不能为空', 400, 'VALIDATION_ERROR')
    }
    const status = requiredString(req.body.status, '状态')
    const voidReason = optionalString(req.body.void_reason)
    const updated = await bulkUpdateSignups(ids, {
      status,
      void_reason: status === 'voided' ? voidReason || '批量作废' : undefined,
    })
    if (status === 'voided') {
      await createAuditLogService({
        action: 'signup_void_bulk',
        target_type: 'signup',
        payload: {
          signup_ids: ids,
          void_reason: voidReason || null,
        },
        context: getRequestAuditContext(req),
      })
    }
    sendSuccess(res, { items: updated })
  }),
)

router.post(
  '/comments/fetch',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.signup_ids) ? req.body.signup_ids : []
    const activityId = Number(req.body.activity_id || 0)
    const comments = Array.isArray(req.body.comments) ? req.body.comments : []
    const commentMap = new Map()
    if (comments.length) {
      comments.forEach((item) => {
        const signupId = requiredNumber(item.signup_id, '报名ID')
        const rating = requiredNumber(item.rating, '评论星级')
        if (rating < 1 || rating > 5) {
          throw new AppError('评论星级需为 1-5', 400, 'VALIDATION_ERROR')
        }
        const content = requiredString(item.content, '评论内容')
        const images = Array.isArray(item.images)
          ? item.images.map((image) => String(image || '').trim()).filter(Boolean)
          : []
        commentMap.set(signupId, { rating, content, images })
      })
    }
    const targetIds = commentMap.size
      ? Array.from(commentMap.keys())
      : ids.length
        ? ids
        : (await listSignups({ activity_id: activityId })).map((item) => item.id)
    if (!targetIds.length) {
      throw new AppError('没有可拉取的报名记录', 400, 'VALIDATION_ERROR')
    }
    const updated = await fetchCommentsService(targetIds, commentMap)
    const voided = updated.filter((item) => item.status === 'voided')
    if (voided.length) {
      await createAuditLogService({
        action: 'signup_void_comment',
        target_type: 'signup',
        payload: {
          signup_ids: voided.map((item) => item.id),
        },
        context: getRequestAuditContext(req),
      })
    }
    sendSuccess(res, { items: updated })
  }),
)

router.post(
  '/refunds/batch',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.signup_ids) ? req.body.signup_ids : []
    const batchNo = optionalString(req.body.batch_no) || null
    const result = await createRefundBatchService(ids, batchNo)
    await createAuditLogService({
      action: 'refund_batch',
      target_type: 'refund_batch',
      payload: {
        batch_no: result.batch_no,
        signup_ids: ids,
        refund_count: result.records.length,
      },
      context: getRequestAuditContext(req),
    })
    sendSuccess(res, result)
  }),
)

router.get(
  '/refunds',
  asyncHandler(async (req, res) => {
    const status = optionalString(req.query.status)
    const batchNo = optionalString(req.query.batch_no)
    const dateRange = optionalDateRange(req.query.date_range)
    const items = await listRefundRecords({
      status: status || null,
      batch_no: batchNo || null,
      date_range: dateRange,
    })
    sendSuccess(res, { items })
  }),
)

router.post(
  '/refunds/:id/retry',
  asyncHandler(async (req, res) => {
    const record = await retryRefundService(Number(req.params.id))
    await createAuditLogService({
      action: 'refund_retry',
      target_type: 'refund_record',
      target_id: record.id,
      payload: {
        signup_id: record.signup_id,
      },
      context: getRequestAuditContext(req),
    })
    sendSuccess(res, record)
  }),
)

router.post(
  '/refunds/notify',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body.signup_ids) ? req.body.signup_ids : []
    const result = await sendSmsService(ids)
    sendSuccess(res, { items: result })
  }),
)

router.get(
  '/weight-configs',
  asyncHandler(async (req, res) => {
    const items = await listWeightConfigs()
    sendSuccess(res, { items })
  }),
)

router.post(
  '/weight-configs',
  asyncHandler(async (req, res) => {
    const payload = {
      name: requiredString(req.body.name, '配置名称'),
      platform_type: req.body.platform_type || 'all',
      config: req.body.config,
      is_default: Boolean(req.body.is_default),
    }
    if (payload.is_default) {
      await clearDefaultWeightConfig(null)
    }
    const config = await createWeightConfig(payload)
    if (payload.is_default) {
      await clearDefaultWeightConfig(config.id)
    }
    await createAuditLogService({
      action: 'weight_config_create',
      target_type: 'weight_config',
      target_id: config.id,
      payload: {
        name: config.name,
        is_default: config.is_default,
      },
      context: getRequestAuditContext(req),
    })
    sendSuccess(res, config)
  }),
)

router.put(
  '/weight-configs/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const payload = {
      name: requiredString(req.body.name, '配置名称'),
      platform_type: req.body.platform_type || 'all',
      config: req.body.config,
      is_default: Boolean(req.body.is_default),
    }
    const existing = await getWeightConfigById(id)
    if (!existing) {
      throw new AppError('配置不存在', 404, 'NOT_FOUND')
    }
    if (payload.is_default) {
      await clearDefaultWeightConfig(id)
    }
    const config = await updateWeightConfig(id, payload)
    await createAuditLogService({
      action: 'weight_config_update',
      target_type: 'weight_config',
      target_id: config.id,
      payload: {
        name: config.name,
        is_default: config.is_default,
      },
      context: getRequestAuditContext(req),
    })
    sendSuccess(res, config)
  }),
)

router.delete(
  '/weight-configs/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const removed = await deleteWeightConfig(id)
    if (!removed) {
      throw new AppError('配置不存在', 404, 'NOT_FOUND')
    }
    await createAuditLogService({
      action: 'weight_config_delete',
      target_type: 'weight_config',
      target_id: id,
      context: getRequestAuditContext(req),
    })
    sendSuccess(res, true)
  }),
)

export default router
