<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { WeightConfig, WeightConfigInput } from '@/types'
import {
  adminCreateWeightConfig,
  adminDeleteWeightConfig,
  adminListWeightConfigs,
  adminUpdateWeightConfig,
} from '@/api/client'
import { platformLabels } from '@/utils/format'

const configs = ref<WeightConfig[]>([])
const loading = ref(true)
const error = ref('')
const editingId = ref<number | null>(null)

const buildForm = (): WeightConfigInput => ({
  name: '',
  platform_type: 'all',
  config: {
    min_rating: 4,
    keyword_rules: [{ keyword: '好评', weight: 2 }],
    image_rule: {
      min_images: 1,
      score: 1,
    },
    passing_score: 3,
  },
  is_default: false,
})

const form = reactive<WeightConfigInput>(buildForm())

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    configs.value = await adminListWeightConfigs()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  const next = buildForm()
  form.name = next.name
  form.platform_type = next.platform_type
  form.config = next.config
  form.is_default = next.is_default
  editingId.value = null
}

const editConfig = (config: WeightConfig) => {
  editingId.value = config.id
  form.name = config.name
  form.platform_type = config.platform_type
  form.config = JSON.parse(JSON.stringify(config.config))
  form.is_default = config.is_default
}

const saveConfig = async () => {
  try {
    if (editingId.value) {
      await adminUpdateWeightConfig(editingId.value, JSON.parse(JSON.stringify(form)))
    } else {
      await adminCreateWeightConfig(JSON.parse(JSON.stringify(form)))
    }
    await load()
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败'
  }
}

const removeConfig = async (config: WeightConfig) => {
  if (!window.confirm(`确定删除配置“${config.name}”？`)) {
    return
  }
  try {
    await adminDeleteWeightConfig(config.id)
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除失败'
  }
}

const addKeywordRule = () => {
  form.config.keyword_rules.push({ keyword: '', weight: 1 })
}

const removeKeywordRule = (index: number) => {
  form.config.keyword_rules.splice(index, 1)
}

onMounted(load)
</script>

<template>
  <section class="section">
    <div class="inline" style="justify-content: space-between">
      <div>
        <div style="font-size: 18px; font-weight: 700">权重配置</div>
        <div class="muted">设置好评判断规则</div>
      </div>
      <button class="btn btn-ghost" type="button" @click="load">刷新</button>
    </div>
  </section>

  <section v-if="error" class="section">{{ error }}</section>

  <div class="grid-2">
    <section class="section">
      <div style="font-size: 16px; font-weight: 700">配置列表</div>
      <div v-if="loading" class="muted" style="margin-top: 12px">加载中...</div>
      <div v-else class="stack" style="margin-top: 16px">
        <div v-for="config in configs" :key="config.id" class="card card--muted">
          <div class="inline" style="justify-content: space-between">
            <div>
              <div style="font-weight: 700">{{ config.name }}</div>
              <div class="muted" style="font-size: 12px">
                平台：{{
                  config.platform_type === 'all' ? '全平台' : platformLabels[config.platform_type]
                }}
              </div>
            </div>
            <span v-if="config.is_default" class="badge">默认</span>
          </div>
          <div class="muted" style="margin-top: 10px">
            最低星级：{{ config.config.min_rating }}；通过分数：{{ config.config.passing_score }}
          </div>
          <div class="inline" style="margin-top: 12px">
            <button class="btn btn-ghost" type="button" @click="editConfig(config)">编辑</button>
            <button class="btn btn-text" type="button" @click="removeConfig(config)">删除</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div style="font-size: 16px; font-weight: 700">{{ editingId ? '编辑配置' : '新建配置' }}</div>
      <div class="stack" style="margin-top: 16px">
        <div class="field">
          <label>配置名称</label>
          <input v-model="form.name" class="input" placeholder="请输入名称" />
        </div>
        <div class="field">
          <label>适用平台</label>
          <select v-model="form.platform_type" class="select">
            <option value="all">全平台</option>
            <option value="taobao">淘宝</option>
            <option value="jd">京东</option>
            <option value="pdd">拼多多</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>最低星级</label>
            <input
              v-model.number="form.config.min_rating"
              type="number"
              min="1"
              max="5"
              class="input"
            />
          </div>
          <div class="field">
            <label>通过分数</label>
            <input v-model.number="form.config.passing_score" type="number" min="1" class="input" />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label>图片最低数量</label>
            <input
              v-model.number="form.config.image_rule.min_images"
              type="number"
              min="0"
              class="input"
            />
          </div>
          <div class="field">
            <label>图片加分</label>
            <input
              v-model.number="form.config.image_rule.score"
              type="number"
              min="0"
              class="input"
            />
          </div>
        </div>
        <div class="stack">
          <div class="inline" style="justify-content: space-between">
            <div style="font-weight: 600">关键词规则</div>
            <button class="btn btn-ghost" type="button" @click="addKeywordRule">新增关键词</button>
          </div>
          <div v-for="(rule, index) in form.config.keyword_rules" :key="index" class="grid-2">
            <div class="field">
              <label>关键词</label>
              <input v-model="rule.keyword" class="input" placeholder="关键词" />
            </div>
            <div class="field">
              <label>权重分</label>
              <input v-model.number="rule.weight" type="number" min="0" class="input" />
            </div>
            <button class="btn btn-text" type="button" @click="removeKeywordRule(index)">
              移除
            </button>
          </div>
        </div>
        <label class="inline">
          <input v-model="form.is_default" type="checkbox" />
          设为默认配置
        </label>
      </div>
      <div class="inline" style="margin-top: 16px">
        <button class="btn btn-primary" type="button" @click="saveConfig">保存</button>
        <button class="btn btn-ghost" type="button" @click="resetForm">重置</button>
      </div>
    </section>
  </div>
</template>
