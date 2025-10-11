import { Hono } from 'hono'
import { getVoiceById, getVoices, speechToText, speechToTextWithVoice } from '../services/stt'
import { prisma } from '../lib/prisma'

const api = new Hono<{ Bindings: { ELEVENLABS_API_KEY: string } }>()

api.get('/health', (c) => c.json({ status: 'ok' }))

// === Conversation Session Endpoints ===

// 新しいセッションを作成
api.post('/sessions', async (c) => {
  try {
    const session = await prisma.conversationSession.create({
      data: {},
    })
    return c.json({ session }, 201)
  } catch (error) {
    console.error('Error creating session:', error)
    return c.json({ error: 'Failed to create session' }, 500)
  }
})

// すべてのセッションを取得
api.get('/sessions', async (c) => {
  try {
    const sessions = await prisma.conversationSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        messages: true,
        feedback: true,
      },
    })
    return c.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return c.json({ error: 'Failed to fetch sessions' }, 500)
  }
})

// 特定のセッションを取得
api.get('/sessions/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    const session = await prisma.conversationSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        feedback: true,
      },
    })

    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    return c.json({ session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return c.json({ error: 'Failed to fetch session' }, 500)
  }
})

// セッションを終了
api.patch('/sessions/:sessionId/finish', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    const session = await prisma.conversationSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date() },
    })
    return c.json({ session })
  } catch (error) {
    console.error('Error finishing session:', error)
    return c.json({ error: 'Failed to finish session' }, 500)
  }
})

// === Message Endpoints ===

// セッションにメッセージを追加
api.post('/sessions/:sessionId/messages', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    const body = await c.req.json()
    const { speaker, content } = body

    if (!speaker || !content) {
      return c.json({ error: 'speaker and content are required' }, 400)
    }

    if (speaker !== 'User' && speaker !== 'AI') {
      return c.json({ error: 'speaker must be User or AI' }, 400)
    }

    const message = await prisma.message.create({
      data: {
        speaker,
        content,
        sessionId,
      },
    })

    return c.json({ message }, 201)
  } catch (error) {
    console.error('Error creating message:', error)
    return c.json({ error: 'Failed to create message' }, 500)
  }
})

// === Feedback Endpoints ===

// セッションにフィードバックを追加
api.post('/sessions/:sessionId/feedback', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    const body = await c.req.json()
    const { feedbackText, score } = body

    if (!feedbackText) {
      return c.json({ error: 'feedbackText is required' }, 400)
    }

    const feedback = await prisma.feedback.create({
      data: {
        feedbackText,
        score: score || null,
        sessionId,
      },
    })

    return c.json({ feedback }, 201)
  } catch (error) {
    console.error('Error creating feedback:', error)
    return c.json({ error: 'Failed to create feedback' }, 500)
  }
})

// 利用可能な音声一覧を取得
api.get('/voices', async (c) => {
  try {
    const apiKey = c.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

    const voices = await getVoices(apiKey)
    return c.json({ voices })
  } catch (error) {
    console.error('Error fetching voices:', error)
    return c.json({ error: 'Failed to fetch voices' }, 500)
  }
})

// 特定の音声情報を取得
api.get('/voices/:voiceId', async (c) => {
  try {
    const apiKey = c.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

    const voiceId = c.req.param('voiceId')
    const voice = await getVoiceById(apiKey, voiceId)

    if (!voice) {
      return c.json({ error: 'Voice not found' }, 404)
    }

    return c.json({ voice })
  } catch (error) {
    console.error('Error fetching voice:', error)
    return c.json({ error: 'Failed to fetch voice' }, 500)
  }
})

// Speech-to-text エンドポイント
api.post('/stt', async (c) => {
  try {
    const apiKey = c.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }

    const body = await c.req.parseBody()
    const audioFile = body.audio
    const voiceId = body.voiceId as string | undefined

    if (!audioFile || !(audioFile instanceof File)) {
      return c.json({ error: 'Audio file is required' }, 400)
    }

    if (voiceId) {
      // voiceIdが指定されている場合は音声情報も取得
      const result = await speechToTextWithVoice(apiKey, audioFile, voiceId)
      return c.json(result)
    } else {
      // voiceIdなしの場合は単純にSTT
      const text = await speechToText(apiKey, audioFile)
      return c.json({ text })
    }
  } catch (error) {
    console.error('Error in STT:', error)
    return c.json({ error: 'Failed to process speech-to-text' }, 500)
  }
})

export default api
