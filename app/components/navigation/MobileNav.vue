<script setup lang="ts">
/**
 * MobileNav — the app's mobile navigation (below lg): a ghost menu button
 * opening a left-side Sheet with the full grouped nav list, the user capsule
 * and the TeamToggle. The layout injects loadout controls through the
 * #footer slot. Closes itself on route change.
 */
import { LucideMenu } from '@lucide/vue'
import type { SteamUser } from '@/services/steamAuth'

interface Props {
  user?: SteamUser | null
}

withDefaults(defineProps<Props>(), {
  user: null,
})

const { t } = useI18n()
const route = useRoute()
const open = ref(false)

/** Nav groups mirror the desktop MainNav clusters (app/utils/menuConfig.ts) */
const groups = computed(() => [
  { labelKey: null, items: homeMenuOptions },
  { labelKey: 'navigation.weapons', items: weaponMenuOptions },
  { labelKey: 'navigation.melee', items: equipmentMenuOptions },
  { labelKey: 'navigation.extras', items: extrasMenuOptions },
])

function isActive(key: string): boolean {
  return route.path === key
}

// Close the sheet whenever navigation happens
watch(
  () => route.path,
  () => {
    open.value = false
  }
)
</script>

<template>
  <div class="lg:hidden">
    <Sheet v-model:open="open">
      <SheetTrigger as-child>
        <Button variant="ghost" size="icon" :aria-label="String(t('navigation.openMenu'))">
          <LucideMenu :size="20" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" class="w-[300px] gap-0 p-0">
        <SheetHeader class="border-b border-border px-4 py-4">
          <SheetTitle class="text-[15px] tracking-tight">CS2Inspect</SheetTitle>
          <SheetDescription class="sr-only">
            {{ t('navigation.mainNav') }}
          </SheetDescription>
        </SheetHeader>

        <!-- User capsule + team toggle -->
        <div class="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <a
            v-if="user"
            :href="user.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex min-w-0 items-center gap-2 rounded-full border border-border bg-[var(--surface-2)] py-1 pl-1 pr-3 text-[13px] font-medium text-foreground transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-border-strong"
            :aria-label="String(t('auth.openSteamProfile'))"
          >
            <img class="size-6 shrink-0 rounded-full" alt="Steam Avatar" :src="user.avatarFull" />
            <span class="truncate">{{ user.personaName }}</span>
          </a>
          <TeamToggle />
        </div>

        <!-- Nav list -->
        <nav
          class="min-h-0 flex-1 overflow-y-auto px-3 py-4"
          :aria-label="String(t('navigation.mainNav'))"
        >
          <template v-for="(group, groupIndex) in groups" :key="groupIndex">
            <p
              v-if="group.labelKey"
              class="mt-5 mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] first:mt-0"
            >
              {{ t(group.labelKey) }}
            </p>
            <NuxtLink
              v-for="item in group.items"
              :key="item.key"
              :to="item.key"
              class="mobile-nav-item"
              :class="{ 'mobile-nav-item--active': isActive(item.key) }"
              :aria-current="isActive(item.key) ? 'page' : undefined"
            >
              <WeaponSilhouette v-if="item.silhouette" :name="item.silhouette" :size="26" />
              <span v-else-if="item.icon" class="mobile-nav-lucide">
                <component :is="item.icon" :size="18" />
              </span>
              <span class="truncate">{{ t(item.labelKey) }}</span>
            </NuxtLink>
          </template>
        </nav>

        <!-- Footer slot: layout injects loadout controls here -->
        <div v-if="$slots.footer" class="border-t border-border px-4 py-3">
          <slot name="footer" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style scoped>
.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-ctl);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--muted-foreground);
  text-decoration: none;
  outline: none;
  transition:
    color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}

.mobile-nav-item:hover {
  color: var(--foreground);
  background: rgba(255, 255, 255, 0.04);
}

.mobile-nav-item:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 40%, transparent);
}

.mobile-nav-item--active {
  color: var(--foreground);
  background: rgba(255, 255, 255, 0.06);
}

.mobile-nav-lucide {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 26px;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-item {
    transition: none;
  }
}
</style>
