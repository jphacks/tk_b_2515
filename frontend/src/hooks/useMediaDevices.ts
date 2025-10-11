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
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("メディアデバイスへのアクセスエラー:", error);
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
