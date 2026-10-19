<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Activity, RefundStatus, SignupStatus, SignupView } from '@/types'
import {
  adminBulkUpdateStatus,
  adminCreateRefundBatch,
  adminFetchComments,
  adminListActivities,
  adminListSignups,
  adminNotifySms,
  adminUpdateSignup,
} from '@/api/client'
import {
  commentResultLabels,
  formatDateTime,
  platformLabels,
  signupStatusLabels,
} from '@/utils/format'
import StatusPill from '@/components/StatusPill.vue'

const activities = ref<Activity[]>([])
const activeActivityId = ref<number | null>(null)
const signups = ref<SignupView[]>([])
const loading = ref(true)
const error = ref('')

const filters = reactive({
  status: '',
  comment_result: '',
  refund_status: '',
})

const selectedIds = ref<number[]>([])

const loadActivities = async () => {
  activities.value = await adminListActivities()
  const firstActivity = activities.value[0]
  if (!activeActivityId.value && firstActivity) {
    activeActivityId.value = firstActivity.id
  }
}

const loadSignups = async () => {
  if (!activeActivityId.value) {
    signups.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    signups.value = await adminListSignups({
      activity_id: activeActivityId.value,
      status: filters.status ? (filters.status as SignupStatus) : undefined,
      comment_result: filters.comment_result
        ? (filters.comment_result as SignupView['comment_result'])
        : undefined,
      refund_status: filters.refund_status ? (filters.refund_status as RefundStatus) : undefined,
    })
    selectedIds.value = selectedIds.value.filter((id) =>
      signups.value.some((item) => item.id === id),
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const selectActivity = (id: number) => {
  activeActivityId.value = id
  loadSignups()
}

const toggleSelectAll = (checked: boolean) => {
  selectedIds.value = checked ? signups.value.map((item) => item.id) : []
}

const toggleSelect = (id: number, checked: boolean) => {
  if (checked) {
    selectedIds.value = Array.from(new Set([...selectedIds.value, id]))
  } else {
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
  }
}

const allSelected = computed(
  () =>
    signups.value.length > 0 && signups.value.every((item) => selectedIds.value.includes(item.id)),
)

const handleFetchComments = async (signup: SignupView) => {
  const ratingInput = window.prompt('请输入评论星级（1-5）', '5')
  if (!ratingInput) {
    return
  }
  const rating = Number(ratingInput)
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    error.value = '评论星级需为 1-5 的数字'
    return
  }
  const content = window.prompt('请输入评论内容', signup.comment_content || '')
  if (!content) {
    return
  }
  const imagesInput = window.prompt('请输入评论图片URL（逗号分隔，可留空）', '')
  const images = imagesInput
    ? imagesInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
  try {
    await adminFetchComments([
      {
        signup_id: signup.id,
        rating,
        content,
        images,
      },
    ])
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取评论失败'
  }
}

const handleRefund = async (signup: SignupView) => {
  try {
    await adminCreateRefundBatch([signup.id])
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '打款失败'
  }
}

const handleBatchRefund = async () => {
  if (!selectedIds.value.length) {
    error.value = '请先选择需要打款的报名记录'
    return
  }
  try {
    await adminCreateRefundBatch(selectedIds.value)
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '批量打款失败'
  }
}

const handleVoid = async (signup: SignupView) => {
  const reason = window.prompt('请输入作废原因', signup.void_reason || '')
  if (!reason) {
    return
  }
  try {
    await adminUpdateSignup(signup.id, { status: 'voided', void_reason: reason })
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '作废失败'
  }
}

const handleBatchVoid = async () => {
  if (!selectedIds.value.length) {
    error.value = '请选择需要作废的报名记录'
    return
  }
  const reason = window.prompt('请输入批量作废原因', '批量作废')
  if (!reason) {
    return
  }
  try {
    await adminBulkUpdateStatus(selectedIds.value, 'voided', reason)
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '批量作废失败'
  }
}

const handleStatusChange = async (signup: SignupView, status: SignupStatus) => {
  try {
    await adminUpdateSignup(signup.id, { status })
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '更新状态失败'
  }
}

const handleSmsNotify = async () => {
  if (!selectedIds.value.length) {
    error.value = '请选择需要发送短信的报名记录'
    return
  }
  try {
    await adminNotifySms(selectedIds.value)
    await loadSignups()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '短信通知失败'
  }
}

const statusTone = (status: SignupStatus) => {
  if (status === 'pending_refund' || status === 'ordered') {
    return 'warning'
  }
  if (status === 'refunded') {
    return 'success'
  }
  if (status === 'voided') {
    return 'danger'
  }
  return 'neutral'
}

onMounted(async () => {
  await loadActivities()
  await loadSignups()
})

watch(
  () => [filters.status, filters.comment_result, filters.refund_status],
  () => {
    loadSignups()
  },
)
</script>

<template>
  <section class="section">
    <div class="inline" style="justify-content: space-between">
      <div>
        <div style="font-size: 18px; font-weight: 700">报名管理</div>
        <div class="muted">活动列表在左侧，报名详情在右侧</div>
      </div>
      <div class="inline">
        <button class="btn btn-ghost" type="button" @click="loadSignups">刷新</button>
        <button class="btn btn-ghost" type="button" @click="handleBatchVoid">批量作废</button>
        <button class="btn btn-accent" type="button" @click="handleBatchRefund">批量打款</button>
        <button class="btn btn-primary" type="button" @click="handleSmsNotify">发送短信</button>
      </div>
    </div>
  </section>

  <section v-if="error" class="section">{{ error }}</section>

  <section class="section" style="display: grid; grid-template-columns: 220px 1fr; gap: 16px">
    <aside class="stack" style="max-height: 640px; overflow: auto">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="card card--muted"
        style="cursor: pointer"
        :style="{
          border:
            activeActivityId === activity.id
              ? '1px solid rgba(31, 111, 92, 0.6)'
              : '1px solid rgba(255,255,255,0.7)',
        }"
        @click="selectActivity(activity.id)"
      >
        <div style="font-weight: 700">{{ activity.name }}</div>
        <div class="muted" style="font-size: 12px">已报 {{ activity.current_participants }}</div>
      </div>
    </aside>

    <div class="stack">
      <div class="inline" style="justify-content: space-between">
        <div class="inline">
          <div class="field">
            <label>报名状态</label>
            <select v-model="filters.status" class="select">
              <option value="">全部</option>
              <option value="signed_up">已报名</option>
              <option value="ordered">已补单</option>
              <option value="pending_refund">待打款</option>
              <option value="refunded">已打款</option>
              <option value="voided">已作废</option>
            </select>
          </div>
          <div class="field">
            <label>评价结果</label>
            <select v-model="filters.comment_result" class="select">
              <option value="">全部</option>
              <option value="good">好评</option>
              <option value="bad">非好评</option>
              <option value="unknown">未评估</option>
            </select>
          </div>
          <div class="field">
            <label>打款状态</label>
            <select v-model="filters.refund_status" class="select">
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </div>
        </div>
        <div class="inline">
          <label class="inline">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
            />
            全选
          </label>
        </div>
      </div>

      <div class="card" style="padding: 0">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 48px">选择</th>
              <th>用户信息</th>
              <th>订单信息</th>
              <th>状态</th>
              <th>评价信息</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr>
              <td colspan="6" class="muted" style="padding: 20px">加载中...</td>
            </tr>
          </tbody>
          <tbody v-else-if="!signups.length">
            <tr>
              <td colspan="6" class="muted" style="padding: 20px">暂无报名记录</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="signup in signups" :key="signup.id">
              <td>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(signup.id)"
                  @change="toggleSelect(signup.id, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td>
                <div style="font-weight: 600">{{ signup.wechat_nickname }}</div>
                <div class="muted">
                  {{ signup.store_name }} · {{ platformLabels[signup.store_platform] }}
                </div>
                <div class="muted">手机号：{{ signup.phone_number }}</div>
              </td>
              <td>
                <div>订单号：{{ signup.order_number || '—' }}</div>
                <div>支付宝：{{ signup.alipay_account || '—' }}</div>
                <div>姓名：{{ signup.alipay_name || '—' }}</div>
                <div>手机号：{{ signup.phone_number || '—' }}</div>
              </td>
              <td>
                <StatusPill
                  :label="signupStatusLabels[signup.status]"
                  :tone="statusTone(signup.status)"
                />
                <div class="muted" style="margin-top: 6px">
                  打款：{{ signup.refund_status || '—' }}
                </div>
                <select
                  class="select"
                  style="margin-top: 8px"
                  :value="signup.status"
                  @change="
                    handleStatusChange(
                      signup,
                      ($event.target as HTMLSelectElement).value as SignupStatus,
                    )
                  "
                >
                  <option value="signed_up">已报名</option>
                  <option value="ordered">已补单</option>
                  <option value="pending_refund">待打款</option>
                  <option value="refunded">已打款</option>
                  <option value="voided">已作废</option>
                </select>
                <div v-if="signup.void_reason" class="muted" style="margin-top: 6px">
                  作废原因：{{ signup.void_reason }}
                </div>
              </td>
              <td>
                <div class="card card--muted" style="padding: 12px">
                  <div class="inline" style="justify-content: space-between">
                    <span>{{ commentResultLabels[signup.comment_result] }}</span>
                    <span class="muted">星级：{{ signup.comment_rating ?? '—' }}</span>
                  </div>
                  <div class="muted" style="margin-top: 6px">
                    {{ signup.comment_content || '暂无评论内容' }}
                  </div>
                  <div class="inline" style="margin-top: 8px">
                    <img
                      v-for="(img, index) in signup.comment_images || []"
                      :key="`${signup.id}-${index}`"
                      :src="img"
                      alt="comment"
                      style="width: 64px; height: 48px; object-fit: cover; border-radius: 6px"
                    />
                  </div>
                  <div class="muted" style="margin-top: 6px">
                    拉取时间：{{
                      signup.comment_fetched_at ? formatDateTime(signup.comment_fetched_at) : '—'
                    }}
                  </div>
                </div>
              </td>
              <td>
                <div class="stack">
                  <button class="btn btn-ghost" type="button" @click="handleFetchComments(signup)">
                    获取评论
                  </button>
                  <button class="btn btn-accent" type="button" @click="handleRefund(signup)">
                    发起打款
                  </button>
                  <button class="btn btn-danger" type="button" @click="handleVoid(signup)">
                    作废
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card card--muted">
        <div class="inline" style="justify-content: space-between">
          <div>
            <div style="font-weight: 600">当前活动报名情况</div>
            <div class="muted">已选择 {{ selectedIds.length }} 条</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
