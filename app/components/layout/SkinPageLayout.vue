<script setup lang="ts">
import { LucideCircleAlert, LucideLock, LucidePackageOpen } from '@lucide/vue'
import type { SteamUser } from '~/services/steamAuth'
import { toSteamId } from '~/types/core/branded'
import { steamAuth } from '~/services/steamAuth'

interface Props {
  /** Localized page title, rendered as the H1 (display face). */
  title: string
  user?: SteamUser | null
  error?: string | null
  isLoading?: boolean
  /** Configured item count for the active team (mono micro-label). */
  configuredCount?: number | null
  /** Total item count for the active team (mono micro-label). */
  totalCount?: number | null
  /** Show the active team in the micro-label (off for team-agnostic pages like music kits/pins). */
  showTeam?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  error: null,
  isLoading: false,
  configuredCount: null,
  totalCount: null,
  showTeam: true,
})

const { t } = useI18n()
const loadoutStore = useLoadoutStore()
const { teamSide } = useTeamToggle()

const showConfiguredCount = computed(
  () =>
    typeof props.configuredCount === 'number' &&
    typeof props.totalCount === 'number' &&
    props.totalCount > 0
)
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Page heading -->
    <header class="mb-6">
      <div
        v-if="showTeam || showConfiguredCount"
        class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
      >
        <span v-if="showTeam" :class="teamSide === 'ct' ? 'text-team-ct' : 'text-team-t'">
          {{ teamSide === 'ct' ? t('teams.counterTerrorists') : t('teams.terrorists') }}
        </span>
        <template v-if="showConfiguredCount">
          <span v-if="showTeam" aria-hidden="true">&middot;</span>
          <span>{{
            t('itemPage.configuredCount', {
              configured: configuredCount ?? 0,
              total: totalCount ?? 0,
            })
          }}</span>
        </template>
      </div>
      <h1 class="mt-1 font-display text-[28px] font-bold leading-tight tracking-[-0.02em]">
        {{ title }}
      </h1>
    </header>

    <!-- Error State -->
    <Alert v-if="error" variant="destructive" class="mb-6 z-10">
      <LucideCircleAlert />
      <AlertTitle>{{ error }}</AlertTitle>
    </Alert>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="flex justify-center items-center h-64">
      <Spinner class="size-10 text-primary" />
    </div>

    <!-- No Steam Login State -->
    <Empty v-else-if="!user" class="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideLock />
        </EmptyMedia>
        <EmptyTitle class="font-display tracking-[-0.02em]">
          {{ t('auth.loginRequiredTitle') }}
        </EmptyTitle>
        <EmptyDescription>{{ t('auth.loginRequired') }}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="default" @click="steamAuth.login()">
          {{ t('auth.login') }}
        </Button>
      </EmptyContent>
    </Empty>

    <!-- No Loadout Selected State -->
    <Empty v-else-if="!loadoutStore.selectedLoadoutId" class="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucidePackageOpen />
        </EmptyMedia>
        <EmptyTitle class="font-display tracking-[-0.02em]">
          {{ t('loadout.noLoadoutTitle') }}
        </EmptyTitle>
        <EmptyDescription>{{ t('loadout.noLoadoutHint') }}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="default"
          @click="loadoutStore.createLoadout(toSteamId(user.steamId), 'Default Loadout')"
        >
          {{ t('loadout.createDefault') }}
        </Button>
      </EmptyContent>
    </Empty>

    <!-- Main Content -->
  </div>
</template>

<style scoped></style>
