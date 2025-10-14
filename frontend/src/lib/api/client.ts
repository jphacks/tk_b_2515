import type { ErrorResponse } from "@/types/api";
import { config } from "../config";

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
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * POSTリクエストを送信（JSON）
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * POSTリクエストを送信（FormData）
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * PATCHリクエストを送信（JSON）
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * Fetchエラーを処理
   */
  private handleFetchError(error: unknown, endpoint: string): Error {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return new Error(
        `バックエンドサーバーに接続できません。\n` +
          `サーバーが起動しているか確認してください。\n` +
          `URL: ${this.baseUrl}${endpoint}\n`
      );
    }
    return error instanceof Error
      ? error
      : new Error(`APIリクエストエラー: ${String(error)}`);
  }

  /**
   * レスポンスを処理
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = (await response.json()) as ErrorResponse;
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
export const apiClient = new ApiClient(`${config.api.baseUrl}/api`);
