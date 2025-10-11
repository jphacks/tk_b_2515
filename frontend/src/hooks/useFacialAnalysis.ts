import { useEffect, useRef, useState } from "react";
import type {
	FaceLandmarker,
	FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface FacialMetrics {
	isSmiling: boolean; // 笑顔かどうか
	smileIntensity: number; // 笑顔の強さ (0-1)
	isLookingAtTarget: boolean; // 対象（アバター）を見ているか
	gazeScore: number; // 視線スコア (0-1, 1が最適)
	mouthCornerLeft: number; // 左口角の高さ
	mouthCornerRight: number; // 右口角の高さ
}

export interface GazeTarget {
	x: number; // 画面上のX座標（0-1の範囲、左が0、右が1）
	y: number; // 画面上のY座標（0-1の範囲、上が0、下が1）
}

export interface UseFacialAnalysisReturn {
	metrics: FacialMetrics | null;
	isAnalyzing: boolean;
	error: Error | null;
	startAnalysis: (videoElement: HTMLVideoElement, gazeTarget?: GazeTarget) => Promise<void>;
	stopAnalysis: () => void;
	setGazeTarget: (target: GazeTarget) => void;
}

const DEFAULT_METRICS: FacialMetrics = {
	isSmiling: false,
	smileIntensity: 0,
	isLookingAtTarget: false,
	gazeScore: 0,
	mouthCornerLeft: 0,
	mouthCornerRight: 0,
};

/**
 * MediaPipe Face Landmarkerを使用した表情分析フック
 */
export function useFacialAnalysis(): UseFacialAnalysisReturn {
	const [metrics, setMetrics] = useState<FacialMetrics | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const videoElementRef = useRef<HTMLVideoElement | null>(null);
	const gazeTargetRef = useRef<GazeTarget>({ x: 0.25, y: 0.5 }); // デフォルト: 左側中央（アバター位置）

	// MediaPipe Face Landmarkerの初期化
	const initializeFaceLandmarker = async () => {
		try {
			const { FaceLandmarker, FilesetResolver } = await import(
				"@mediapipe/tasks-vision"
			);

			const vision = await FilesetResolver.forVisionTasks(
				"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
			);

			const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath:
						"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
					delegate: "GPU",
				},
				outputFaceBlendshapes: true,
				outputFacialTransformationMatrixes: true,
				runningMode: "VIDEO",
				numFaces: 1,
			});

			faceLandmarkerRef.current = faceLandmarker;
			console.log("MediaPipe Face Landmarker 初期化完了");
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			console.error("Face Landmarker初期化エラー:", error);
			throw error;
		}
	};

	// 笑顔判定：口角の位置から計算
	const calculateSmile = (
		landmarks: { x: number; y: number; z: number }[],
	): { isSmiling: boolean; intensity: number } => {
		// 口角のランドマークインデックス
		const LEFT_MOUTH_CORNER = 61; // 左口角
		const RIGHT_MOUTH_CORNER = 291; // 右口角
		const UPPER_LIP_CENTER = 13; // 上唇中央
		const LOWER_LIP_CENTER = 14; // 下唇中央

		const leftCorner = landmarks[LEFT_MOUTH_CORNER];
		const rightCorner = landmarks[RIGHT_MOUTH_CORNER];
		const upperLip = landmarks[UPPER_LIP_CENTER];
		const lowerLip = landmarks[LOWER_LIP_CENTER];

		// 口の中心のY座標
		const mouthCenterY = (upperLip.y + lowerLip.y) / 2;

		// 口角が口の中心より上にあれば笑顔
		const leftLift = mouthCenterY - leftCorner.y;
		const rightLift = mouthCenterY - rightCorner.y;

		// 笑顔の強さ（0-1）
		const intensity = Math.max(0, Math.min(1, (leftLift + rightLift) * 10));

		// 笑顔判定（閾値: 0.3以上）
		const isSmiling = intensity > 0.3;

		return { isSmiling, intensity };
	};

	// 視線判定：顔の向きとターゲット位置から計算
	const calculateGaze = (
		landmarks: { x: number; y: number; z: number }[],
	): { isLookingAtTarget: boolean; gazeScore: number } => {
		// 顔の主要ランドマーク
		const NOSE_TIP = 1;
		const LEFT_EYE = 33;
		const RIGHT_EYE = 263;

		const noseTip = landmarks[NOSE_TIP];
		const leftEye = landmarks[LEFT_EYE];
		const rightEye = landmarks[RIGHT_EYE];

		// 目の中心
		const eyeCenterX = (leftEye.x + rightEye.x) / 2;
		const eyeCenterY = (leftEye.y + rightEye.y) / 2;

		// ターゲット（アバター）の位置
		const target = gazeTargetRef.current;

		// 顔の向きを計算（鼻と目の中心の相対位置から）
		const faceDirectionX = noseTip.x - eyeCenterX;
		const faceDirectionY = noseTip.y - eyeCenterY;

		// ターゲットへの方向を計算
		// カメラ座標系: 左が0、右が1なので、左を見るためには顔を右に向ける必要がある
		const targetDirectionX = eyeCenterX - target.x;
		const targetDirectionY = target.y - eyeCenterY;

		// 顔の向きとターゲット方向の一致度
		const horizontalMatch = 1 - Math.abs(faceDirectionX - targetDirectionX) * 3;
		const verticalMatch = 1 - Math.abs(faceDirectionY - targetDirectionY) * 4;

		// 視線スコア（0-1、1がターゲットを見ている）
		const gazeScore = Math.max(0, Math.min(1, (horizontalMatch + verticalMatch) / 2));

		// ターゲットを見ている判定（閾値: 0.6以上）
		const isLookingAtTarget = gazeScore > 0.6;

		return { isLookingAtTarget, gazeScore };
	};

	// フレームごとの分析処理
	const analyzeFrame = async (timestamp: number) => {
		if (
			!faceLandmarkerRef.current ||
			!videoElementRef.current ||
			!isAnalyzing
		) {
			return;
		}

		try {
			const video = videoElementRef.current;

			// ビデオが準備できているか確認
			if (video.readyState < 2) {
				animationFrameRef.current = requestAnimationFrame(analyzeFrame);
				return;
			}

			// Face Landmarkerで顔のランドマークを検出
			const result: FaceLandmarkerResult =
				faceLandmarkerRef.current.detectForVideo(video, timestamp);

			if (result.faceLandmarks && result.faceLandmarks.length > 0) {
				const landmarks = result.faceLandmarks[0];

				// 笑顔分析
				const smileData = calculateSmile(landmarks);

				// 視線分析
				const gazeData = calculateGaze(landmarks);

				// 口角の位置
				const leftCorner = landmarks[61];
				const rightCorner = landmarks[291];

				// メトリクスを更新
				setMetrics({
					isSmiling: smileData.isSmiling,
					smileIntensity: smileData.intensity,
					isLookingAtTarget: gazeData.isLookingAtTarget,
					gazeScore: gazeData.gazeScore,
					mouthCornerLeft: leftCorner.y,
					mouthCornerRight: rightCorner.y,
				});
			} else {
				// 顔が検出されない場合はデフォルト値
				setMetrics(DEFAULT_METRICS);
			}
		} catch (err) {
			console.error("フレーム分析エラー:", err);
		}

		// 次のフレームを処理
		animationFrameRef.current = requestAnimationFrame(analyzeFrame);
	};

	// ターゲット位置の設定
	const setGazeTarget = (target: GazeTarget) => {
		gazeTargetRef.current = target;
		console.log("視線ターゲット更新:", target);
	};

	// 分析開始
	const startAnalysis = async (videoElement: HTMLVideoElement, gazeTarget?: GazeTarget) => {
		try {
			setError(null);
			videoElementRef.current = videoElement;

			// ターゲット位置が指定されている場合は更新
			if (gazeTarget) {
				gazeTargetRef.current = gazeTarget;
			}

			// Face Landmarkerが初期化されていない場合は初期化
			if (!faceLandmarkerRef.current) {
				await initializeFaceLandmarker();
			}

			setIsAnalyzing(true);

			// 分析ループ開始
			animationFrameRef.current = requestAnimationFrame(analyzeFrame);

			console.log("表情分析開始（ターゲット位置:", gazeTargetRef.current, "）");
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			setIsAnalyzing(false);
			console.error("分析開始エラー:", error);
		}
	};

	// 分析停止
	const stopAnalysis = () => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}

		setIsAnalyzing(false);
		setMetrics(null);
		videoElementRef.current = null;

		console.log("表情分析停止");
	};

	// クリーンアップ
	useEffect(() => {
		return () => {
			stopAnalysis();
			if (faceLandmarkerRef.current) {
				faceLandmarkerRef.current.close();
				faceLandmarkerRef.current = null;
			}
		};
	}, []);

	return {
		metrics,
		isAnalyzing,
		error,
		startAnalysis,
		stopAnalysis,
		setGazeTarget,
	};
}
