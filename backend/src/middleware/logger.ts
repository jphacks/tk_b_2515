import { Context, Next } from 'hono'

export const logger = async (c: Context, next: Next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${c.req.method} ${c.req.url} - ${ms}ms`)
}
