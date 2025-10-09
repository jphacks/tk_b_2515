import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS設定: フロントエンドからのリクエストを許可
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
