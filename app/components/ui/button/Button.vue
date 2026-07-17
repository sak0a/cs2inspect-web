<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { Component, HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { Loader2Icon } from '@lucide/vue'
import { Primitive } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  iconLeft?: Component
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  variant: 'default',
  size: 'default',
  loading: false,
  disabled: false,
  type: 'button',
  iconLeft: undefined,
  class: undefined,
})

const isDisabled = computed(() => props.disabled || props.loading)
const isNativeButton = computed(() => props.as === 'button' && !props.asChild)
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :as="as"
    :as-child="asChild"
    :type="isNativeButton ? type : undefined"
    :disabled="isNativeButton && isDisabled ? true : undefined"
    :aria-disabled="!isNativeButton && isDisabled ? true : undefined"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <Loader2Icon v-if="loading" class="animate-spin" aria-hidden="true" />
    <slot v-else name="icon-left">
      <component :is="iconLeft" v-if="iconLeft" />
    </slot>
    <slot />
  </Primitive>
</template>
