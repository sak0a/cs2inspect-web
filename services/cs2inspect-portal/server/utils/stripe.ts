import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function useStripe(): Stripe {
  if (!stripeClient) {
    const config = useRuntimeConfig()
    stripeClient = new Stripe(config.stripeSecretKey)
  }
  return stripeClient
}

export const PLANS = {
  '30d': { days: 30, price: 300, label: '30 Days' },
  '90d': { days: 90, price: 800, label: '90 Days' },
  '365d': { days: 365, price: 3000, label: '365 Days' },
} as const

export const MULTI_SERVER_DISCOUNT_PCT = 15

export type PlanId = keyof typeof PLANS
