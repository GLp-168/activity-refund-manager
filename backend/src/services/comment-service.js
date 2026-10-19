import { getActivityById } from '../repositories/activity-repo.js'
import { getSignupById, updateSignup } from '../repositories/signup-repo.js'
import { getDefaultWeightConfig, getWeightConfigById } from '../repositories/weight-config-repo.js'
import { nowIso } from '../utils/ids.js'

const normalizeComment = (input, fallback) => {
  if (!input) {
    if (!fallback?.rating || !fallback?.content) {
      return null
    }
    return {
      rating: fallback.rating,
      content: fallback.content,
      images: Array.isArray(fallback.images) ? fallback.images : [],
    }
  }
  const rating = Number(input.rating)
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return null
  }
  const content = String(input.content || '').trim()
  if (!content) {
    return null
  }
  const images = Array.isArray(input.images)
    ? input.images.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  return { rating, content, images }
}

const evaluateComment = (comment, config) => {
  if (!comment) {
    return { passed: false, score: 0, result: 'unknown' }
  }
  if (comment.rating < config.min_rating) {
    return { passed: false, score: 0, result: 'bad' }
  }
  let score = 0
  config.keyword_rules.forEach((rule) => {
    if (comment.content.includes(rule.keyword)) {
      score += rule.weight
    }
  })
  if (comment.images.length >= config.image_rule.min_images) {
    score += config.image_rule.score
  }
  const passed = score >= config.passing_score
  return { passed, score, result: passed ? 'good' : 'bad' }
}

const resolveWeightConfig = async (activityId) => {
  const activity = await getActivityById(activityId)
  if (activity?.weight_config_id) {
    return (
      (await getWeightConfigById(activity.weight_config_id)) || (await getDefaultWeightConfig())
    )
  }
  return getDefaultWeightConfig()
}

export const fetchCommentsService = async (ids, commentMap = new Map()) => {
  const updated = []
  for (const id of ids) {
    const signup = await getSignupById(id)
    if (!signup) {
      continue
    }
    const comment = normalizeComment(commentMap.get(id), {
      rating: signup.comment_rating,
      content: signup.comment_content,
      images: signup.comment_images,
    })
    if (!comment) {
      updated.push(
        await updateSignup(id, {
          comment_fetch_status: 'failed',
          comment_result: 'unknown',
        }),
      )
      continue
    }
    const config = await resolveWeightConfig(signup.activity_id)
    const evaluation = config
      ? evaluateComment(comment, config.config)
      : { result: 'unknown', passed: false }
    const statusUpdate = {}
    if (evaluation.result === 'good' && signup.status === 'ordered') {
      statusUpdate.status = 'pending_refund'
    }
    if (evaluation.result === 'bad' && signup.status !== 'voided') {
      statusUpdate.status = 'voided'
      statusUpdate.void_reason = '评论未达标'
    }
    const next = await updateSignup(id, {
      comment_fetch_status: 'success',
      comment_result: evaluation.result,
      comment_rating: comment.rating,
      comment_content: comment.content,
      comment_images: comment.images,
      comment_fetched_at: nowIso(),
      ...statusUpdate,
    })
    updated.push(next)
  }
  return updated.filter(Boolean)
}
