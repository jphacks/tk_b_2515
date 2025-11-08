/**
 * Agora WebRTC Call Hook
 *
 * Manages Agora RTC client lifecycle and video call functionality.
 * Handles joining/leaving channels, publishing/subscribing to tracks,
 * and managing connection state.
 */
import AgoraRTC, {
	type IAgoraRTCClient,
	type IAgoraRTCRemoteUser,
	type ILocalAudioTrack,
	type ILocalVideoTrack,
	type IRemoteAudioTrack,
	type IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { useCallback, useEffect, useRef, useState } from "react";

// Agora SDKのログレベル設定
AgoraRTC.setLogLevel(3); // 3 = WARNING

export interface UseAgoraCallOptions {
	appId: string;
	channelName: string;
	token: string;
	uid: number;
}

export interface UseAgoraCallReturn {
	localVideoTrack: ILocalVideoTrack | null;
	localAudioTrack: ILocalAudioTrack | null;
	remoteVideoTrack: IRemoteVideoTrack | null;
	remoteAudioTrack: IRemoteAudioTrack | null;
	connectionState: "connecting" | "connected" | "disconnected";
	isVideoEnabled: boolean;
	isAudioEnabled: boolean;
	toggleVideo: () => Promise<void>;
	toggleAudio: () => Promise<void>;
	leave: () => Promise<void>;
}

/**
 * Custom hook for Agora video calling
 */
export function useAgoraCall(
	options: UseAgoraCallOptions | null,
): UseAgoraCallReturn {
	const clientRef = useRef<IAgoraRTCClient | null>(null);
	const [localVideoTrack, setLocalVideoTrack] =
		useState<ILocalVideoTrack | null>(null);
	const [localAudioTrack, setLocalAudioTrack] =
		useState<ILocalAudioTrack | null>(null);
	const [remoteVideoTrack, setRemoteVideoTrack] =
		useState<IRemoteVideoTrack | null>(null);
	const [remoteAudioTrack, setRemoteAudioTrack] =
		useState<IRemoteAudioTrack | null>(null);
	const [connectionState, setConnectionState] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");
	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);

	// Agora接続の初期化
	useEffect(() => {
		if (!options) return;

		let isMounted = true;
		let client: IAgoraRTCClient | null = null;
		let localVideo: ILocalVideoTrack | null = null;
		let localAudio: ILocalAudioTrack | null = null;

		const init = async () => {
			try {
				console.log("[Agora] Initializing client...");

				// クライアント作成
				client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
				clientRef.current = client;

				// ユーザー参加イベント
				client.on("user-published", async (user, mediaType) => {
					console.log(`[Agora] User ${user.uid} published ${mediaType}`);
					try {
						await client!.subscribe(user, mediaType);
						console.log(`[Agora] Subscribed to user ${user.uid} ${mediaType}`);

						if (mediaType === "video" && isMounted) {
							setRemoteVideoTrack(user.videoTrack ?? null);
						}
						if (mediaType === "audio" && isMounted) {
							setRemoteAudioTrack(user.audioTrack ?? null);
							user.audioTrack?.play();
						}

						if (isMounted) {
							setConnectionState("connected");
						}
					} catch (error) {
						console.error("[Agora] Subscribe error:", error);
					}
				});

				// ユーザー退出イベント
				client.on("user-unpublished", (user, mediaType) => {
					console.log(`[Agora] User ${user.uid} unpublished ${mediaType}`);
					if (mediaType === "video" && isMounted) {
						setRemoteVideoTrack(null);
					}
					if (mediaType === "audio" && isMounted) {
						setRemoteAudioTrack(null);
					}
				});

				// ユーザー退出イベント
				client.on("user-left", (user) => {
					console.log(`[Agora] User ${user.uid} left`);
					if (isMounted) {
						setRemoteVideoTrack(null);
						setRemoteAudioTrack(null);
					}
				});

				// チャンネル参加
				console.log(`[Agora] Joining channel ${options.channelName}...`);
				await client.join(
					options.appId,
					options.channelName,
					options.token,
					options.uid,
				);
				console.log("[Agora] Joined channel successfully");

				// ローカルトラック作成
				console.log("[Agora] Creating local tracks...");
				[localVideo, localAudio] = await Promise.all([
					AgoraRTC.createCameraVideoTrack(),
					AgoraRTC.createMicrophoneAudioTrack(),
				]);

				if (!isMounted) {
					localVideo.close();
					localAudio.close();
					await client.leave();
					return;
				}

				console.log("[Agora] Local tracks created");
				setLocalVideoTrack(localVideo);
				setLocalAudioTrack(localAudio);

				// ローカルトラックを公開
				console.log("[Agora] Publishing local tracks...");
				await client.publish([localVideo, localAudio]);
				console.log("[Agora] Published local tracks");

				// 既に誰かいる場合は即座にconnectedにする
				const remoteUsers = client.remoteUsers;
				if (remoteUsers.length > 0 && isMounted) {
					setConnectionState("connected");
				}
			} catch (error) {
				console.error("[Agora] Initialization error:", error);
				if (isMounted) {
					setConnectionState("disconnected");
				}
			}
		};

		init();

		return () => {
			isMounted = false;
			// クリーンアップ
			const cleanup = async () => {
				try {
					if (localVideo) {
						localVideo.close();
					}
					if (localAudio) {
						localAudio.close();
					}
					if (client) {
						await client.leave();
					}
					console.log("[Agora] Cleanup completed");
				} catch (error) {
					console.error("[Agora] Cleanup error:", error);
				}
			};
			cleanup();
		};
	}, [options]);

	// ビデオトグル
	const toggleVideo = useCallback(async () => {
		if (localVideoTrack) {
			const newState = !isVideoEnabled;
			await localVideoTrack.setEnabled(newState);
			setIsVideoEnabled(newState);
			console.log(`[Agora] Video ${newState ? "enabled" : "disabled"}`);
		}
	}, [localVideoTrack, isVideoEnabled]);

	// オーディオトグル
	const toggleAudio = useCallback(async () => {
		if (localAudioTrack) {
			const newState = !isAudioEnabled;
			await localAudioTrack.setEnabled(newState);
			setIsAudioEnabled(newState);
			console.log(`[Agora] Audio ${newState ? "enabled" : "disabled"}`);
		}
	}, [localAudioTrack, isAudioEnabled]);

	// 退出
	const leave = useCallback(async () => {
		try {
			if (localVideoTrack) {
				localVideoTrack.close();
			}
			if (localAudioTrack) {
				localAudioTrack.close();
			}
			if (clientRef.current) {
				await clientRef.current.leave();
			}
			setConnectionState("disconnected");
			console.log("[Agora] Left channel");
		} catch (error) {
			console.error("[Agora] Leave error:", error);
		}
	}, [localVideoTrack, localAudioTrack]);

	return {
		localVideoTrack,
		localAudioTrack,
		remoteVideoTrack,
		remoteAudioTrack,
		connectionState,
		isVideoEnabled,
		isAudioEnabled,
		toggleVideo,
		toggleAudio,
		leave,
	};
}
