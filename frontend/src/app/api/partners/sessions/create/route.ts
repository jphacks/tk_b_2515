import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, partnerId } = body;

    if (!userId || !partnerId) {
      return NextResponse.json(
        { error: "userId and partnerId are required" },
        { status: 400 },
      );
    }

    // バックエンドAPIを呼び出してセッションを作成
    const response = await fetch(
      `${config.api.baseUrl}/api/partners/sessions/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          partnerId,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to create session" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      sessionId: data.sessionId,
      roomId: data.roomId,
    });
  } catch (error) {
    console.error("Failed to create partner session:", error);
    return NextResponse.json(
      { error: "Failed to create partner session" },
      { status: 500 },
    );
  }
}
