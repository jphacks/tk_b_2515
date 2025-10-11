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

				// 音声トラックのみを含む新しいストリームを作成
				const audioTracks = stream.getAudioTracks();
				if (audioTracks.length === 0) {
					throw new Error("音声トラックが見つかりません");
				}
				const audioStream = new MediaStream(audioTracks);

				// サポートされているMIMEタイプを確認（優先順位付き）
				let mimeType = options?.mimeType;

				if (!mimeType) {
					const supportedTypes = [
						"audio/webm;codecs=opus",
						"audio/webm",
						"audio/ogg;codecs=opus",
						"audio/mp4",
						"audio/mpeg",
					];

					for (const type of supportedTypes) {
						if (MediaRecorder.isTypeSupported(type)) {
							mimeType = type;
							break;
						}
					}

					if (!mimeType) {
						// フォールバック: MIMEタイプなしで試す
						console.warn("サポートされている音声MIMEタイプが見つかりませんでした。デフォルト設定を使用します。");
					}
				}

				const recorderOptions: MediaRecorderOptions = mimeType
					? {
							mimeType,
							audioBitsPerSecond: options?.audioBitsPerSecond || 128000,
					  }
					: {};

				// MediaRecorderのインスタンスを作成（音声ストリームのみ使用）
				const mediaRecorder = new MediaRecorder(audioStream, recorderOptions);

				console.log("MediaRecorder作成成功:", {
					mimeType: mediaRecorder.mimeType,
					state: mediaRecorder.state,
				});

				// データが利用可能になったときのハンドラ
				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						chunksRef.current.push(event.data);
					}
				};

				// 録音が停止したときのハンドラ
				mediaRecorder.onstop = () => {
					const blobType = mimeType || mediaRecorder.mimeType;
					const audioBlob = new Blob(chunksRef.current, { type: blobType });
					const url = URL.createObjectURL(audioBlob);

					setAudioBlobs([...chunksRef.current]);
					setAudioURL(url);
					setIsRecording(false);
					setIsPaused(false);

					console.log("録音停止:", {
						blobSize: audioBlob.size,
						blobType: audioBlob.type,
						url,
					});
				};

				// エラーハンドラ
				mediaRecorder.onerror = (event) => {
					const errorEvent = event as ErrorEvent;
					const error = new Error(
						`MediaRecorder error: ${errorEvent.error || errorEvent.message || "Unknown error"}`,
					);
					setError(error);
					setIsRecording(false);
					setIsPaused(false);
					console.error("録音エラー:", error, event);
				};

				mediaRecorderRef.current = mediaRecorder;

				// 録音を開始（1秒ごとにデータを取得）
				mediaRecorder.start(1000);
				setIsRecording(true);
				setIsPaused(false);

				console.log("録音開始成功");
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				setError(error);
				setIsRecording(false);
				setIsPaused(false);
				console.error("録音開始エラー:", error, err);
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
