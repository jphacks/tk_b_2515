# Backend API

## Setup

### Installation
```bash
npm install
```

### Configuration
Copy `.env.example` to `.env` and set the required environment variables:

```bash
# Required for STT (Speech-to-Text) functionality
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

For local development, you can also set environment variables in `wrangler.jsonc`:
```jsonc
{
  "vars": {
    "ELEVENLABS_API_KEY": "your-api-key-here"
  }
}
```

### Development
```bash
npm run dev
```

The API will be available at `http://localhost:8787`.

## API Endpoints

### Health Check
```bash
GET /api/health
```

Returns server health status.

### Speech-to-Text (STT)
```bash
POST /api/stt
```

Converts audio file to text using ElevenLabs API.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `audio` (required): Audio file (File)
  - `voiceId` (optional): Voice ID for additional voice information

**Response (without voiceId):**
```json
{
  "text": "Transcribed text from audio"
}
```

**Response (with voiceId):**
```json
{
  "text": "Transcribed text from audio",
  "voice": {
    "voiceId": "...",
    "name": "...",
    "category": "...",
    ...
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8787/api/stt \
  -F "audio=@path/to/audio.mp3"
```

### Get Available Voices
```bash
GET /api/voices
```

Returns list of available voices from ElevenLabs.

### Get Voice by ID
```bash
GET /api/voices/:voiceId
```

Returns specific voice information by ID.

## API Documentation

OpenAPI documentation is available at:
- JSON: `http://localhost:8787/doc`
- Swagger UI: `http://localhost:8787/ui`

## Deployment

```bash
npm run deploy
```

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
