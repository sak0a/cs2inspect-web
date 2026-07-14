<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { Component, HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { Loader2Icon } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps {
  /** Visual appearance (ported from sui SButton) */
  variant?: NonNullable<ButtonVariants['variant']>
  /** Semantic color — replaces the old `:color="buttonColor.x"` strings */
  intent?: NonNullable<ButtonVariants['intent']>
  size?: NonNullable<ButtonVariants['size']>
  /** Corner radius. Defaults to `full` (the app's pill button language) */
  rounded?: NonNullable<ButtonVariants['rounded']>
  /** Square icon button (uses size-specific w/h) */
  iconOnly?: boolean
  /** Subtle translucent tint — only affects `variant="elevated"` */
  tinted?: boolean
  /** Full width */
  block?: boolean
  /** Shows a spinner (replacing the left icon) and disables the button */
  loading?: boolean
  disabled?: boolean
  /** Native button type (only applied when rendering a real <button>) */
  type?: 'button' | 'submit' | 'reset'
  /** Left icon as a component prop (alternative to the #icon-left slot) */
  iconLeft?: Component
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  variant: 'filled',
  intent: 'default',
  size: 'md',
  rounded: 'full',
  iconOnly: false,
  tinted: false,
  block: false,
  loading: false,
  disabled: false,
  type: 'button',
  iconLeft: undefined,
  class: undefined,
})

const isDisabled = computed(() => props.disabled || props.loading)
const isNativeButton = computed(() => props.as === 'button' && !props.asChild)

const classes = computed(() =>
  cn(
    buttonVariants({
      variant: props.variant,
      intent: props.intent,
      size: props.size,
      rounded: props.rounded,
      iconOnly: props.iconOnly,
      block: props.block,
      tinted: props.tinted,
    }),
    // Non-button tags don't support the `disabled` attribute — block pointer events
    isDisabled.value && !isNativeButton.value && 'pointer-events-none',
    props.class
  )
)
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :type="isNativeButton ? type : undefined"
    :disabled="isNativeButton && isDisabled ? true : undefined"
    :aria-disabled="!isNativeButton && isDisabled ? true : undefined"
    :data-disabled="isDisabled ? '' : undefined"
    :data-loading="loading ? '' : undefined"
    :class="classes"
  >
    <Loader2Icon v-if="loading" class="animate-spin" aria-hidden="true" />
    <slot v-else name="icon-left">
      <component :is="iconLeft" v-if="iconLeft" />
    </slot>
    <slot v-if="!(iconOnly && loading)" />
  </Primitive>
</template>
