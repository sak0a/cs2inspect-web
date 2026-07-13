export default defineNuxtRouteMiddleware((to) => {
  const validTypes = ['heavys', 'rifles', 'pistols', 'smgs']
  const params = to.params as Record<string, string | string[]>
  if (params.type && !validTypes.includes(params.type as string)) {
    return abortNavigation({ statusCode: 404, message: 'This Weapon type was not found' })
  }
})
