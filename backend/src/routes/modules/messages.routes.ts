import { prisma } from "../../lib/prisma";
import { createApiRoute } from "../utils";

const messages = createApiRoute();

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
