import type {
  ActivityStatus,
  CommentResult,
  PlatformType,
  RefundStatus,
  SignupStatus,
} from '@/types'

export const platformLabels: Record<PlatformType, string> = {
  taobao: '淘宝',
  jd: '京东',
  pdd: '拼多多',
  other: '其他',
}

export const activityStatusLabels: Record<ActivityStatus, string> = {
  draft: '草稿',
  active: '进行中',
  ended: '已结束',
  cancelled: '已取消',
}

export const signupStatusLabels: Record<SignupStatus, string> = {
  signed_up: '已报名',
  ordered: '已补单',
  pending_refund: '待打款',
  refunded: '已打款',
  voided: '已作废',
}

export const commentResultLabels: Record<CommentResult, string> = {
  unknown: '未评估',
  good: '好评',
  bad: '非好评',
}

export const refundStatusLabels: Record<RefundStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  success: '成功',
  failed: '失败',
}

export const formatCurrency = (value?: number | string | null) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return '￥0.00'
  }
  return `￥${amount.toFixed(2)}`
}

export const formatDateTime = (value?: string) => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}

export const formatQuota = (current: number, max: number) => {
  if (max <= 0) {
    return '不限'
  }
  const remaining = Math.max(max - current, 0)
  return `剩余 ${remaining}/${max}`
}
