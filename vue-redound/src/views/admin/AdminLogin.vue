<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin-auth'

const authStore = useAdminAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  username: 'admin',
  password: '',
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(form.username.trim(), form.password)
    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/activities'
    router.push(redirect)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="portal-shell" style="justify-content: center; padding: 6vh 0">
    <section class="card" style="max-width: 480px; margin: 0 auto">
      <div style="font-size: 20px; font-weight: 700">管理员登录</div>
      <p class="muted">请使用管理员配置的账号和密码登录。</p>
      <div class="stack" style="margin-top: 16px">
        <div class="field">
          <label>账号</label>
          <input
            v-model="form.username"
            class="input"
            placeholder="admin"
            autocomplete="username"
          />
        </div>
        <div class="field">
          <label>密码</label>
          <input
            v-model="form.password"
            class="input"
            placeholder="请输入密码"
            type="password"
            autocomplete="current-password"
          />
        </div>
      </div>
      <div v-if="error" class="muted" style="margin-top: 12px; color: var(--danger)">
        {{ error }}
      </div>
      <div class="inline" style="margin-top: 16px">
        <button class="btn btn-primary" type="button" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </section>
  </div>
</template>
