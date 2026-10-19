<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    tone?: 'success' | 'warning' | 'danger' | 'neutral'
  }>(),
  {
    tone: 'neutral',
  },
)
</script>

<template>
  <span
    class="pill"
    :class="{
      'pill--success': props.tone === 'success',
      'pill--warning': props.tone === 'warning',
      'pill--danger': props.tone === 'danger',
    }"
  >
    {{ props.label }}
  </span>
</template>
