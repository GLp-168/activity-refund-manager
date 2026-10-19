<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin-auth'

const authStore = useAdminAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <div class="admin-brand__title">后台管理</div>
        <div class="admin-brand__subtitle">ADMIN CONSOLE</div>
      </div>
      <nav class="admin-nav">
        <RouterLink to="/admin/activities">活动管理</RouterLink>
        <RouterLink to="/admin/stores">店铺管理</RouterLink>
        <RouterLink to="/admin/signups">报名管理</RouterLink>
        <RouterLink to="/admin/refunds">打款记录</RouterLink>
        <RouterLink to="/admin/weights">权重配置</RouterLink>
      </nav>
    </aside>
    <main class="admin-main">
      <div class="admin-topbar">
        <div class="admin-topbar__title">活动与退款管理台</div>
        <div class="inline">
          <span class="badge">管理员：{{ authStore.user?.username || 'admin' }}</span>
          <button class="btn btn-ghost" type="button" @click="handleLogout">退出登录</button>
        </div>
      </div>
      <RouterView />
    </main>
  </div>
</template>
