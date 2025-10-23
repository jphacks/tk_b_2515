"use client";

import { OrbitControls, useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import VRMAvatar from "./VRMAvatar";

type GestureType =
	| "idle"
	| "thinking"
	| "talking"
	| "explaining"
	| "nodding";

interface ConversationAvatarProps {
	modelUrl: string;
	lipSyncValue?: number;
	emotion?: "neutral" | "happy" | "sad" | "surprised" | "angry";
	gesture?: GestureType;
	className?: string;
}

/**
 * 背景画像を表示するコンポーネント
 */
function BackgroundImage() {
	const texture = useTexture("/uec_library.jpg");

	return (
		<mesh position={[0, 1.65, -2]}>
			<planeGeometry args={[8, 4.5]} />
			<meshBasicMaterial map={texture} side={THREE.DoubleSide} />
		</mesh>
	);
}

/**
 * 会話用のVRMアバター表示コンポーネント
 */
export default function ConversationAvatar({
	modelUrl,
	lipSyncValue = 0,
	emotion = "neutral",
	gesture = "idle",
	className = "",
}: ConversationAvatarProps) {
	return (
		<div className={`relative ${className}`}>
			<Canvas
				camera={{ position: [0, 1.6, 1.82], fov: 30 }}	// z軸正の方向はアバターから離れる向き
				gl={{ alpha: true, antialias: true }}
				style={{ width: "100%", height: "100%" }}
			>
				<color attach="background" args={["#000000"]} />
				<ambientLight intensity={0.8} />
				<directionalLight position={[3, 5, 2]} intensity={1.2} />
				<directionalLight position={[-3, 3, -2]} intensity={0.6} />
				<Suspense fallback={null}>
					<BackgroundImage />
					<VRMAvatar
						modelUrl={modelUrl}
						lipSyncValue={lipSyncValue}
						emotion={emotion}
						gesture={gesture}
					/>
				</Suspense>
				<OrbitControls
					enableZoom={false}
					enablePan={false}
					enableRotate={false}
					target={[0, 1.65, 0]}
					minPolarAngle={Math.PI / 3}
					maxPolarAngle={Math.PI / 2}
					enableDamping
					dampingFactor={0.1}
				/>
			</Canvas>
		</div>
	);
}
