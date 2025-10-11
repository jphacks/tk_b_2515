"use client";

import { useLipSync } from "@/hooks/useLipSync";
import VRMAvatar from "./VRMAvatar";

interface LipSyncProps {
	modelUrl: string;
	audioElement: HTMLAudioElement | null;
}

export default function LipSync({ modelUrl, audioElement }: LipSyncProps) {
	const lipSyncValue = useLipSync(audioElement, {
		smoothing: 0.7,
		threshold: 0.02,
	});

	return <VRMAvatar modelUrl={modelUrl} lipSyncValue={lipSyncValue} />;
}
