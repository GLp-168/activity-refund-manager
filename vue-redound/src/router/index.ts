import { createRouter, createWebHistory } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin-auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/PortalLayout.vue'),
      children: [
        { path: '', name: 'portal-home', component: () => import('@/views/portal/PortalHome.vue') },
      ],
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLogin.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/activities' },
        {
          path: 'activities',
          name: 'admin-activities',
          component: () => import('@/views/admin/AdminActivities.vue'),
        },
        {
          path: 'stores',
          name: 'admin-stores',
          component: () => import('@/views/admin/AdminStores.vue'),
        },
        {
          path: 'signups',
          name: 'admin-signups',
          component: () => import('@/views/admin/AdminSignups.vue'),
        },
        {
          path: 'refunds',
          name: 'admin-refunds',
          component: () => import('@/views/admin/AdminRefunds.vue'),
        },
        {
          path: 'weights',
          name: 'admin-weights',
          component: () => import('@/views/admin/AdminWeightConfigs.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAdminAuthStore()
  authStore.hydrate()
  if (to.meta.requiresAuth && !authStore.isAuthed) {
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/admin/login' && authStore.isAuthed) {
    return { path: '/admin/activities' }
  }
  return true
})

export default router
