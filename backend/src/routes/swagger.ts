import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'

const swagger = new Hono()

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
    '/api/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/voices': {
      get: {
        summary: 'Get all available voices',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    voices: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          voiceId: { type: 'string' },
                          name: { type: 'string' },
                          category: { type: 'string' },
                          description: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/voices/{voiceId}': {
      get: {
        summary: 'Get voice by ID',
        parameters: [
          {
            name: 'voiceId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    voice: {
                      type: 'object',
                      properties: {
                        voiceId: { type: 'string' },
                        name: { type: 'string' },
                        category: { type: 'string' },
                        description: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Voice not found',
          },
        },
      },
    },
    '/api/stt': {
      post: {
        summary: 'Speech to text conversion',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  audio: {
                    type: 'string',
                    format: 'binary',
                    description: 'Audio file',
                  },
                  voiceId: {
                    type: 'string',
                    description: 'Optional voice ID',
                  },
                },
                required: ['audio'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: {
                      type: 'string',
                      description: 'Transcribed text',
                    },
                    voice: {
                      type: 'object',
                      description: 'Voice information (if voiceId provided)',
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
          },
        },
      },
    },
  },
}

// OpenAPIドキュメントを提供
swagger.get('/doc', (c) => c.json(openApiDoc))

// Swagger UIを提供
swagger.get('/ui', swaggerUI({ url: '/doc' }))

export default swagger
