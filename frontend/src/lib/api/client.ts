import { config } from "../config";
import type { ErrorResponse } from "@/types/api";

/**
 * APIクライアントの基底クラス
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * GETリクエストを送信
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POSTリクエストを送信（JSON）
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POSTリクエストを送信（FormData）
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * レスポンスを処理
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = await response.json() as ErrorResponse;
        errorMessage = errorData.error || errorMessage;
      } catch {
        // JSONのパースに失敗した場合はデフォルトのエラーメッセージを使用
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }
}

// シングルトンインスタンスをエクスポート
export const apiClient = new ApiClient(config.api.baseUrl);
