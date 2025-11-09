import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    // バックエンドAPIを呼び出してセッションを開始
    const response = await fetch(
      `${config.api.baseUrl}/api/partners/sessions/${sessionId}/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to start session" },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to start partner session:", error);
    return NextResponse.json(
      { error: "Failed to start partner session" },
      { status: 500 },
    );
  }
}
