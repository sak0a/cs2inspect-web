import { defineEventHandler, setCookie } from 'h3'

export default defineEventHandler((event) => {
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
  })
  return { success: true }
})
