import { useCallback, useRef, useState } from "react";

export interface AudioRecorderOptions {
	mimeType?: string;
	audioBitsPerSecond?: number;
}

export interface UseAudioRecorderReturn {
	isRecording: boolean;
	isPaused: boolean;
	audioBlobs: Blob[];
	audioURL: string | null;
	error: Error | null;
	startRecording: (stream: MediaStream, options?: AudioRecorderOptions) => void;
	stopRecording: () => void;
	pauseRecording: () => void;
	resumeRecording: () => void;
	clearRecording: () => void;
}

/**
 * MediaRecorder APIを使用して音声を録音するカスタムフック
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
	const [isRecording, setIsRecording] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
	const [audioURL, setAudioURL] = useState<string | null>(null);
	const [error, setError] = useState<Error | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);

	const startRecording = useCallback(
		(stream: MediaStream, options?: AudioRecorderOptions) => {
			try {
				setError(null);
				chunksRef.current = [];
				setAudioBlobs([]);
				setAudioURL(null);

				// サポートされているMIMEタイプを確認
				const mimeType =
					options?.mimeType ||
					(MediaRecorder.isTypeSupported("audio/webm")
						? "audio/webm"
						: "audio/mp4");

				const recorderOptions: MediaRecorderOptions = {
					mimeType,
					audioBitsPerSecond: options?.audioBitsPerSecond || 128000,
				};

				// MediaRecorderのインスタンスを作成
				const mediaRecorder = new MediaRecorder(stream, recorderOptions);

				// データが利用可能になったときのハンドラ
				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						chunksRef.current.push(event.data);
					}
				};

				// 録音が停止したときのハンドラ
				mediaRecorder.onstop = () => {
					const audioBlob = new Blob(chunksRef.current, { type: mimeType });
					const url = URL.createObjectURL(audioBlob);

					setAudioBlobs([...chunksRef.current]);
					setAudioURL(url);
					setIsRecording(false);
					setIsPaused(false);
				};

				// エラーハンドラ
				mediaRecorder.onerror = (event) => {
					const error = new Error(
						`MediaRecorder error: ${(event as ErrorEvent).error}`,
					);
					setError(error);
					console.error("録音エラー:", error);
				};

				mediaRecorderRef.current = mediaRecorder;

				// 録音を開始（1秒ごとにデータを取得）
				mediaRecorder.start(1000);
				setIsRecording(true);
				setIsPaused(false);
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				setError(error);
				console.error("録音開始エラー:", error);
			}
		},
		[],
	);

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
		}
	}, [isRecording]);

	const pauseRecording = useCallback(() => {
		if (mediaRecorderRef.current && isRecording && !isPaused) {
			mediaRecorderRef.current.pause();
			setIsPaused(true);
		}
	}, [isRecording, isPaused]);

	const resumeRecording = useCallback(() => {
		if (mediaRecorderRef.current && isRecording && isPaused) {
			mediaRecorderRef.current.resume();
			setIsPaused(false);
		}
	}, [isRecording, isPaused]);

	const clearRecording = useCallback(() => {
		// 既存のURLをクリーンアップ
		if (audioURL) {
			URL.revokeObjectURL(audioURL);
		}

		chunksRef.current = [];
		setAudioBlobs([]);
		setAudioURL(null);
		setError(null);
	}, [audioURL]);

	return {
		isRecording,
		isPaused,
		audioBlobs,
		audioURL,
		error,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
		clearRecording,
	};
}
