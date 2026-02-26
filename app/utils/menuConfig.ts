import { LucideMusic as Music, LucidePin as Pin, LucideHome as Home } from "lucide-vue-next";
import { NIcon } from "naive-ui";
import { h, type Component } from "vue";


export function renderIcon(icon: Component, size?: number) {
    return () => h(NIcon, { component: icon, size })
}

export const homeMenuOptions = [
    {
        labelKey: 'extras.home',
        key: '/',
        icon: renderIcon(Home)
    }
]

export const weaponMenuOptions = [
    {
        labelKey: 'weapons.rifles',
        key: '/weapons/rifles',
        icon: renderIcon(menuIcons.rifles)
    },
    {
        labelKey: 'weapons.smgs',
        key: '/weapons/smgs',
        icon: renderIcon(menuIcons.smgs)
    },
    {
        labelKey: 'weapons.pistols',
        key: '/weapons/pistols',
        icon: renderIcon(menuIcons.pistols)
    },
    {
        labelKey: 'weapons.heavys',
        key: '/weapons/heavys',
        icon: renderIcon(menuIcons.heavys)
    }
]

export const equipmentMenuOptions = [
    {
        labelKey: 'melee.knives',
        key: '/knives',
        icon: renderIcon(menuIcons.knives)
    },
    {
        labelKey: 'melee.gloves',
        key: '/gloves',
        icon: renderIcon(menuIcons.gloves)
    }
]

export const extrasMenuOptions = [
    {
        labelKey: 'extras.pins',
        key: '/pins',
        icon: renderIcon(Pin, 24)
    },
    {
        labelKey: 'extras.agents',
        key: '/agents',
        icon: renderIcon(menuIcons.agents)
    },
    {
        labelKey: 'extras.music',
        key: '/music-kits',
        icon: renderIcon(Music, 24)
    }
]
