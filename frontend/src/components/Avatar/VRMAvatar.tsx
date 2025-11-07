"use client";

import type { VRMAnimation } from "@pixiv/three-vrm-animation";
import {
	createVRMAnimationClip,
	VRMAnimationLoaderPlugin,
} from "@pixiv/three-vrm-animation";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
// import { Loader } from "lucide-react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useVRM } from "@/hooks/useVRM";

type VRMUserData = {
	vrmAnimation?: unknown;
	vrmAnimations?: unknown[];
	VRMAnimation?: unknown;
	VRMA?: unknown;
};

const isVRMAnimation = (value: unknown): value is VRMAnimation =>
	typeof value === "object" &&
	value !== null &&
	"duration" in value &&
	"humanoidTracks" in value;

const extractVRMAnimation = (userData: VRMUserData): VRMAnimation | null => {
	const vrmaCandidate =
		userData.vrmAnimation ||
		(Array.isArray(userData.vrmAnimations)
			? userData.vrmAnimations[0]
			: null) ||
		userData.VRMAnimation ||
		userData.VRMA ||
		null;

	return isVRMAnimation(vrmaCandidate) ? vrmaCandidate : null;
};

type GestureType = "idle" | "thinking" | "talking" | "explaining" | "nodding";

interface VRMAvatarProps {
	modelUrl: string;
	lipSyncValue?: number; // 0.0 to 1.0
	emotion?: "neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful"; // 感情
	gesture?: GestureType; // ジェスチャー
}

export default function VRMAvatar({
	modelUrl,
	lipSyncValue = 0,
	emotion = "neutral",
	gesture = "idle",
}: VRMAvatarProps) {
	const { vrm, loading, error } = useVRM(modelUrl);
	const groupRef = useRef<THREE.Group>(null);
	const blinkTimerRef = useRef(0);
	const [isBlinking, setIsBlinking] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const gestureTimeRef = useRef(0);
	const initialBonesRef = useRef<Map<string, THREE.Euler>>(new Map());
	const baseScaleRef = useRef(1); // 基本スケールを保存
	const mixerRef = useRef<THREE.AnimationMixer | null>(null);
	const currentActionRef = useRef<THREE.AnimationAction | null>(null);
	const clipCacheRef = useRef<Map<string, THREE.AnimationClip>>(new Map());
	const lastPlayedUrlRef = useRef<string | null>(null);
	const lastEmotionRef = useRef<
		"neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful"
	>("neutral");
	// 直近の切替時刻と保留中の切替タイマー（短時間での連続切替によるガクつきを防止）
	const lastSwitchTimeRef = useRef<number>(0);
	const switchTimeoutRef = useRef<number | null>(null);
	const latestDesiredKeyRef = useRef<string>(`${emotion}|${gesture}`);

	const gestureToVrmaPath = useMemo<Record<GestureType, string>>(
		() => ({
			idle: "/animations/idle.vrma",
			thinking: "/animations/thinking.vrma",
			talking: "/animations/talking.vrma",
			explaining: "/animations/explaining.vrma",
			nodding: "/animations/nodding.vrma",
		}),
		[],
	);

	// VRMA を読み込んで AnimationClip を生成（キャッシュ付き）
	const loadVrmaClip = useCallback(
		async (url: string): Promise<THREE.AnimationClip | null> => {
			if (!vrm) return null;
			const cached = clipCacheRef.current.get(url);
			if (cached) return cached;

			return new Promise((resolve) => {
				const loader = new GLTFLoader();
				loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
				loader.load(
					url,
					(gltf) => {
						try {
							const userData: VRMUserData = (gltf.userData ??
								{}) as VRMUserData;
							const vrma = extractVRMAnimation(userData);

							if (!vrma) {
								console.warn(
									"VRMAnimation not found in gltf.userData for",
									url,
								);
								resolve(null);
								return;
							}

							const clip = createVRMAnimationClip(vrma, vrm);
							if (clip) {
								clipCacheRef.current.set(url, clip);
							}
							resolve(clip ?? null);
						} catch (e) {
							console.warn("Failed to create VRMAnimationClip for", url, e);
							resolve(null);
						}
					},
					undefined,
					(err) => {
						console.warn("Failed to load VRMA:", url, err);
						resolve(null);
					},
				);
			});
		},
		[vrm],
	);

	// 指定クリップをクロスフェードで再生
	const playClip = useCallback(
		(
			clip: THREE.AnimationClip,
			{ fadeSec = 0.3 }: { fadeSec?: number } = {},
		) => {
			if (!mixerRef.current) return;
			const mixer = mixerRef.current;
			const nextAction = mixer.clipAction(clip);

			const prev = currentActionRef.current;
			if (prev && prev !== nextAction) {
				// 新しいクリップに切り替え（ここでのみ reset/設定）
				nextAction.reset();
				nextAction.enabled = true;
				nextAction.clampWhenFinished = false;
				nextAction.setLoop(THREE.LoopRepeat, Infinity);
				prev.crossFadeTo(nextAction, fadeSec, false);
				nextAction.play();
				currentActionRef.current = nextAction;
			} else if (!prev) {
				// はじめての再生
				nextAction.reset();
				nextAction.enabled = true;
				nextAction.clampWhenFinished = false;
				nextAction.setLoop(THREE.LoopRepeat, Infinity);
				nextAction.play();
				currentActionRef.current = nextAction;
			} else {
				// prev === nextAction の場合は何もしない（リセットによるガクつき防止）
			}
		},
		[],
	);

	// 最新の希望状態キーを追従
	useEffect(() => {
		latestDesiredKeyRef.current = `${emotion}|${gesture}`;
	}, [emotion, gesture]);

	// Update VRM every frame
	useFrame((_state, delta) => {
		if (vrm) {
			vrm.update(delta);
			if (mixerRef.current) {
				mixerRef.current.update(delta);
			}

			// 微妙な呼吸のような動き（基本スケールに対して）
			gestureTimeRef.current += delta;
			const breathingScale =
				baseScaleRef.current *
				(1 + Math.sin(gestureTimeRef.current * 1.5) * 0.01);
			vrm.scene.scale.setScalar(breathingScale);
		}

		// まばたきアニメーション
		blinkTimerRef.current += delta;
		// 3〜5秒ごとにまばたき
		if (blinkTimerRef.current > 3 + Math.random() * 2) {
			setIsBlinking(true);
			setTimeout(() => setIsBlinking(false), 150);
			blinkTimerRef.current = 0;
		}
	});

	// まばたき（デフォルトで目を開ける）
	useEffect(() => {
		if (!vrm || !vrm.expressionManager) return;
		// isBlinkingがtrueの時だけまばたき、falseの時は目を完全に開ける
		vrm.expressionManager.setValue("blink", isBlinking ? 1.0 : 0.0);
		vrm.expressionManager.setValue("blinkLeft", isBlinking ? 1.0 : 0.0);
		vrm.expressionManager.setValue("blinkRight", isBlinking ? 1.0 : 0.0);
	}, [vrm, isBlinking]);

	// Apply lip sync
	useEffect(() => {
		if (!vrm || !vrm.expressionManager) return;

		// Set mouth opening based on lipSyncValue
		// VRM uses 'aa' (mouth open) expression for basic lip sync
		vrm.expressionManager.setValue("aa", lipSyncValue);
	}, [vrm, lipSyncValue]);

	// Apply emotion expressions
	useEffect(() => {
		if (!vrm || !vrm.expressionManager) return;

		// リセット
		vrm.expressionManager.setValue("happy", 0);
		vrm.expressionManager.setValue("sad", 0);
		vrm.expressionManager.setValue("angry", 0);
		vrm.expressionManager.setValue("relaxed", 0);

		// 感情に応じた表情を設定
		switch (emotion) {
			case "happy":
				vrm.expressionManager.setValue("happy", 1.0);
				break;
			case "sad":
				vrm.expressionManager.setValue("sad", 0.8);
				break;
			case "surprised":
				vrm.expressionManager.setValue("surprised", 1.0);
				break;
			case "angry":
				vrm.expressionManager.setValue("angry", 0.7);
				break;
			case "bashful":
				// 恥ずかしがりのときは控えめな笑顔に
				vrm.expressionManager.setValue("happy", 0.6);
				break;
			default:
				vrm.expressionManager.setValue("relaxed", 0.3);
		}
	}, [vrm, emotion]);

	// Center and scale avatar once読み込み完了
	useEffect(() => {
		if (!vrm) {
			setIsReady(false);
			return;
		}

		// AnimationMixer を初期化
		mixerRef.current = new THREE.AnimationMixer(vrm.scene);
		currentActionRef.current = null;

		setIsReady(false);
		initialBonesRef.current = new Map();

		const scene = vrm.scene;
		const box = new THREE.Box3().setFromObject(scene);
		const size = new THREE.Vector3();
		const center = new THREE.Vector3();

		box.getSize(size);
		box.getCenter(center);

		// センターを原点に合わせる
		scene.position.sub(center);

		// 顔が大きく見えるようにスケール調整（4倍に拡大）
		const targetHeight = 1.6;
		if (size.y > 0) {
			const scale = (targetHeight / size.y) * 4; // 4倍に拡大
			baseScaleRef.current = scale; // 基本スケールを保存
			scene.scale.setScalar(scale);
		}

		// 顔を中心に表示するようにオフセット（スケール後に調整）
		// モデルの頭の位置を計算して、顔が見えるように配置
		const headOffset = size.y * 0.85; // モデルの高さの85%の位置（顔の位置）
		scene.position.y = -headOffset * (targetHeight / size.y) * 4 + 1.5; // 顔を画面中央に

		// 初期状態で目を開ける
		if (vrm.expressionManager) {
			vrm.expressionManager.setValue("blink", 0.0);
			vrm.expressionManager.setValue("blinkLeft", 0.0);
			vrm.expressionManager.setValue("blinkRight", 0.0);
		}

		// VRMの初期ボーン回転を保存し、腕を30度下げる
		const humanoid = vrm.humanoid;
		if (humanoid) {
			const boneNames: Array<
				| "leftUpperArm"
				| "rightUpperArm"
				| "leftLowerArm"
				| "rightLowerArm"
				| "leftHand"
				| "rightHand"
				| "neck"
				| "spine"
			> = [
				"leftUpperArm",
				"rightUpperArm",
				"leftLowerArm",
				"rightLowerArm",
				"leftHand",
				"rightHand",
				"neck",
				"spine",
			];

			boneNames.forEach((boneName) => {
				const bone = humanoid.getNormalizedBoneNode(boneName);
				if (bone) {
					// 腕を60度（約1.047ラジアン）下げる
					if (boneName === "leftUpperArm" || boneName === "rightUpperArm") {
						const adjustedRotation = bone.rotation.clone();
						// 左腕: プラス方向で下に、右腕: マイナス方向で下に
						adjustedRotation.z += boneName === "leftUpperArm" ? 1.047 : -1.047; // 60度 = 1.047ラジアン
						initialBonesRef.current.set(boneName, adjustedRotation);
						bone.rotation.copy(adjustedRotation);
					} else {
						initialBonesRef.current.set(boneName, bone.rotation.clone());
					}
				}
			});
		}

		setIsReady(true);
	}, [vrm]);


	// アニメーション切替ロジック（短時間の連続切替をスロットル）
	useEffect(() => {
		if (!vrm || !isReady) return;

		// 実際の切替処理
		const performSwitch = async (
			emo: typeof emotion,
			ges: typeof gesture,
		) => {
			// 最新の希望状態とズレていたら破棄（古い予約実行の回避）
			if (latestDesiredKeyRef.current !== `${emo}|${ges}`) return;

			// 感情優先のURL候補を作る
			const preferredUrls: string[] = (() => {
				if (emo === "bashful") {
					return ["/animations/bashful.vrma", gestureToVrmaPath.idle];
				}
				if (emo === "angry") {
					return [
						"/animations/angry.vrma",
						"/animations/explaining.vrma",
						gestureToVrmaPath.idle,
					];
				}
				if (emo === "sad") {
					return [
						"/animations/sad.vrma",
						gestureToVrmaPath.thinking,
						gestureToVrmaPath.idle,
					];
				}
				// 通常はジェスチャーに従う
				return [
					gestureToVrmaPath[ges] ?? gestureToVrmaPath.idle,
					gestureToVrmaPath.idle,
				];
			})();

			// 候補を順番に試す
			let chosenUrl: string | null = null;
			let finalClip: THREE.AnimationClip | null = null;
			for (const u of preferredUrls) {
				// 同じURL・同じ感情なら更新不要
				if (lastPlayedUrlRef.current === u && lastEmotionRef.current === emo) {
					return;
				}
				// eslint-disable-next-line no-await-in-loop
				const clip = await loadVrmaClip(u);
				if (clip) {
					chosenUrl = u;
					finalClip = clip;
					break;
				}
			}

			if (!finalClip || !chosenUrl) return;

			const fadeSec = (() => {
				switch (emo) {
					case "bashful":
						return 0.4;
					case "sad":
						return 0.35;
					case "happy":
						return 0.3;
					case "angry":
						return 0.2;
					case "surprised":
						return 0.15;
					default:
						return 0.25;
				}
			})();

			playClip(finalClip, { fadeSec });
			lastPlayedUrlRef.current = chosenUrl;
			lastEmotionRef.current = emo;
			lastSwitchTimeRef.current = performance.now();
		};

		const SWITCH_MIN_INTERVAL_MS = 800; // 最低インターバル（ms）
		const now = performance.now();
		const elapsed = now - lastSwitchTimeRef.current;

		// スロットル: 前回から短すぎる場合は予約して遅延実行
		if (elapsed < SWITCH_MIN_INTERVAL_MS) {
			if (switchTimeoutRef.current) {
				window.clearTimeout(switchTimeoutRef.current);
			}
			switchTimeoutRef.current = window.setTimeout(() => {
				performSwitch(emotion, gesture);
			}, SWITCH_MIN_INTERVAL_MS - elapsed);
			return;
		}

		// すぐに切替実行
		performSwitch(emotion, gesture);
	}, [emotion, gesture, gestureToVrmaPath, isReady, loadVrmaClip, playClip, vrm]);

	if (error) {
		console.error("VRM load error:", error);
		// エラーメッセージを表示
		return (
			<mesh>
				<boxGeometry args={[1, 2, 1]} />
				<meshStandardMaterial color="red" />
			</mesh>
		);
	}

	if (loading || !vrm || !isReady) {
		// VRMの初期配置が完了するまでは描画しない
		return null;
	}

	return (
		<group ref={groupRef} position={[0, 1.15, 0]} scale={0.3}>
			<primitive object={vrm.scene} />
		</group>
	);
}
