"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface VideoStreamProps {
	stream: MediaStream | null;
	className?: string;
	muted?: boolean;
	autoPlay?: boolean;
	playsInline?: boolean;
	onVideoReady?: (videoElement: HTMLVideoElement) => void;
}

export interface VideoStreamRef {
	getVideoElement: () => HTMLVideoElement | null;
}

/**
 * Webカメラのストリームをvideo要素に表示するコンポーネント
 */
export const VideoStream = forwardRef<VideoStreamRef, VideoStreamProps>(
	(
		{
			stream,
			className = "",
			muted = true,
			autoPlay = true,
			playsInline = true,
			onVideoReady,
		},
		ref,
	) => {
		const videoRef = useRef<HTMLVideoElement>(null);

		// 外部からvideo要素にアクセスできるようにする
		useImperativeHandle(ref, () => ({
			getVideoElement: () => videoRef.current,
		}));

		useEffect(() => {
			const videoElement = videoRef.current;
			if (!videoElement) return;

			if (stream) {
				// ストリームをvideo要素に設定
				videoElement.srcObject = stream;

				// ビデオが準備できたらコールバックを呼ぶ
				if (onVideoReady) {
					const handleLoadedMetadata = () => {
						onVideoReady(videoElement);
					};
					videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
					return () => {
						videoElement.removeEventListener(
							"loadedmetadata",
							handleLoadedMetadata,
						);
					};
				}
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
		}, [stream, onVideoReady]);

		return (
			<video
				ref={videoRef}
				className={className}
				muted={muted}
				autoPlay={autoPlay}
				playsInline={playsInline}
			/>
		);
	},
);

VideoStream.displayName = "VideoStream";
