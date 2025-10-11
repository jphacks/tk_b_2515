import { apiClient } from "./client";
import type {
  SpeechToTextRequest,
  SpeechToTextResponse,
} from "@/types/api";

/**
 * Speech-to-Text API
 * 音声ファイルをテキストに変換
 */
export async function speechToText(
  request: SpeechToTextRequest
): Promise<SpeechToTextResponse> {
  const formData = new FormData();
  formData.append("audio", request.audio);

  if (request.voiceId) {
    formData.append("voiceId", request.voiceId);
  }

  return apiClient.postFormData<SpeechToTextResponse>("/api/stt", formData);
}
