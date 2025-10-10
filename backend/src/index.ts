import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'

const app = new Hono()

// CORS設定: フロントエンドからのリクエストを許可
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}))

// OpenAPI ドキュメント
const openApiDoc = {
  openapi: '3.0.0',
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation for your service',
  },
  paths: {
    '/': {
      get: {
        summary: 'Hello endpoint',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: 'Hello Hono!',
                },
              },
            },
          },
        },
      },
    },
  },
}

// OpenAPIドキュメントを提供
app.get('/doc', (c) => c.json(openApiDoc))

// Swagger UIを提供
app.get('/ui', swaggerUI({ url: '/doc' }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
