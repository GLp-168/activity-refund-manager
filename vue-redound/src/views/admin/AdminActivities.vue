<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { Activity, ActivityInput, Store, WeightConfig } from '@/types'
import {
  adminCreateActivity,
  adminDeleteActivity,
  adminListActivities,
  adminListStores,
  adminListWeightConfigs,
  adminUpdateActivity,
} from '@/api/client'
import { activityStatusLabels, platformLabels } from '@/utils/format'

const activities = ref<Activity[]>([])
const stores = ref<Store[]>([])
const weightConfigs = ref<WeightConfig[]>([])
const loading = ref(true)
const error = ref('')
const editingId = ref<number | null>(null)

const form = reactive<ActivityInput>({
  name: '',
  product_intro: '',
  product_images: [],
  store_links: [],
  max_participants: 0,
  status: 'draft',
  start_time: '',
  end_time: '',
  weight_config_id: undefined,
})

const resetForm = () => {
  form.name = ''
  form.product_intro = ''
  form.product_images = []
  form.store_links = []
  form.max_participants = 0
  form.status = 'draft'
  form.start_time = ''
  form.end_time = ''
  form.weight_config_id = weightConfigs.value.find((item) => item.is_default)?.id ?? 0
  editingId.value = null
  const firstStore = stores.value[0]
  if (firstStore) {
    form.store_links.push({
      store_id: firstStore.id,
      product_url: '',
    })
  }
  form.product_images.push('')
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    activities.value = await adminListActivities()
    stores.value = await adminListStores()
    weightConfigs.value = await adminListWeightConfigs()
    const firstStore = stores.value[0]
    if (!form.store_links.length && firstStore) {
      form.store_links.push({
        store_id: firstStore.id,
        product_url: '',
      })
    }
    if (!form.product_images.length) {
      form.product_images.push('')
    }
    if (!form.weight_config_id) {
      form.weight_config_id = weightConfigs.value.find((item) => item.is_default)?.id
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const editActivity = (activity: Activity) => {
  editingId.value = activity.id
  form.name = activity.name
  form.product_intro = activity.product_intro
  form.product_images = activity.product_images.length ? [...activity.product_images] : ['']
  form.store_links = activity.store_links.map((link) => ({
    store_id: link.store_id,
    product_url: link.product_url,
  }))
  form.max_participants = activity.max_participants
  form.status = activity.status
  form.start_time = activity.start_time || ''
  form.end_time = activity.end_time || ''
  form.weight_config_id = activity.weight_config_id ?? 0
}

const addImage = () => {
  form.product_images.push('')
}

const removeImage = (index: number) => {
  form.product_images.splice(index, 1)
  if (!form.product_images.length) {
    form.product_images.push('')
  }
}

const addStoreLink = () => {
  form.store_links.push({
    store_id: stores.value[0]?.id ?? 0,
    product_url: '',
  })
}

const removeStoreLink = (index: number) => {
  form.store_links.splice(index, 1)
  const firstStore = stores.value[0]
  if (!form.store_links.length && firstStore) {
    form.store_links.push({
      store_id: firstStore.id,
      product_url: '',
    })
  }
}

const saveActivity = async () => {
  try {
    const payload: ActivityInput = {
      ...form,
      weight_config_id: form.weight_config_id || undefined,
      product_images: form.product_images.filter((item) => item.trim()),
      store_links: form.store_links.filter((item) => item.store_id && item.product_url.trim()),
    }
    if (editingId.value) {
      await adminUpdateActivity(editingId.value, payload)
    } else {
      await adminCreateActivity(payload)
    }
    await load()
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败'
  }
}

const removeActivity = async (activity: Activity) => {
  if (!window.confirm(`确定删除活动“${activity.name}”吗？`)) {
    return
  }
  try {
    await adminDeleteActivity(activity.id)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除失败'
  }
}

onMounted(load)
</script>

<template>
  <section class="section">
    <div class="inline" style="justify-content: space-between">
      <div>
        <div style="font-size: 18px; font-weight: 700">活动管理</div>
        <div class="muted">配置商品简介、轮播图与店铺链接</div>
      </div>
      <button class="btn btn-ghost" type="button" @click="load">刷新</button>
    </div>
  </section>

  <div v-if="error" class="section">{{ error }}</div>

  <div class="grid-2">
    <section class="section">
      <div style="font-size: 16px; font-weight: 700">活动列表</div>
      <div v-if="loading" class="muted" style="margin-top: 12px">加载中...</div>
      <div v-else class="stack" style="margin-top: 16px">
        <div v-for="activity in activities" :key="activity.id" class="card card--muted">
          <div class="inline" style="justify-content: space-between">
            <div>
              <div style="font-weight: 700">{{ activity.name }}</div>
              <div class="muted" style="font-size: 13px">{{ activity.product_intro }}</div>
            </div>
            <span class="badge">{{ activityStatusLabels[activity.status] }}</span>
          </div>
          <div class="inline" style="margin-top: 12px">
            <span class="badge">店铺数：{{ activity.store_links.length }}</span>
            <span class="badge">名额：{{ activity.max_participants || '不限' }}</span>
            <span class="badge">已报：{{ activity.current_participants }}</span>
          </div>
          <div class="inline" style="margin-top: 12px; flex-wrap: wrap">
            <span
              v-for="link in activity.store_links"
              :key="`${activity.id}-${link.store_id}`"
              class="badge"
            >
              {{ link.store_name }} · {{ platformLabels[link.store_platform] }}
            </span>
          </div>
          <div class="inline" style="margin-top: 12px">
            <button class="btn btn-ghost" type="button" @click="editActivity(activity)">
              编辑
            </button>
            <button class="btn btn-text" type="button" @click="removeActivity(activity)">
              删除
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div style="font-size: 16px; font-weight: 700">
        {{ editingId ? '编辑活动' : '新建活动' }}
      </div>
      <div class="stack" style="margin-top: 16px">
        <div class="field">
          <label>活动名称</label>
          <input v-model="form.name" class="input" placeholder="请输入活动名称" />
        </div>
        <div class="field">
          <label>商品简介</label>
          <textarea v-model="form.product_intro" class="textarea" rows="4" />
        </div>
        <div class="stack">
          <div class="inline" style="justify-content: space-between">
            <div style="font-weight: 600">轮播图</div>
            <button class="btn btn-ghost" type="button" @click="addImage">添加图片</button>
          </div>
          <div class="muted">支持多张图片，建议 3-5 张，保存后前台轮播图会更新。</div>
          <div v-for="(img, index) in form.product_images" :key="index" class="grid-2">
            <div class="field">
              <label>图片链接</label>
              <input v-model="form.product_images[index]" class="input" placeholder="https://" />
            </div>
            <div class="inline" style="align-items: center">
              <img
                v-if="img"
                :src="img"
                alt="preview"
                style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px"
              />
              <button class="btn btn-text" type="button" @click="removeImage(index)">移除</button>
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="inline" style="justify-content: space-between">
            <div style="font-weight: 600">店铺链接</div>
            <button class="btn btn-ghost" type="button" @click="addStoreLink">添加链接</button>
          </div>
          <div v-if="!stores.length" class="muted">请先在店铺管理中创建店铺。</div>
          <div v-for="(link, index) in form.store_links" :key="index" class="grid-2">
            <div class="field">
              <label>店铺</label>
              <select v-model.number="link.store_id" class="select">
                <option v-for="store in stores" :key="store.id" :value="store.id">
                  {{ store.name }} · {{ platformLabels[store.platform_type] }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>链接</label>
              <input v-model="link.product_url" class="input" placeholder="https://" />
            </div>
            <button class="btn btn-text" type="button" @click="removeStoreLink(index)">移除</button>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>活动状态</label>
            <select v-model="form.status" class="select">
              <option value="draft">草稿</option>
              <option value="active">进行中</option>
              <option value="ended">已结束</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div class="field">
            <label>报名名额</label>
            <input v-model.number="form.max_participants" type="number" min="0" class="input" />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>开始时间</label>
            <input v-model="form.start_time" type="datetime-local" class="input" />
          </div>
          <div class="field">
            <label>结束时间</label>
            <input v-model="form.end_time" type="datetime-local" class="input" />
          </div>
        </div>
        <div class="field">
          <label>权重配置</label>
          <select v-model.number="form.weight_config_id" class="select">
            <option :value="0">未设置</option>
            <option v-for="config in weightConfigs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="inline" style="margin-top: 16px">
        <button class="btn btn-primary" type="button" @click="saveActivity">保存</button>
        <button class="btn btn-ghost" type="button" @click="resetForm">重置</button>
      </div>
    </section>
  </div>
</template>
