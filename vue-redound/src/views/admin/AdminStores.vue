<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { Store, StoreInput } from '@/types'
import { adminCreateStore, adminDeleteStore, adminListStores, adminUpdateStore } from '@/api/client'
import { platformLabels } from '@/utils/format'

const stores = ref<Store[]>([])
const loading = ref(true)
const error = ref('')
const editingId = ref<number | null>(null)

const form = reactive<StoreInput>({
  name: '',
  platform_type: 'taobao',
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    stores.value = await adminListStores()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.platform_type = 'taobao'
  editingId.value = null
}

const editStore = (store: Store) => {
  editingId.value = store.id
  form.name = store.name
  form.platform_type = store.platform_type
}

const saveStore = async () => {
  try {
    if (editingId.value) {
      await adminUpdateStore(editingId.value, { ...form })
    } else {
      await adminCreateStore({ ...form })
    }
    await load()
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败'
  }
}

const removeStore = async (store: Store) => {
  if (!window.confirm(`确定删除店铺“${store.name}”？`)) {
    return
  }
  try {
    await adminDeleteStore(store.id)
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
        <div style="font-size: 18px; font-weight: 700">店铺管理</div>
        <div class="muted">维护店铺名称与平台类型</div>
      </div>
      <button class="btn btn-ghost" type="button" @click="load">刷新</button>
    </div>
  </section>

  <section v-if="error" class="section">{{ error }}</section>

  <div class="grid-2">
    <section class="section">
      <div style="font-size: 16px; font-weight: 700">店铺列表</div>
      <div v-if="loading" class="muted" style="margin-top: 12px">加载中...</div>
      <div v-else class="stack" style="margin-top: 16px">
        <div v-for="store in stores" :key="store.id" class="card card--muted">
          <div class="inline" style="justify-content: space-between">
            <div>
              <div style="font-weight: 700">{{ store.name }}</div>
              <div class="muted" style="font-size: 12px">
                平台：{{ platformLabels[store.platform_type] }}
              </div>
            </div>
            <span class="badge">ID {{ store.id }}</span>
          </div>
          <div class="inline" style="margin-top: 12px">
            <button class="btn btn-ghost" type="button" @click="editStore(store)">编辑</button>
            <button class="btn btn-text" type="button" @click="removeStore(store)">删除</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div style="font-size: 16px; font-weight: 700">{{ editingId ? '编辑店铺' : '新建店铺' }}</div>
      <div class="stack" style="margin-top: 16px">
        <div class="field">
          <label>店铺名称</label>
          <input v-model="form.name" class="input" placeholder="请输入店铺名称" />
        </div>
        <div class="field">
          <label>平台类型</label>
          <select v-model="form.platform_type" class="select">
            <option value="taobao">淘宝</option>
            <option value="jd">京东</option>
            <option value="pdd">拼多多</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>
      <div class="inline" style="margin-top: 16px">
        <button class="btn btn-primary" type="button" @click="saveStore">保存</button>
        <button class="btn btn-ghost" type="button" @click="resetForm">重置</button>
      </div>
    </section>
  </div>
</template>
