<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Activity, SignupView } from '@/types'
import { createSignup, fetchActivities, querySignups, updateSignup } from '@/api/client'
import { platformLabels, signupStatusLabels } from '@/utils/format'

const activities = ref<Activity[]>([])
const loading = ref(true)
const error = ref('')
const activeActivityId = ref<number | null>(null)
const activeImageIndex = ref(0)

const signupOpen = ref(false)
const signupSubmitting = ref(false)
const signupError = ref('')
const signupResult = ref<{ signup_code: string; product_url: string } | null>(null)

const signupForm = reactive({
  wechat_nickname: '',
  phone_number: '',
  store_id: 0,
})

const supplementOpen = ref(false)
const supplementLoading = ref(false)
const supplementError = ref('')
const supplementResults = ref<SignupView[]>([])
const supplementForm = reactive({
  wechat_nickname: '',
  phone_number: '',
})

const editingId = ref<number | null>(null)
const orderForm = reactive({
  order_number: '',
  alipay_name: '',
  alipay_account: '',
})

const loadActivities = async () => {
  loading.value = true
  error.value = ''
  try {
    activities.value = await fetchActivities('active')
    const firstActivity = activities.value[0]
    if (firstActivity) {
      activeActivityId.value = firstActivity.id
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const activeActivity = computed(
  () => activities.value.find((item) => item.id === activeActivityId.value) ?? null,
)

const activeImages = computed(() =>
  (activeActivity.value?.product_images ?? []).filter((item) => String(item || '').trim()),
)

const activeStores = computed(() => activeActivity.value?.store_links ?? [])

const hasMultipleActivities = computed(() => activities.value.length > 1)

const canPrevImage = computed(() => activeImageIndex.value > 0)

const canNextImage = computed(
  () => activeImageIndex.value < Math.max(activeImages.value.length - 1, 0),
)

const selectActivity = (id: number) => {
  activeActivityId.value = id
}

const prevImage = () => {
  if (!canPrevImage.value) {
    return
  }
  activeImageIndex.value -= 1
}

const nextImage = () => {
  if (!canNextImage.value) {
    return
  }
  activeImageIndex.value += 1
}

const setImage = (index: number) => {
  activeImageIndex.value = index
}

const openSignup = () => {
  signupOpen.value = true
  signupError.value = ''
  signupResult.value = null
}

const closeSignup = () => {
  signupOpen.value = false
}

const openSupplement = () => {
  supplementOpen.value = true
  supplementError.value = ''
}

const closeSupplement = () => {
  supplementOpen.value = false
}

const submitSignup = async () => {
  signupError.value = ''
  signupResult.value = null
  if (!activeActivity.value) {
    signupError.value = '活动未加载'
    return
  }
  if (!signupForm.wechat_nickname.trim()) {
    signupError.value = '微信昵称不能为空'
    return
  }
  if (!signupForm.phone_number.trim()) {
    signupError.value = '手机号不能为空'
    return
  }
  if (!signupForm.store_id) {
    signupError.value = '请选择购买店铺'
    return
  }
  signupSubmitting.value = true
  try {
    const result = await createSignup({
      activity_id: activeActivity.value.id,
      store_id: signupForm.store_id,
      wechat_nickname: signupForm.wechat_nickname,
      phone_number: signupForm.phone_number,
    })
    signupResult.value = {
      signup_code: result.signup_code,
      product_url: result.product_url,
    }
  } catch (err) {
    signupError.value = err instanceof Error ? err.message : '报名失败'
  } finally {
    signupSubmitting.value = false
  }
}

const searchSignups = async () => {
  supplementError.value = ''
  supplementResults.value = []
  if (!supplementForm.wechat_nickname.trim()) {
    supplementError.value = '微信昵称不能为空'
    return
  }
  if (!supplementForm.phone_number.trim()) {
    supplementError.value = '手机号不能为空'
    return
  }
  supplementLoading.value = true
  try {
    supplementResults.value = await querySignups(
      activeActivity.value?.id,
      supplementForm.wechat_nickname,
      supplementForm.phone_number,
    )
    if (!supplementResults.value.length) {
      supplementError.value = '未查询到报名记录'
    }
  } catch (err) {
    supplementError.value = err instanceof Error ? err.message : '查询失败'
  } finally {
    supplementLoading.value = false
  }
}

const openEdit = (signup: SignupView) => {
  editingId.value = signup.id
  orderForm.order_number = signup.order_number || ''
  orderForm.alipay_name = signup.alipay_name || ''
  orderForm.alipay_account = signup.alipay_account || ''
}

const cancelEdit = () => {
  editingId.value = null
}

const submitOrder = async (signup: SignupView) => {
  supplementError.value = ''
  try {
    const updated = await updateSignup(signup.id, {
      order_number: orderForm.order_number,
      alipay_name: orderForm.alipay_name,
      alipay_account: orderForm.alipay_account,
    })
    supplementResults.value = supplementResults.value.map((item) =>
      item.id === updated.id ? { ...item, ...updated } : item,
    )
    editingId.value = null
  } catch (err) {
    supplementError.value = err instanceof Error ? err.message : '更新失败'
  }
}

watch(activeActivity, (next) => {
  activeImageIndex.value = 0
  signupForm.store_id = next?.store_links[0]?.store_id ?? 0
  signupResult.value = null
  supplementResults.value = []
  editingId.value = null
})

onMounted(loadActivities)
</script>

<template>
  <section class="hero">
    <div v-if="loading" class="muted">加载中...</div>
    <div v-else-if="error" class="muted">{{ error }}</div>
    <div v-else-if="!activeActivity" class="muted">暂无进行中的活动</div>
    <div v-else class="hero-grid">
      <div class="hero-content">
        <div class="eyebrow">返差价活动</div>
        <h1 data-testid="portal-title">{{ activeActivity.name }}</h1>
        <p class="hero-intro">{{ activeActivity.product_intro }}</p>
        <div v-if="hasMultipleActivities" class="hero-switch" data-testid="activity-switch">
          <button
            v-for="item in activities"
            :key="item.id"
            class="switch-btn"
            :class="{ 'switch-btn--active': item.id === activeActivityId }"
            type="button"
            @click="selectActivity(item.id)"
          >
            {{ item.name }}
          </button>
        </div>
      </div>
      <div class="hero-media">
        <div class="carousel">
          <img
            v-if="activeImages.length"
            :src="activeImages[activeImageIndex]"
            alt="活动商品图"
            class="carousel-image"
          />
          <div v-else class="carousel-placeholder">暂无轮播图，请在后台活动管理中配置</div>
          <div class="carousel-controls">
            <button
              class="icon-btn"
              type="button"
              :disabled="!canPrevImage"
              aria-label="上一张"
              @click="prevImage"
            >
              &lt;
            </button>
            <button
              class="icon-btn"
              type="button"
              :disabled="!canNextImage"
              aria-label="下一张"
              @click="nextImage"
            >
              &gt;
            </button>
          </div>
          <div class="carousel-dots">
            <button
              v-for="(img, index) in activeImages"
              :key="`${activeActivity.id}-${index}`"
              type="button"
              class="dot"
              :class="{ 'dot--active': index === activeImageIndex }"
              @click="setImage(index)"
            />
          </div>
        </div>
        <div class="hero-actions hero-actions--split">
          <button class="btn btn-cta" type="button" data-testid="signup-open" @click="openSignup">
            立即报名
          </button>
          <button
            class="btn btn-text"
            type="button"
            data-testid="supplement-open"
            @click="openSupplement"
          >
            已报名？去补充订单号
          </button>
        </div>
      </div>
    </div>
  </section>

  <teleport to="body">
    <div v-if="signupOpen" class="modal">
      <div class="modal-backdrop" @click.self="closeSignup">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <div class="modal-title">立即报名</div>
              <div class="muted">填写微信昵称与手机号，选择购买店铺</div>
            </div>
            <button class="icon-btn" type="button" data-testid="signup-close" @click="closeSignup">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>微信昵称</label>
              <input
                v-model="signupForm.wechat_nickname"
                class="input"
                placeholder="请输入微信昵称"
                data-testid="signup-nickname"
              />
            </div>
            <div class="field">
              <label>手机号</label>
              <input
                v-model="signupForm.phone_number"
                class="input"
                placeholder="请输入手机号"
                data-testid="signup-phone"
              />
            </div>
            <div class="field">
              <label>购买店铺</label>
              <select
                v-model.number="signupForm.store_id"
                class="select"
                data-testid="signup-store"
              >
                <option v-for="store in activeStores" :key="store.id" :value="store.store_id">
                  {{ store.store_name }} · {{ platformLabels[store.store_platform] }}
                </option>
              </select>
            </div>
            <div v-if="signupError" class="muted" style="color: var(--danger)">
              {{ signupError }}
            </div>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="signupSubmitting"
              data-testid="signup-submit"
              @click="submitSignup"
            >
              {{ signupSubmitting ? '提交中...' : '确认报名' }}
            </button>

            <div v-if="signupResult" class="result-card" data-testid="signup-result">
              <div class="badge">报名成功</div>
              <div class="result-code">报名编号：{{ signupResult.signup_code }}</div>
              <a
                class="btn btn-accent"
                :href="signupResult.product_url"
                target="_blank"
                rel="noopener"
                data-testid="signup-link"
              >
                前往下单
              </a>
              <div class="muted">购买完成后回到这里补充订单号。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <teleport to="body">
    <div v-if="supplementOpen" class="modal">
      <div class="modal-backdrop" @click.self="closeSupplement">
        <div class="modal-card modal-card--wide">
          <div class="modal-header">
            <div>
              <div class="modal-title">补充订单号</div>
              <div class="muted">输入报名时的微信昵称与手机号</div>
            </div>
            <button
              class="icon-btn"
              type="button"
              data-testid="supplement-close"
              @click="closeSupplement"
            >
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="grid-2">
              <div class="field">
                <label>微信昵称</label>
                <input
                  v-model="supplementForm.wechat_nickname"
                  class="input"
                  placeholder="请输入微信昵称"
                  data-testid="supplement-nickname"
                />
              </div>
              <div class="field">
                <label>手机号</label>
                <input
                  v-model="supplementForm.phone_number"
                  class="input"
                  placeholder="请输入手机号"
                  data-testid="supplement-phone"
                />
              </div>
            </div>
            <div class="inline" style="margin-top: 12px">
              <button
                class="btn btn-primary"
                type="button"
                :disabled="supplementLoading"
                data-testid="supplement-submit"
                @click="searchSignups"
              >
                {{ supplementLoading ? '查询中...' : '查询报名' }}
              </button>
              <span class="muted">仅查询当前活动的报名记录</span>
            </div>
            <div v-if="supplementError" class="muted" style="color: var(--danger); margin-top: 8px">
              {{ supplementError }}
            </div>

            <div v-if="supplementResults.length" class="stack" style="margin-top: 16px">
              <article
                v-for="signup in supplementResults"
                :key="signup.id"
                class="card card--muted"
              >
                <div class="inline" style="justify-content: space-between">
                  <div>
                    <div style="font-weight: 600">{{ signup.store_name }}</div>
                    <div class="muted">
                      {{ platformLabels[signup.store_platform] }} · {{ signup.phone_number }}
                    </div>
                  </div>
                  <span class="badge">{{ signupStatusLabels[signup.status] }}</span>
                </div>
                <div class="inline" style="margin-top: 10px">
                  <button
                    class="btn btn-ghost"
                    type="button"
                    data-testid="order-open"
                    @click="openEdit(signup)"
                  >
                    补充订单
                  </button>
                  <span class="muted">已补：{{ signup.order_number || '未填写' }}</span>
                </div>

                <div v-if="editingId === signup.id" class="card" style="margin-top: 12px">
                  <div class="grid-2">
                    <div class="field">
                      <label>订单号</label>
                      <input
                        v-model="orderForm.order_number"
                        class="input"
                        placeholder="请输入订单号"
                        data-testid="order-number"
                      />
                    </div>
                    <div class="field">
                      <label>支付宝姓名</label>
                      <input
                        v-model="orderForm.alipay_name"
                        class="input"
                        placeholder="请输入支付宝姓名"
                        data-testid="order-alipay-name"
                      />
                    </div>
                    <div class="field">
                      <label>支付宝账号</label>
                      <input
                        v-model="orderForm.alipay_account"
                        class="input"
                        placeholder="请输入支付宝账号"
                        data-testid="order-alipay-account"
                      />
                    </div>
                  </div>
                  <div class="inline" style="margin-top: 12px">
                    <button
                      class="btn btn-primary"
                      type="button"
                      data-testid="order-submit"
                      @click="submitOrder(signup)"
                    >
                      保存
                    </button>
                    <button class="btn btn-ghost" type="button" @click="cancelEdit">取消</button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
