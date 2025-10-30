import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getVoiceById,
  getVoices,
  speechToText,
  speechToTextWithVoice,
  textToSpeech,
} from "../../services/stt";

const speech = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

// Voice schema for OpenAPI documentation
const voiceSchema = z.object({
  voiceId: z.string(),
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  previewUrl: z.string().optional(),
  availableForTiers: z.array(z.string()).optional(),
  settings: z.any().optional(),
  sharing: z.any().optional(),
  highQualityBaseModelIds: z.array(z.string()).optional(),
  safetyControl: z.string().optional(),
  voiceVerification: z.any().optional(),
  ownerUserId: z.string().optional(),
  permission: z.string().optional(),
  isLegacy: z.boolean().optional(),
  isOwner: z.boolean().optional(),
  samples: z.array(z.any()).optional(),
  fineTuning: z.any().optional(),
  createdAtUnix: z.number().optional(),
});

type VoiceResponse = z.infer<typeof voiceSchema>;

// Get available voices
const getVoicesRoute = createRoute({
  method: "get",
  path: "/voices",
  tags: ["Voices"],
  responses: {
    200: {
      description: "List of available voices",
      content: {
        "application/json": {
          schema: z.object({
            voices: z.array(voiceSchema),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

speech.openapi(getVoicesRoute, async (c) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "API key not configured" }, 500);
    }

    const voices = await getVoices(apiKey);
    const responseBody = {
      voices: voices as VoiceResponse[],
    };
    return c.json(responseBody, 200);
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    return c.json({ error: "Failed to fetch voices" }, 500);
  }
});

// Get specific voice by ID
const getVoiceByIdRoute = createRoute({
  method: "get",
  path: "/voices/{voiceId}",
  tags: ["Voices"],
  request: {
    params: z.object({
      voiceId: z.string().openapi({
        description: "Voice ID",
        example: "21m00Tcm4TlvDq8ikWAM",
      }),
    }),
  },
  responses: {
    200: {
      description: "Voice details",
      content: {
        "application/json": {
          schema: z.object({
            voice: z.any(),
          }),
        },
      },
    },
    404: {
      description: "Voice not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

speech.openapi(getVoiceByIdRoute, async (c) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "API key not configured" }, 500);
    }

    const { voiceId } = c.req.valid("param");
    const voice = (await getVoiceById(apiKey, voiceId)) as VoiceResponse | null;

    if (!voice) {
      return c.json({ error: "Voice not found" }, 404);
    }

    return c.json({ voice }, 200);
  } catch (error) {
    console.error("Failed to fetch voice:", error);
    return c.json({ error: "Failed to fetch voice" }, 500);
  }
});

// Speech-to-text endpoint
speech.post("/stt", async (c) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("STT Error: ELEVENLABS_API_KEY is not configured");
      return c.json({ error: "API key not configured" }, 500);
    }

    const body = await c.req.parseBody();
    const audioFile = body.audio;
    const voiceId = body.voiceId as string | undefined;

    console.log("STT Request received:", {
      hasAudio: !!audioFile,
      audioType: audioFile instanceof File ? audioFile.type : typeof audioFile,
      audioSize: audioFile instanceof File ? audioFile.size : 0,
      voiceId: voiceId || "none",
    });

    if (!audioFile || !(audioFile instanceof File)) {
      console.error("STT Error: Invalid audio file", {
        audioFile: typeof audioFile,
      });
      return c.json({ error: "Audio file is required" }, 400);
    }

    if (voiceId) {
      // Get voice info along with transcription
      console.log("Calling speechToTextWithVoice with voiceId:", voiceId);
      const result = await speechToTextWithVoice(apiKey, audioFile, voiceId);
      console.log("STT Success:", {
        textLength: result.text.length,
        hasVoice: !!result.voice,
      });
      return c.json(result);
    }
    // Simple STT without voiceId
    console.log("Calling speechToText without voiceId");
    const text = await speechToText(apiKey, audioFile);
    console.log("STT Success:", { textLength: text.length });
    return c.json({ text });
  } catch (error) {
    // Detailed error logging
    console.error("Error in STT - Full details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json(
      {
        error: "Failed to process speech-to-text",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      500
    );
  }
});

// Text-to-speech endpoint
const ttsRoute = createRoute({
  method: "post",
  path: "/tts",
  tags: ["Speech"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            text: z.string().openapi({
              description: "Text to convert to speech",
              example: "こんにちは、これはテストです",
            }),
            voiceId: z.string().optional().openapi({
              description:
                "Voice ID to use for synthesis (optional, uses default if not provided)",
              example: "21m00Tcm4TlvDq8ikWAM",
            }),
            modelId: z.string().optional().openapi({
              description:
                "Model ID (optional, defaults to eleven_multilingual_v2)",
              example: "eleven_multilingual_v2",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Audio stream",
      content: {
        "audio/mpeg": {
          schema: z.any(),
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

speech.openapi(ttsRoute, async (c) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "API key not configured" }, 500);
    }

    const { text, voiceId, modelId } = c.req.valid("json");

    // Use default voiceId if not provided (Rachel - a natural sounding voice)
    const selectedVoiceId = voiceId || "lhTvHflPVOqgSWyuWQry";

    const audioStream = await textToSpeech(
      apiKey,
      text,
      selectedVoiceId,
      modelId
    );

    // Set appropriate headers for audio streaming
    c.header("Content-Type", "audio/mpeg");
    c.header("Transfer-Encoding", "chunked");

    return c.body(audioStream);
  } catch (error) {
    console.error("Failed to process text-to-speech:", error);
    return c.json({ error: "Failed to process text-to-speech" }, 500);
  }
});

export default speech;
