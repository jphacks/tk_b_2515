import { useEffect, useRef, useState, useCallback } from "react";

export interface MediaDevicesOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export interface UseMediaDevicesReturn {
  stream: MediaStream | null;
  error: Error | null;
  isLoading: boolean;
  startStream: (options?: MediaDevicesOptions) => Promise<void>;
  stopStream: () => void;
}

/**
 * MediaDevices APIを使用してカメラとマイクにアクセスするカスタムフック
 */
export function useMediaDevices(
  initialOptions?: MediaDevicesOptions
): UseMediaDevicesReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = async (options?: MediaDevicesOptions) => {
    try {
      setIsLoading(true);
      setError(null);

      // MediaDevices APIがサポートされているか確認
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "お使いのブラウザはカメラ/マイクへのアクセスをサポートしていません。最新のブラウザをご利用ください。"
        );
      }

      // 既存のストリームがあれば停止
      if (streamRef.current) {
        stopStream();
      }

      const constraints = options ||
        initialOptions || { audio: true, video: true };

      // MediaDevices APIを使用してメディアストリームを取得
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      let errorMessage = "メディアデバイスへのアクセスに失敗しました";

      if (err instanceof Error) {
        // エラータイプに応じて分かりやすいメッセージを設定
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "カメラとマイクへのアクセスが拒否されました。ブラウザの設定からアクセスを許可してください。";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "カメラまたはマイクが見つかりません。デバイスが接続されているか確認してください。";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "カメラまたはマイクが他のアプリケーションで使用中の可能性があります。";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "指定された設定でカメラ/マイクを起動できません。";
        } else if (err.name === "SecurityError") {
          errorMessage = "セキュリティ上の理由でアクセスが拒否されました。HTTPSでアクセスしているか確認してください。";
        } else {
          errorMessage = err.message || errorMessage;
        }
      }

      const error = new Error(errorMessage);
      setError(error);
      console.error("メディアデバイスへのアクセスエラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      // すべてのトラックを停止
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // クリーンアップ: コンポーネントのアンマウント時にストリームを停止
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    stream,
    error,
    isLoading,
    startStream,
    stopStream,
  };
}
