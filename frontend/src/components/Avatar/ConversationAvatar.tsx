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
		<div className={className}>
			<Canvas
				camera={{ position: [0, 1.5, 3], fov: 45 }}
				gl={{ alpha: true, antialias: true }}
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
					minPolarAngle={Math.PI / 3}
					maxPolarAngle={Math.PI / 2}
				/>
			</Canvas>
		</div>
	);
}
