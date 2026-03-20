import { defineStore } from 'pinia'
import type { Customer } from '~/server/database/schema'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    customer: null as Customer | null,
    loading: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.customer,
  },
  actions: {
    async fetchUser() {
      try {
        this.customer = await $fetch('/api/auth/me')
      }
      catch {
        this.customer = null
      }
      finally {
        this.loading = false
      }
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.customer = null
      navigateTo('/')
    },
  },
})
