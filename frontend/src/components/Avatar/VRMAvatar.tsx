"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useVRM } from "@/hooks/useVRM";
// import { Loader } from "lucide-react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
	VRMAnimationLoaderPlugin,
	createVRMAnimationClip,
} from "@pixiv/three-vrm-animation";

type GestureType =
	| "idle"
	| "thinking"
	| "talking"
	| "explaining"
	| "nodding";

interface VRMAvatarProps {
	modelUrl: string;
	lipSyncValue?: number; // 0.0 to 1.0
	emotion?: "neutral" | "happy" | "sad" | "surprised" | "angry"; // 感情
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
		const loadVrmaClip = useCallback(async (
			url: string,
		): Promise<THREE.AnimationClip | null> => {
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
						const userData: any = gltf.userData ?? {};
						const vrma =
							userData.vrmAnimation ||
							(Array.isArray(userData.vrmAnimations)
								? userData.vrmAnimations[0]
								: null) ||
							userData.VRMAnimation ||
							userData.VRMA ||
							null;

						if (!vrma) {
							console.warn("VRMAnimation not found in gltf.userData for", url);
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
		}, [vrm]);

	// 指定クリップをクロスフェードで再生
			const playClip = useCallback((
				clip: THREE.AnimationClip,
				{ fadeSec = 0.3 }: { fadeSec?: number } = {},
			) => {
		if (!mixerRef.current) return;
		const mixer = mixerRef.current;
		const nextAction = mixer.clipAction(clip);
		nextAction.reset();
		nextAction.enabled = true;
				nextAction.clampWhenFinished = false;
				nextAction.setLoop(THREE.LoopRepeat, Infinity);

		const prev = currentActionRef.current;
		if (prev && prev !== nextAction) {
			prev.crossFadeTo(nextAction, fadeSec, false);
			nextAction.play();
			currentActionRef.current = nextAction;
		} else if (!prev) {
			nextAction.play();
			currentActionRef.current = nextAction;
			}
		}, []);

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

	// ジェスチャー変更時に対応する VRMA を再生
	useEffect(() => {
		if (!vrm || !isReady) return;

			const url = gestureToVrmaPath[gesture] ?? gestureToVrmaPath.idle;
		let cancelled = false;

			loadVrmaClip(url).then(async (clip) => {
				if (cancelled) return;

				let finalClip = clip;
				if (!finalClip && url !== gestureToVrmaPath.idle) {
					// フォールバック: idle を試す
					finalClip = await loadVrmaClip(gestureToVrmaPath.idle);
				}
				if (!finalClip) return;

				// すべてループ再生（継続的な動作のため）
				playClip(finalClip, { loopOnce: false, fadeSec: 0.25 });
			});

		return () => {
			cancelled = true;
		};
		}, [gesture, isReady, vrm, gestureToVrmaPath, loadVrmaClip, playClip]);

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
