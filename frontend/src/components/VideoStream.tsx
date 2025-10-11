"use client";

import { useEffect, useRef } from "react";

export interface VideoStreamProps {
	stream: MediaStream | null;
	className?: string;
	muted?: boolean;
	autoPlay?: boolean;
	playsInline?: boolean;
}

/**
 * Webカメラのストリームをvideo要素に表示するコンポーネント
 */
export function VideoStream({
	stream,
	className = "",
	muted = true,
	autoPlay = true,
	playsInline = true,
}: VideoStreamProps) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const videoElement = videoRef.current;
		if (!videoElement) return;

		if (stream) {
			// ストリームをvideo要素に設定
			videoElement.srcObject = stream;
		} else {
			// ストリームがnullの場合はクリア
			videoElement.srcObject = null;
		}

		// クリーンアップ
		return () => {
			if (videoElement.srcObject) {
				videoElement.srcObject = null;
			}
		};
	}, [stream]);

	return (
		<video
			ref={videoRef}
			className={className}
			muted={muted}
			autoPlay={autoPlay}
			playsInline={playsInline}
		/>
	);
}
