"use client";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function AvatarCanvas() {
	return (
		<div style={{ width: "100%", height: "70vh" }}>
			<Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
				<ambientLight intensity={0.6} />
				<directionalLight position={[3, 5, 2]} intensity={1} />
				<mesh>
					<boxGeometry args={[1, 1, 1]} />
					<meshStandardMaterial color="orange" />
				</mesh>
				<OrbitControls />
			</Canvas>
		</div>
	);
}
