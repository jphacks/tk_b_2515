'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';

interface AvatarCanvasProps {
  children?: React.ReactNode;
}

export default function AvatarCanvas({ children }: AvatarCanvasProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [0, 1.4, 1.5],
          fov: 30,
          near: 0.1,
          far: 20,
        }}
        gl={{ alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 1, 1]} intensity={0.8} />
        <directionalLight position={[-1, 0.5, -1]} intensity={0.3} />

        <Suspense fallback={null}>
          {children}
        </Suspense>

        {/* Camera controls for development */}
        <OrbitControls
          target={[0, 1.2, 0]}
          enablePan={false}
          enableZoom={true}
          minDistance={0.5}
          maxDistance={3}
        />
      </Canvas>
    </div>
  );
}
