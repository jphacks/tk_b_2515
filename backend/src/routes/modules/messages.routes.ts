import { OpenAPIHono } from "@hono/zod-openapi";
import { prisma } from "../../lib/prisma";

const messages = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

// Add message to session
messages.post("/:sessionId/messages", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const body = await c.req.json();
    const { role, content, audioUrl } = body;

    if (!role || !content) {
      return c.json({ error: "role and content are required" }, 400);
    }

    if (role !== "user" && role !== "assistant") {
      return c.json({ error: "role must be user or assistant" }, 400);
    }

    const message = await prisma.message.create({
      data: {
        role,
        content,
        audioUrl: audioUrl || null,
        conversationId: sessionId,
      },
    });

    return c.json({ message }, 201);
  } catch (error) {
    console.error("Failed to create message:", error);
    return c.json({ error: "Failed to create message" }, 500);
  }
});

export default messages;
