import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

/**
 * Custom Button CVA — union of the old sui SButton API (variant/size/rounded,
 * exact class recipes ported from app/components/sui/button.ts +
 * SButton.vue scoped CSS) and the naive-ui button colors, expressed as
 * `intent` compound variants (replaces the old `:color="buttonColor.x"`
 * CSS-var strings).
 */
export const buttonVariants = cva(
  // Base — ported from sui button.ts (focus:outline-none → v4 outline-hidden)
  'relative inline-flex items-center justify-center font-medium transition-all duration-(--s-duration-normal) ease-out overflow-hidden select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-[1.5px] border-transparent data-[disabled]:opacity-(--s-opacity-disabled) data-[disabled]:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-[1.2em]',
  {
    variants: {
      variant: {
        filled: 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]',
        outlined: 'bg-transparent border-primary text-primary hover:bg-primary/10',
        light: 'bg-primary/15 text-primary hover:bg-primary/25',
        ghost: 'bg-transparent text-primary hover:bg-accent',
        link: 'bg-transparent text-primary hover:underline',
        dashed: 'bg-transparent border-primary text-primary border-dashed hover:bg-primary/10',
        // Ported from SButton.vue `.s-button--glass` scoped CSS
        glass:
          'text-foreground bg-white/5 backdrop-blur-md backdrop-saturate-[1.8] border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_16px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_24px_rgba(0,0,0,0.45),0_2px_6px_rgba(0,0,0,0.25)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_8px_rgba(0,0,0,0.3)]',
        // Ported from SButton.vue `.s-button--elevated` scoped CSS
        elevated:
          'text-foreground border-none bg-linear-to-b from-white/12 to-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.25)] hover:from-white/15 hover:to-white/6 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_3px_6px_rgba(0,0,0,0.3)]',
      },
      intent: {
        default: '',
        primary: '',
        error: '',
        success: '',
        warning: '',
        info: '',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-xs gap-1',
        sm: 'px-2 py-0.5 text-sm gap-1.5',
        md: 'px-2 py-0.5 text-sm gap-2',
        lg: 'px-2.5 py-0.5 text-base gap-2',
        xl: 'px-3 py-0.5 text-lg gap-2.5',
      },
      rounded: {
        none: 'rounded-none',
        xs: 'rounded-xs',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        full: 'rounded-full',
      },
      iconOnly: {
        true: '',
        false: '',
      },
      block: {
        true: 'w-full',
        false: '',
      },
      tinted: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // ---- intent: error → shadcn destructive tokens ----
      { intent: 'error', variant: 'filled', class: 'bg-destructive text-destructive-foreground' },
      {
        intent: 'error',
        variant: ['outlined', 'dashed'],
        class: 'border-destructive text-destructive hover:bg-destructive/10',
      },
      {
        intent: 'error',
        variant: 'light',
        class: 'bg-destructive/15 text-destructive hover:bg-destructive/25',
      },
      {
        intent: 'error',
        variant: ['ghost', 'link', 'glass', 'elevated'],
        class: 'text-destructive',
      },
      // ---- intent: success → emerald (#10b981) ----
      { intent: 'success', variant: 'filled', class: 'bg-emerald-500 text-white' },
      {
        intent: 'success',
        variant: ['outlined', 'dashed'],
        class: 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10',
      },
      {
        intent: 'success',
        variant: 'light',
        class: 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25',
      },
      {
        intent: 'success',
        variant: ['ghost', 'link', 'glass', 'elevated'],
        class: 'text-emerald-500',
      },
      // ---- intent: warning → amber (#f59e0b) ----
      { intent: 'warning', variant: 'filled', class: 'bg-amber-500 text-black' },
      {
        intent: 'warning',
        variant: ['outlined', 'dashed'],
        class: 'border-amber-500 text-amber-500 hover:bg-amber-500/10',
      },
      {
        intent: 'warning',
        variant: 'light',
        class: 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25',
      },
      {
        intent: 'warning',
        variant: ['ghost', 'link', 'glass', 'elevated'],
        class: 'text-amber-500',
      },
      // ---- intent: info → blue (#3b82f6) ----
      { intent: 'info', variant: 'filled', class: 'bg-blue-500 text-white' },
      {
        intent: 'info',
        variant: ['outlined', 'dashed'],
        class: 'border-blue-500 text-blue-500 hover:bg-blue-500/10',
      },
      {
        intent: 'info',
        variant: 'light',
        class: 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25',
      },
      { intent: 'info', variant: ['ghost', 'link', 'glass', 'elevated'], class: 'text-blue-500' },
      // ---- tinted (only affects elevated, matching old SButton colorStyle) ----
      {
        tinted: true,
        variant: 'elevated',
        intent: 'primary',
        class:
          'from-primary/15 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-primary',
      },
      {
        tinted: true,
        variant: 'elevated',
        intent: 'error',
        class:
          'from-destructive/15 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 text-destructive',
      },
      {
        tinted: true,
        variant: 'elevated',
        intent: 'success',
        class:
          'from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/20 hover:to-emerald-500/10 text-emerald-500',
      },
      {
        tinted: true,
        variant: 'elevated',
        intent: 'warning',
        class:
          'from-amber-500/15 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 text-amber-500',
      },
      {
        tinted: true,
        variant: 'elevated',
        intent: 'info',
        class:
          'from-blue-500/15 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10 text-blue-500',
      },
      // ---- iconOnly square sizes (ported from SButton iconOnlySizes) ----
      { iconOnly: true, size: 'xs', class: 'p-0 w-6 h-6 text-xs' },
      { iconOnly: true, size: 'sm', class: 'p-0 w-8 h-8 text-sm' },
      { iconOnly: true, size: 'md', class: 'p-0 w-10 h-10 text-base' },
      { iconOnly: true, size: 'lg', class: 'p-0 w-12 h-12 text-lg' },
      { iconOnly: true, size: 'xl', class: 'p-0 w-14 h-14 text-xl' },
    ],
    defaultVariants: {
      variant: 'filled',
      intent: 'default',
      size: 'md',
      rounded: 'full',
      iconOnly: false,
      block: false,
      tinted: false,
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
