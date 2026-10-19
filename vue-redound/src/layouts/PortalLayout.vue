<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="portal-shell">
    <header class="portal-header">
      <div class="portal-brand">
        <div class="portal-brand__title">活动报名中心</div>
        <div class="portal-brand__subtitle">真实评价 · 差价返现</div>
      </div>
    </header>
    <main class="portal-main">
      <RouterView />
    </main>
    <footer class="portal-footer">
      <span>活动仅用于真实评价返差价，违规订单将被作废。</span>
      <span>服务时间：09:00 - 21:00</span>
    </footer>
  </div>
</template>
