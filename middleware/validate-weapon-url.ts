export default defineNuxtRouteMiddleware((to) => {
    const validTypes = ['heavys', 'rifles', 'pistols', 'smgs']
    if (to.params.type && !validTypes.includes(to.params.type as string)) {
        return abortNavigation({ statusCode: 404, message: 'This Weapon type was not found' })
    }
})