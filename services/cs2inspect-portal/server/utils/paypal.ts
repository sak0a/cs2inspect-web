const PAYPAL_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

let accessToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken

  const config = useRuntimeConfig()
  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  accessToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return accessToken!
}

export async function createPayPalOrder(amountEur: string, description: string, metadata: Record<string, string>): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken()
  const config = useRuntimeConfig()

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'EUR', value: amountEur },
        description,
        custom_id: JSON.stringify(metadata),
      }],
      application_context: {
        return_url: `${config.portalBaseUrl}/dashboard?payment=success`,
        cancel_url: `${config.portalBaseUrl}/buy?payment=cancelled`,
      },
    }),
  })

  const order = await res.json()
  const approveUrl = order.links.find((l: { rel: string }) => l.rel === 'approve')?.href
  return { id: order.id, approveUrl }
}

export async function verifyPayPalWebhook(headers: Record<string, string>, body: string, webhookId: string): Promise<boolean> {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  })

  const result = await res.json()
  return result.verification_status === 'SUCCESS'
}
