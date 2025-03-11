import { useI18n } from 'vue-i18n'

export function useLanguagePreference() {
    const { locale } = useI18n()

    const saveLanguagePreference = () => {
        localStorage.setItem('preferredLanguage', locale.value)
    }

    const loadLanguagePreference = () => {
        const saved = localStorage.getItem('preferredLanguage')
        if (saved) {
            locale.value = saved
        }
    }

    onMounted(() => {
        loadLanguagePreference()
    })

    watch(locale, () => {
        saveLanguagePreference()
    })

    return {
        locale,
        saveLanguagePreference,
        loadLanguagePreference
    }
}