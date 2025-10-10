import { Hono } from 'hono'
import { getVoiceById, getVoices, speechToText, speechToTextWithVoice } from '../services/stt'

const api = new Hono<{ Bindings: { ELEVENLABS_API_KEY: string } }>()

api.get('/health', (c) => c.json({ status: 'ok' }))

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
