"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type ILocalAudioTrack, type ILocalVideoTrack, type IRemoteAudioTrack, type IRemoteVideoTrack, type IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

type RemoteUserMedia = {
  uid: string | number;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: IRemoteVideoTrack | null;
  audioTrack?: IRemoteAudioTrack | null;
};

type TokenResponse = {
  appId: string;
  channel: string;
  uid: string;
  token: string;
  expireAt: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function useAgoraRtc() {
  const client = useMemo<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

  const [joined, setJoined] = useState(false);
  const [channelName, setChannelName] = useState<string>("");
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUserMedia>>({});

  const tracksCreatedRef = useRef(false);

  // Update remote users state helper
  const updateRemote = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers((prev) => ({
      ...prev,
      [String(user.uid)]: {
        uid: user.uid as string,
        hasVideo: !!user.hasVideo,
        hasAudio: !!user.hasAudio,
        videoTrack: user.videoTrack || undefined,
        audioTrack: user.audioTrack || undefined,
      },
    }));
  }, []);

  useEffect(() => {
    const onUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
      await client.subscribe(user, mediaType);
      updateRemote(user);
      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.play();
      }
    };
  const onUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      updateRemote(user);
    };
  const onUserJoined = (user: IAgoraRTCRemoteUser) => updateRemote(user);
  const onUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers((prev) => {
        const next = { ...prev };
        delete next[String(user.uid)];
        return next;
      });
    };

    client.on("user-published", onUserPublished);
    client.on("user-unpublished", onUserUnpublished);
    client.on("user-joined", onUserJoined);
    client.on("user-left", onUserLeft);

    return () => {
      client.off("user-published", onUserPublished);
      client.off("user-unpublished", onUserUnpublished);
      client.off("user-joined", onUserJoined);
      client.off("user-left", onUserLeft);
    };
  }, [client, updateRemote]);

  const join = useCallback(async (channel: string, uid?: string) => {
    // Get token from backend
    const res = await fetch(`${API_BASE}/api/agora/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, uid }),
    });
    if (!res.ok) throw new Error("Failed to fetch Agora token");
    const data: TokenResponse = await res.json();

    const { appId, token, channel: ch, uid: account } = data;

    await client.join(appId, ch, token, account);
    setChannelName(ch);

    if (!tracksCreatedRef.current) {
      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(mic);
      setLocalVideoTrack(cam);
      tracksCreatedRef.current = true;
      await client.publish([mic, cam]);
    }

    setJoined(true);
  }, [client]);

  const leave = useCallback(async () => {
    try {
      const tracks: Array<ILocalAudioTrack | ILocalVideoTrack> = [];
      if (localAudioTrack) tracks.push(localAudioTrack);
      if (localVideoTrack) tracks.push(localVideoTrack);
      if (tracks.length) {
        await client.unpublish(tracks);
        tracks.forEach((t) => {
          try { t.stop(); } catch {}
          try { t.close(); } catch {}
        });
      }
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      tracksCreatedRef.current = false;
    } finally {
      await client.leave();
      setJoined(false);
      setChannelName("");
      setRemoteUsers({});
    }
  }, [client, localAudioTrack, localVideoTrack]);

  return {
    client,
    joined,
    channelName,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    join,
    leave,
  };
}
