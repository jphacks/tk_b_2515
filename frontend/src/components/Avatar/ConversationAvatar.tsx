"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import VRMAvatar from "./VRMAvatar";

interface ConversationAvatarProps {
	modelUrl: string;
	lipSyncValue?: number;
	className?: string;
}

/**
 * 会話用のVRMアバター表示コンポーネント
 */
export default function ConversationAvatar({
	modelUrl,
	lipSyncValue = 0,
	className = "",
}: ConversationAvatarProps) {
	return (
		<div className={`relative ${className}`}>
			<Canvas
				camera={{ position: [0, 1.5, 1.6], fov: 30 }}
				gl={{ alpha: true, antialias: true }}
				style={{ width: "100%", height: "100%" }}
			>
				<color attach="background" args={["#1a1a2e"]} />
				<ambientLight intensity={0.8} />
				<directionalLight position={[3, 5, 2]} intensity={1.2} />
				<directionalLight position={[-3, 3, -2]} intensity={0.6} />
				<Suspense fallback={null}>
					<VRMAvatar modelUrl={modelUrl} lipSyncValue={lipSyncValue} />
				</Suspense>
				<OrbitControls
					enableZoom={false}
					enablePan={false}
					target={[0, 1.4, 0]}
					minPolarAngle={Math.PI / 3}
					maxPolarAngle={Math.PI / 2}
					enableDamping
					dampingFactor={0.1}
				/>
			</Canvas>
		</div>
	);
}
