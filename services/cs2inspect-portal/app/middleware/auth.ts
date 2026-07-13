export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  if (auth.loading) await auth.fetchUser()
  if (!auth.isAuthenticated) return navigateTo('/')
})
