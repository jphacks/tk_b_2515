"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useVRM } from "@/hooks/useVRM";

type GestureType =
  | "idle"
  | "thinking"
  | "talking"
  | "armsCrossed"
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
  const gestureTimeRef = useRef(0);
  const initialBonesRef = useRef<Map<string, THREE.Euler>>(new Map());
  const baseScaleRef = useRef(1); // 基本スケールを保存

  // Update VRM every frame
  useFrame((_state, delta) => {
    if (vrm) {
      vrm.update(delta);

      // 微妙な呼吸のような動き（基本スケールに対して）
      gestureTimeRef.current += delta;
      const breathingScale =
        baseScaleRef.current *
        (1 + Math.sin(gestureTimeRef.current * 1.5) * 0.01);
      vrm.scene.scale.setScalar(breathingScale);

      const humanoid = vrm.humanoid;
      if (humanoid && initialBonesRef.current.size > 0) {
        // ボーンとベース回転を取得
        const leftUpperArm = humanoid.getNormalizedBoneNode("leftUpperArm");
        const rightUpperArm = humanoid.getNormalizedBoneNode("rightUpperArm");
        const leftLowerArm = humanoid.getNormalizedBoneNode("leftLowerArm");
        const rightLowerArm = humanoid.getNormalizedBoneNode("rightLowerArm");
        const neck = humanoid.getNormalizedBoneNode("neck");
        const spine = humanoid.getNormalizedBoneNode("spine");

        const leftUpperArmBase = initialBonesRef.current.get("leftUpperArm");
        const rightUpperArmBase = initialBonesRef.current.get("rightUpperArm");
        const leftLowerArmBase = initialBonesRef.current.get("leftLowerArm");
        const rightLowerArmBase = initialBonesRef.current.get("rightLowerArm");
        const neckBase = initialBonesRef.current.get("neck");
        const spineBase = initialBonesRef.current.get("spine");

        // ジェスチャーに応じた動き
        switch (gesture) {
          case "armsCrossed": // 腕組み
            if (leftUpperArm && leftUpperArmBase) {
              leftUpperArm.rotation.x = leftUpperArmBase.x + 0.8;
              leftUpperArm.rotation.y = leftUpperArmBase.y + 0.3;
              leftUpperArm.rotation.z = leftUpperArmBase.z - 0.5;
            }
            if (rightUpperArm && rightUpperArmBase) {
              rightUpperArm.rotation.x = rightUpperArmBase.x + 0.8;
              rightUpperArm.rotation.y = rightUpperArmBase.y - 0.3;
              rightUpperArm.rotation.z = rightUpperArmBase.z + 0.5;
            }
            if (leftLowerArm && leftLowerArmBase) {
              leftLowerArm.rotation.y = leftLowerArmBase.y - 1.2;
            }
            if (rightLowerArm && rightLowerArmBase) {
              rightLowerArm.rotation.y = rightLowerArmBase.y + 1.2;
            }
            break;

          case "thinking": // 考え中（片手を顎に）
            if (rightUpperArm && rightUpperArmBase) {
              rightUpperArm.rotation.x = rightUpperArmBase.x + 1.2;
              rightUpperArm.rotation.z = rightUpperArmBase.z + 0.3;
            }
            if (rightLowerArm && rightLowerArmBase) {
              rightLowerArm.rotation.y = rightLowerArmBase.y + 1.5;
            }
            if (leftUpperArm && leftUpperArmBase) {
              leftUpperArm.rotation.x =
                leftUpperArmBase.x +
                Math.sin(gestureTimeRef.current * 0.3) * 0.02;
              leftUpperArm.rotation.z =
                leftUpperArmBase.z +
                Math.sin(gestureTimeRef.current * 0.4) * 0.015;
            }
            break;

          case "talking": // 話している（手を動かす）
            if (leftUpperArm && leftUpperArmBase) {
              leftUpperArm.rotation.x =
                leftUpperArmBase.x +
                Math.sin(gestureTimeRef.current * 2) * 0.15;
              leftUpperArm.rotation.z =
                leftUpperArmBase.z +
                Math.sin(gestureTimeRef.current * 1.5) * 0.1;
            }
            if (rightUpperArm && rightUpperArmBase) {
              rightUpperArm.rotation.x =
                rightUpperArmBase.x +
                0.4 +
                Math.sin(gestureTimeRef.current * 2.2 + 0.5) * 0.12;
              rightUpperArm.rotation.z =
                rightUpperArmBase.z +
                Math.sin(gestureTimeRef.current * 1.8) * 0.08;
            }
            if (leftLowerArm && leftLowerArmBase) {
              leftLowerArm.rotation.y =
                leftLowerArmBase.y +
                Math.sin(gestureTimeRef.current * 2.5) * 0.2;
            }
            if (rightLowerArm && rightLowerArmBase) {
              rightLowerArm.rotation.y =
                rightLowerArmBase.y +
                Math.sin(gestureTimeRef.current * 2.3) * 0.15;
            }
            break;

          case "explaining": // 説明している（両手を広げる）
            if (leftUpperArm && leftUpperArmBase) {
              leftUpperArm.rotation.x = leftUpperArmBase.x + 0.5;
              leftUpperArm.rotation.z =
                leftUpperArmBase.z -
                0.3 +
                Math.sin(gestureTimeRef.current * 1.5) * 0.1;
            }
            if (rightUpperArm && rightUpperArmBase) {
              rightUpperArm.rotation.x = rightUpperArmBase.x + 0.5;
              rightUpperArm.rotation.z =
                rightUpperArmBase.z +
                0.3 +
                Math.sin(gestureTimeRef.current * 1.5 + Math.PI) * 0.1;
            }
            if (leftLowerArm && leftLowerArmBase) {
              leftLowerArm.rotation.y = leftLowerArmBase.y - 0.5;
            }
            if (rightLowerArm && rightLowerArmBase) {
              rightLowerArm.rotation.y = rightLowerArmBase.y + 0.5;
            }
            break;

          case "idle": // アイドル（微妙な動きのみ）
          default:
            if (leftUpperArm && leftUpperArmBase) {
              leftUpperArm.rotation.x =
                leftUpperArmBase.x +
                Math.sin(gestureTimeRef.current * 0.3) * 0.02;
              leftUpperArm.rotation.y = leftUpperArmBase.y;
              leftUpperArm.rotation.z =
                leftUpperArmBase.z +
                Math.sin(gestureTimeRef.current * 0.4) * 0.015;
            }
            if (rightUpperArm && rightUpperArmBase) {
              rightUpperArm.rotation.x =
                rightUpperArmBase.x +
                Math.sin(gestureTimeRef.current * 0.3 + Math.PI) * 0.02;
              rightUpperArm.rotation.y = rightUpperArmBase.y;
              rightUpperArm.rotation.z =
                rightUpperArmBase.z +
                Math.sin(gestureTimeRef.current * 0.4 + Math.PI) * 0.015;
            }
            break;
        }

        // 首の動き
        if (neck && neckBase) {
          if (gesture === "nodding") {
            // うなずく動き
            neck.rotation.x =
              neckBase.x + Math.sin(gestureTimeRef.current * 3) * 0.15;
            neck.rotation.y = neckBase.y;
          } else {
            // 通常の微妙な動き
            neck.rotation.x =
              neckBase.x + Math.sin(gestureTimeRef.current * 0.8) * 0.05;
            neck.rotation.y =
              neckBase.y + Math.sin(gestureTimeRef.current * 0.5) * 0.03;
          }
          neck.rotation.z = neckBase.z;
        }

        // 上半身の微妙な傾き
        if (spine && spineBase) {
          spine.rotation.x = spineBase.x;
          spine.rotation.y =
            spineBase.y + Math.sin(gestureTimeRef.current * 0.4) * 0.02;
          spine.rotation.z =
            spineBase.z + Math.sin(gestureTimeRef.current * 0.35) * 0.015;
        }
      }
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
    if (!vrm) return;

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
  }, [vrm]);

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

  if (loading || !vrm) {
    // ローディング中は簡単な形状を表示
    return (
      <mesh>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={[0, 1.15, 0]} scale={0.3}>
      <primitive object={vrm.scene} />
    </group>
  );
}
