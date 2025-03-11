export default defineNuxtPlugin(async ({ $i18n }) => {
    // Get system language
    const browserLanguage = window.navigator.language.split('-')[0]

    // Check if we support this language
    const availableLocales = $i18n.locales.value.map((locale: any) => locale.code)

    if (availableLocales.includes(browserLanguage)) {
        // Only set if we don't already have a preference
        if (!localStorage.getItem('preferredLanguage')) {
            $i18n.locale.value = browserLanguage
        }
    }
})