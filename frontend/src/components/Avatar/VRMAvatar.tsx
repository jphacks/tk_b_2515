"use client";

import type { VRMAnimation } from "@pixiv/three-vrm-animation";
import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
} from "@pixiv/three-vrm-animation";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
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

type GestureType = "idle" | "thinking" | "talking" | "peace" | "nodding";

interface VRMAvatarProps {
  modelUrl: string;
  lipSyncValue?: number; // 0.0 to 1.0
  emotion?: "neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful"; // 感情
  gesture?: GestureType; // ジェスチャー
  disableGreeting?: boolean; // 入学式などで挨拶アニメを再生しない
}

export default function VRMAvatar({
  modelUrl,
  lipSyncValue = 0,
  emotion = "neutral",
  gesture = "idle",
  disableGreeting = false,
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
      peace: "/animations/peace.vrma",
      nodding: "/animations/nodding.vrma",
    }),
    []
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
                  url
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
          }
        );
      });
    },
    [vrm]
  );

  // happy 時一度だけ peace を再生するフラグ
  const peacePlayedThisHappyRef = useRef(false);
  // 会話開始（このコンポーネントの初期表示）時に greet を一度だけ再生するフラグ（入学式以外）
  const greetPlayedRef = useRef(false);
  // 入学式（library）では挨拶アニメを再生しないため背景キーを受け取れるようにする

  // 指定クリップをクロスフェードで再生
  const playClip = useCallback(
    (
      clip: THREE.AnimationClip,
      { fadeSec = 0.3 }: { fadeSec?: number } = {}
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
    []
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
    // わずかに開眼を保つため blink を低めに設定（薄目防止）
    const blinkValue = isBlinking ? 1.0 : 0.0;
    vrm.expressionManager.setValue("blink", blinkValue);
    vrm.expressionManager.setValue("blinkLeft", blinkValue);
    vrm.expressionManager.setValue("blinkRight", blinkValue);
    // 目が細くなる表情が初期状態で残りにくいよう補助的に eyeClosed 系があれば 0 に（存在しないモデルもある）
    try {
      vrm.expressionManager.setValue("eyeClosed", 0);
      vrm.expressionManager.setValue("eyeSquint", 0);
    } catch {
      // オプショナル
    }
  }, [vrm, isBlinking]);

  // Apply lip sync（ベース開きを抑え、リップシンク値のみ反映）
  useEffect(() => {
    if (!vrm || !vrm.expressionManager) return;

    // 一旦クリア
    vrm.expressionManager.setValue("aa", 0);
    vrm.expressionManager.setValue("ee", 0);
    vrm.expressionManager.setValue("ih", 0);
    vrm.expressionManager.setValue("ou", 0);
    vrm.expressionManager.setValue("oh", 0);

    // VRM uses 'aa' for basic mouth open
    if (lipSyncValue > 0.01) {
      vrm.expressionManager.setValue("aa", lipSyncValue);
    }
  }, [vrm, lipSyncValue]);

  // Apply emotion expressions（neutral では relaxed を使わず目を細くしない）
  useEffect(() => {
    if (!vrm || !vrm.expressionManager) return;

    // リセット
    vrm.expressionManager.setValue("happy", 0);
    vrm.expressionManager.setValue("sad", 0);
    vrm.expressionManager.setValue("angry", 0);
    vrm.expressionManager.setValue("relaxed", 0);
    vrm.expressionManager.setValue("surprised", 0);

    // 感情に応じた表情を設定（強度微調整）
    switch (emotion) {
      case "happy":
        vrm.expressionManager.setValue("happy", 0.7);
        break;
      case "sad":
        vrm.expressionManager.setValue("sad", 0.8);
        break;
      case "surprised":
        vrm.expressionManager.setValue("surprised", 0.9);
        break;
      case "angry":
        vrm.expressionManager.setValue("angry", 0.7);
        break;
      case "bashful":
        // 恥ずかしがりのときは控えめな笑顔に（目が細くなりすぎない程度）
        vrm.expressionManager.setValue("happy", 0.4);
        break;
      default:
        // neutral: relaxed を入れない
        break;
    }
  }, [vrm, emotion]);

  // happy 以外に変わったらフラグをリセット（次に happy に戻った時に peace を再生できるように）
  useEffect(() => {
    if (emotion !== "happy") {
      peacePlayedThisHappyRef.current = false;
    }
  }, [emotion]);

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

    // 膝まで映るように上半身を中心に表示するようにオフセット（スケール後に調整）
    // モデルの膝の位置を計算して、膝から上が見えるように配置
    const kneeOffset = size.y * 0.5; // モデルの高さの30%の位置（膝の位置）
    scene.position.y = -kneeOffset * (targetHeight / size.y) * 4 + 0.4; // 膝から上を画面に収める

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

    const performSwitch = async (emo: typeof emotion, ges: typeof gesture) => {
      if (latestDesiredKeyRef.current !== `${emo}|${ges}`) return;

      // greet（挨拶）: 入学式以外で最初の一度だけ
      if (!disableGreeting && !greetPlayedRef.current) {
        const greetUrl = "/animations/greet.vrma";
        const greetClip = await loadVrmaClip(greetUrl);
        if (greetClip && mixerRef.current) {
          const mixer = mixerRef.current;
          if (currentActionRef.current) currentActionRef.current.stop();
          const action = mixer.clipAction(greetClip);
          action.reset();
          action.enabled = true;
          action.clampWhenFinished = true;
          action.setLoop(THREE.LoopOnce, 1);
          action.play();
          currentActionRef.current = action;
          lastPlayedUrlRef.current = greetUrl;
          lastEmotionRef.current = emo;
          lastSwitchTimeRef.current = performance.now();
          greetPlayedRef.current = true;
          const onFinished = () => {
            mixer.removeEventListener("finished", onFinished);
            void performSwitch(emo, ges);
          };
          mixer.addEventListener("finished", onFinished);
          return;
        }
      }

      // happy 直後の peace 一度再生
      if (emo === "happy" && !peacePlayedThisHappyRef.current) {
        const peaceClip = await loadVrmaClip(gestureToVrmaPath.peace);
        if (peaceClip && mixerRef.current) {
          const mixer = mixerRef.current;
          if (currentActionRef.current) currentActionRef.current.stop();
          const action = mixer.clipAction(peaceClip);
          action.reset();
          action.enabled = true;
          action.clampWhenFinished = true;
          action.setLoop(THREE.LoopOnce, 1);
          action.play();
          currentActionRef.current = action;
          lastPlayedUrlRef.current = gestureToVrmaPath.peace;
          lastEmotionRef.current = emo;
          lastSwitchTimeRef.current = performance.now();
          peacePlayedThisHappyRef.current = true;
          const onFinished = () => {
            mixer.removeEventListener("finished", onFinished);
            void performSwitch(emo, ges);
          };
          mixer.addEventListener("finished", onFinished);
          return;
        }
      }

      // URL候補
      const preferredUrls: string[] = (() => {
        if (emo === "bashful")
          return ["/animations/bashful.vrma", gestureToVrmaPath.idle];
        if (emo === "angry")
          return [
            "/animations/angry.vrma",
            gestureToVrmaPath.nodding,
            gestureToVrmaPath.idle,
          ];
        if (emo === "sad")
          return [
            "/animations/sad.vrma",
            gestureToVrmaPath.thinking,
            gestureToVrmaPath.idle,
          ];
        return [
          gestureToVrmaPath[ges] ?? gestureToVrmaPath.idle,
          gestureToVrmaPath.idle,
        ];
      })();

      let chosenUrl: string | null = null;
      let finalClip: THREE.AnimationClip | null = null;
      for (const u of preferredUrls) {
        if (lastPlayedUrlRef.current === u && lastEmotionRef.current === emo)
          return; // 変更不要
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
  }, [
    emotion,
    gesture,
    gestureToVrmaPath,
    isReady,
    loadVrmaClip,
    playClip,
    vrm,
    disableGreeting,
  ]);

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
