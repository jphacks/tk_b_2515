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

		// ストリームをvideo要素に設定
		useEffect(() => {
			const videoElement = videoRef.current;
			if (!videoElement || !stream) return;

			// 既に同じストリームが設定されている場合はスキップ
			if (videoElement.srcObject === stream) return;

			videoElement.srcObject = stream;

			// クリーンアップ
			return () => {
				if (videoElement.srcObject === stream) {
					videoElement.srcObject = null;
				}
			};
		}, [stream]);

		// ビデオが準備できたらコールバックを呼ぶ（一度だけ）
		useEffect(() => {
			const videoElement = videoRef.current;
			if (!videoElement || !onVideoReady || !stream) return;

			let isCalled = false;

			const handleLoadedMetadata = () => {
				// 既に呼ばれている場合はスキップ
				if (isCalled) return;
				isCalled = true;
				onVideoReady(videoElement);
			};

			videoElement.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });

			// 既にメタデータがロード済みの場合は即座に呼び出す
			if (videoElement.readyState >= 1) {
				handleLoadedMetadata();
			}

			return () => {
				videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
			};
		}, [stream, onVideoReady]);

		return (
			<video
				ref={videoRef}
				className={className}
				muted={muted}
				autoPlay={autoPlay}
				playsInline={playsInline}
				style={{
					transform: 'scaleX(-1)', // ミラー表示（ユーザーが見やすいように）
				}}
			/>
		);
	},
);

VideoStream.displayName = "VideoStream";
