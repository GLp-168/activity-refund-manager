<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { RefundRecord, RefundStatus } from '@/types'
import { adminListRefundRecords } from '@/api/client'
import { formatCurrency, formatDateTime, refundStatusLabels } from '@/utils/format'
import StatusPill from '@/components/StatusPill.vue'

const records = ref<RefundRecord[]>([])
const loading = ref(true)
const error = ref('')

const filters = reactive({
  status: '',
  batch_no: '',
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    records.value = await adminListRefundRecords({
      status: filters.status ? (filters.status as RefundStatus) : undefined,
      batch_no: filters.batch_no.trim() || undefined,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const statusTone = (status: RefundStatus) => {
  if (status === 'success') {
    return 'success'
  }
  if (status === 'failed') {
    return 'danger'
  }
  return 'warning'
}

onMounted(load)
</script>

<template>
  <section class="section">
    <div class="inline" style="justify-content: space-between">
      <div>
        <div style="font-size: 18px; font-weight: 700">打款记录</div>
        <div class="muted">按批次与状态查看打款明细</div>
      </div>
      <button class="btn btn-ghost" type="button" @click="load">刷新</button>
    </div>
  </section>

  <section class="section">
    <div class="grid-2">
      <div class="field">
        <label>批次号</label>
        <input v-model="filters.batch_no" class="input" placeholder="输入批次号" />
      </div>
      <div class="field">
        <label>打款状态</label>
        <select v-model="filters.status" class="select">
          <option value="">全部</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
        </select>
      </div>
    </div>
    <div class="inline" style="margin-top: 16px">
      <button class="btn btn-primary" type="button" @click="load">应用筛选</button>
      <span class="muted">共 {{ records.length }} 条记录</span>
    </div>
  </section>

  <section v-if="error" class="section">{{ error }}</section>

  <section class="section" style="padding: 0">
    <table class="table">
      <thead>
        <tr>
          <th>批次号</th>
          <th>报名ID</th>
          <th>活动ID</th>
          <th>金额</th>
          <th>状态</th>
          <th>交易号</th>
          <th>处理时间</th>
        </tr>
      </thead>
      <tbody v-if="loading">
        <tr>
          <td colspan="7" class="muted" style="padding: 20px">加载中...</td>
        </tr>
      </tbody>
      <tbody v-else-if="!records.length">
        <tr>
          <td colspan="7" class="muted" style="padding: 20px">暂无打款记录</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.batch_no }}</td>
          <td>{{ record.signup_id }}</td>
          <td>{{ record.activity_id }}</td>
          <td>{{ formatCurrency(record.refund_amount) }}</td>
          <td>
            <StatusPill
              :label="refundStatusLabels[record.status]"
              :tone="statusTone(record.status)"
            />
          </td>
          <td>{{ record.transaction_id || '—' }}</td>
          <td>{{ record.processed_at ? formatDateTime(record.processed_at) : '—' }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
