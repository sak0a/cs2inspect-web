// @saka-ui/registry v0.2.10 — button
// Source: saka-ui@0.2.10
// Do not remove this header if you want `saka-ui diff` to work.
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-medium transition-all duration-(--s-duration-normal) ease-out overflow-hidden select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-[1.5px] border-transparent',
  {
    variants: {
      variant: {
        filled: 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]',
        outlined: 'bg-transparent border-primary text-primary hover:bg-primary/10',
        light: 'bg-primary/15 text-primary hover:bg-primary/25',
        ghost: 'bg-transparent text-primary hover:bg-accent',
        link: 'bg-transparent text-primary hover:underline',
        dashed: 'bg-transparent border-primary text-primary border-dashed hover:bg-primary/10',
        glass: '',
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
    },
    defaultVariants: {
      variant: 'filled',
      size: 'md',
      rounded: 'md',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
