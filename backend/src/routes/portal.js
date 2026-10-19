import express from 'express'
import { asyncHandler } from '../middleware/async-handler.js'
import { sendSuccess } from '../utils/response.js'
import {
  createSignupService,
  querySignupsService,
  updateSignupService,
} from '../services/signup-service.js'
import { getActivityService, listActivitiesService } from '../services/activity-service.js'
import { AppError } from '../utils/errors.js'

const router = express.Router()

router.get(
  '/activities',
  asyncHandler(async (req, res) => {
    const status = req.query.status || 'active'
    const page = Number(req.query.page || 1)
    const size = Number(req.query.size || 20)
    const data = await listActivitiesService({
      status: status === 'all' ? null : status,
      page,
      size,
    })
    sendSuccess(res, data)
  }),
)

router.get(
  '/activities/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!id) {
      throw new AppError('活动ID不合法', 400, 'VALIDATION_ERROR')
    }
    const activity = await getActivityService(id)
    sendSuccess(res, activity)
  }),
)

router.post(
  '/signups',
  asyncHandler(async (req, res) => {
    const result = await createSignupService(req.body)
    sendSuccess(res, {
      signup_id: result.signup.id,
      signup_code: result.signup.signup_code,
      status: result.signup.status,
      product_url: result.product_url,
    })
  }),
)

router.get(
  '/signups/query',
  asyncHandler(async (req, res) => {
    const data = await querySignupsService(req.query)
    sendSuccess(res, { items: data })
  }),
)

router.put(
  '/signups/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!id) {
      throw new AppError('报名ID不合法', 400, 'VALIDATION_ERROR')
    }
    const signup = await updateSignupService(id, req.body)
    sendSuccess(res, signup)
  }),
)

export default router
