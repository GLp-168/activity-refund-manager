import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AdminUser, LoginResult } from '@/types'
import { adminLogin } from '@/api/client'

const STORAGE_KEY = 'activity-refund-manager-admin-session'

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AdminUser | null>(null)
  const ready = ref(false)

  const isAuthed = computed(() => Boolean(token.value))

  const hydrate = () => {
    if (ready.value) {
      return
    }
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LoginResult
        token.value = parsed.token
        user.value = parsed.user
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
    ready.value = true
  }

  const login = async (username: string, password: string) => {
    const result = await adminLogin(username, password)
    token.value = result.token
    user.value = result.user
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  }

  const logout = () => {
    token.value = null
    user.value = null
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return {
    token,
    user,
    isAuthed,
    hydrate,
    login,
    logout,
  }
})
