"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useVRM } from "@/hooks/useVRM";

interface VRMAvatarProps {
  modelUrl: string;
  lipSyncValue?: number; // 0.0 to 1.0
}

export default function VRMAvatar({
 modelUrl,
  lipSyncValue = 0,
}: VRMAvatarProps) {
  const { vrm, loading, error } = useVRM(modelUrl);
  const groupRef = useRef<THREE.Group>(null);

  // Update VRM every frame
  useFrame((_state, delta) => {
    if (vrm) {
      vrm.update(delta);
    }
  });

  // Apply lip sync
  useEffect(() => {
    if (!vrm || !vrm.expressionManager) return;

    // Set mouth opening based on lipSyncValue
    // VRM uses 'aa' (mouth open) expression for basic lip sync
    vrm.expressionManager.setValue("aa", lipSyncValue);
  }, [vrm, lipSyncValue]);

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

    // 目視でバストアップを映すようにオフセット
    scene.position.y += 0.9;

    // 顔が大きく見えるようにスケール調整
    const targetHeight = 1.6;
    if (size.y > 0) {
      const scale = targetHeight / size.y;
      scene.scale.setScalar(scale);
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
    <group ref={groupRef}>
      <primitive object={vrm.scene} />
    </group>
  );
}
