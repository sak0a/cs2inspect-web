<script setup lang="ts">
interface Props {
    collapsed?: boolean
    collapsedWidth?: number
    width?: number
    bordered?: boolean
    showTrigger?: boolean | string
    mode?: 'left' | 'top'
    hoverExpanded?: boolean
    enableTransitions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    collapsed: false,
    collapsedWidth: 64,
    width: 200,
    bordered: false,
    showTrigger: false,
    mode: 'left',
    hoverExpanded: false,
    enableTransitions: false,
})

const emit = defineEmits<{
    'update:collapsed': [value: boolean]
}>()

const isOverlay = computed(() => props.collapsed && props.hoverExpanded)

// Width the wrapper occupies in normal document flow (left mode only)
const wrapperWidth = computed(() => {
    if (props.mode === 'top') return undefined
    return props.collapsed ? props.collapsedWidth : props.width
})

// Width the aside itself renders at (expands when overlay)
const asideWidth = computed(() => {
    if (props.mode === 'top') return undefined
    if (isOverlay.value) return props.width
    return undefined // matches wrapper via width: 100%
})

function toggleCollapsed() {
    emit('update:collapsed', !props.collapsed)
}
</script>

<template>
    <div
        class="flex-shrink-0 relative"
        :class="[
            enableTransitions ? 'transition-all duration-200 ease-in-out' : '',
            mode === 'top' ? 'w-full sticky top-0 z-40' : '',
        ]"
        :style="{ width: mode === 'left' ? `${wrapperWidth}px` : undefined }"
    >
        <aside
            class="text-white s-sider-glass"
            :class="[
                enableTransitions ? 'transition-all duration-200 ease-in-out' : '',
                mode === 'top' ? 's-sider-glass--top' : '',
                isOverlay ? 's-sider-glass--overlay' : '',
                isOverlay && mode === 'left' ? 'absolute top-0 left-0 bottom-0 z-50' : 'relative',
                isOverlay && mode === 'top' ? 'absolute top-0 left-0 right-0 z-50' : '',
                mode === 'left' && !isOverlay ? 'h-full' : '',
            ]"
            :style="{
                width: asideWidth ? `${asideWidth}px` : mode === 'left' ? '100%' : undefined,
            }"
        >
            <div
                :class="[
                    mode === 'top'
                        ? 'flex flex-row items-center overflow-x-auto overflow-y-hidden w-full'
                        : 'flex flex-col h-full overflow-y-auto overflow-x-hidden',
                    enableTransitions ? 'opacity-100' : 'opacity-0',
                ]"
            >
                <slot />
            </div>

            <!-- Left mode trigger: vertical bar on right edge -->
            <button
                v-if="showTrigger && mode === 'left'"
                class="s-sider-trigger"
                :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                @click="toggleCollapsed"
            >
                <span class="s-sider-trigger-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="6"
                        height="16"
                        viewBox="0 0 6 16"
                        fill="currentColor"
                        class="transition-transform duration-200"
                        :class="{ 'rotate-180': collapsed }"
                    >
                        <path d="M3 0L0 3h6L3 0zM3 16l3-3H0l3 3z" />
                    </svg>
                </span>
            </button>

            <!-- Top mode trigger: horizontal bar on bottom edge -->
            <button
                v-if="showTrigger && mode === 'top'"
                class="s-sider-trigger-top"
                :aria-label="collapsed ? 'Expand navbar' : 'Collapse navbar'"
                @click="toggleCollapsed"
            >
                <span class="s-sider-trigger-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="6"
                        viewBox="0 0 16 6"
                        fill="currentColor"
                        class="transition-transform duration-200"
                        :class="{ 'rotate-180': collapsed }"
                    >
                        <path d="M0 3L3 0v6L0 3zM16 3l-3 3V0l3 3z" />
                    </svg>
                </span>
            </button>
        </aside>
    </div>
</template>

<style scoped lang="sass">
.s-sider-glass
  background: rgba(0, 0, 0, 0.15)
  backdrop-filter: blur(12px)
  -webkit-backdrop-filter: blur(12px)

.s-sider-trigger
  position: absolute
  top: 0
  right: -12px
  width: 24px
  height: 100%
  display: flex
  align-items: center
  justify-content: center
  cursor: pointer
  z-index: 10
  background: transparent
  border: none
  padding: 0

.s-sider-trigger-top
  position: absolute
  bottom: -12px
  left: 0
  width: 100%
  height: 24px
  display: flex
  align-items: center
  justify-content: center
  cursor: pointer
  z-index: 10
  background: transparent
  border: none
  padding: 0

.s-sider-trigger-icon
  display: flex
  align-items: center
  justify-content: center
  width: 12px
  height: 36px
  border-radius: 6px
  color: rgba(255, 255, 255, 0.25)
  transition: color 0.2s ease, background-color 0.2s ease

  &:hover
    color: rgba(255, 255, 255, 0.6)
    background-color: rgba(255, 255, 255, 0.08)

.s-sider-trigger-top .s-sider-trigger-icon
  width: 36px
  height: 12px
</style>
