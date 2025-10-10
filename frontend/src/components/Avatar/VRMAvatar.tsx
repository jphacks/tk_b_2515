'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useVRM } from '@/hooks/useVRM';
import * as THREE from 'three';

interface VRMAvatarProps {
  modelUrl: string;
  lipSyncValue?: number; // 0.0 to 1.0
}

export default function VRMAvatar({ modelUrl, lipSyncValue = 0 }: VRMAvatarProps) {
  const { vrm, loading, error } = useVRM(modelUrl);
  const groupRef = useRef<THREE.Group>(null);

  // Update VRM every frame
  useFrame((state, delta) => {
    if (vrm) {
      vrm.update(delta);
    }
  });

  // Apply lip sync
  useEffect(() => {
    if (!vrm || !vrm.expressionManager) return;

    // Set mouth opening based on lipSyncValue
    // VRM uses 'aa' (mouth open) expression for basic lip sync
    vrm.expressionManager.setValue('aa', lipSyncValue);
  }, [vrm, lipSyncValue]);

  if (error) {
    console.error('VRM load error:', error);
    return null;
  }

  if (loading || !vrm) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={vrm.scene} />
    </group>
  );
}
