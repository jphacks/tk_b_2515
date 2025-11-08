"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAgoraRtc } from "@/hooks/useAgoraRtc";

function VideoTile({ track, label }: { track: any; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (track && ref.current) {
      try { track.play(ref.current); } catch {}
    }
    return () => {
      if (track) {
        try { track.stop(); } catch {}
      }
    };
  }, [track]);
  return (
    <div className="relative w-full bg-black rounded-md overflow-hidden aspect-video">
      <div ref={ref} className="w-full h-full" />
      <div className="absolute left-2 bottom-2 text-xs px-2 py-1 rounded bg-black/60 text-white">{label}</div>
    </div>
  );
}

export default function AgoraTestPage() {
  const { joined, channelName, localVideoTrack, remoteUsers, join, leave } = useAgoraRtc();
  const [channel, setChannel] = useState("test123");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remotes = useMemo(() => Object.values(remoteUsers), [remoteUsers]);

  const handleJoin = async () => {
    setError(null);
    setJoining(true);
    try {
      await join(channel.trim());
    } catch (e: any) {
      setError(e?.message || "接続に失敗しました");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setError(null);
    try { await leave(); } catch {}
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-br from-background to-muted">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold">Agora 通話テスト</h1>
              <p className="text-sm text-muted-foreground">チャンネル参加・離脱とローカル/リモート映像を確認できます。</p>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col">
                <label className="text-xs mb-1">チャンネル名</label>
                <input
                  className="px-3 py-2 rounded-md border border-border bg-background"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="test123"
                />
              </div>
              {!joined ? (
                <Button onClick={handleJoin} disabled={!channel.trim() || joining}>
                  {joining ? "接続中..." : "Join"}
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleLeave}>Leave</Button>
              )}
            </div>
          </div>
          {joined && (
            <p className="text-xs text-muted-foreground mt-2">参加中のチャンネル: <span className="font-medium">{channelName}</span></p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-medium">ローカル</h2>
            {localVideoTrack ? (
              <VideoTile track={localVideoTrack} label="You" />
            ) : (
              <div className="aspect-video rounded-md border border-dashed grid place-items-center text-sm text-muted-foreground">
                カメラ未開始（Join後に表示）
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-medium">リモート</h2>
            {remotes.length === 0 && (
              <div className="aspect-video rounded-md border border-dashed grid place-items-center text-sm text-muted-foreground">
                参加者待機中...
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {remotes.map((u) => (
                <VideoTile key={String(u.uid)} track={u.videoTrack} label={`UID: ${u.uid}`} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
