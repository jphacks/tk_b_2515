"use client";

import { Heart, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestCallPage() {
	const router = useRouter();
	const [sessionId, setSessionId] = useState(`test-session-${Date.now()}`);

	const joinAsUser = () => {
		router.push(`/session/${sessionId}?role=user`);
	};

	const joinAsPartner = () => {
		// 新しいウィンドウで開く
		window.open(`/session/${sessionId}?role=partner`, "_blank");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
			<Card className="p-8 max-w-md w-full">
				<div className="space-y-6">
					<div className="text-center space-y-2">
						<Heart className="w-12 h-12 text-primary fill-primary mx-auto" />
						<h1 className="text-2xl font-bold text-foreground">
							WebRTC通話テスト
						</h1>
						<p className="text-muted-foreground">
							開発者向けのテストページです
						</p>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">
								セッションID
							</label>
							<input
								type="text"
								value={sessionId}
								onChange={(e) => setSessionId(e.target.value)}
								className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="test-session-123"
							/>
							<p className="text-xs text-muted-foreground">
								両方のブラウザで同じセッションIDを使用してください
							</p>
						</div>

						<div className="space-y-3 pt-4">
							<h3 className="font-semibold text-foreground">テスト方法:</h3>

							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									<strong>推奨方法:</strong>
								</p>
								<ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
									<li>「ユーザーとして参加」をクリック</li>
									<li>「パートナーとして参加」をクリック（新しいウィンドウが開く）</li>
									<li>両方のウィンドウでカメラ・マイクを許可</li>
									<li>パートナー側がofferを送信し、接続が確立されます</li>
								</ol>
							</div>
						</div>

						<div className="flex flex-col gap-2 pt-4">
							<Button onClick={joinAsUser} size="lg" className="w-full">
								<Video className="w-5 h-5 mr-2" />
								ユーザーとして参加
							</Button>
							<Button
								onClick={joinAsPartner}
								variant="outline"
								size="lg"
								className="w-full"
							>
								<Video className="w-5 h-5 mr-2" />
								パートナーとして参加（新しいウィンドウ）
							</Button>
						</div>
					</div>

					<div className="pt-4 border-t border-border">
						<h3 className="font-semibold text-foreground mb-2">確認項目:</h3>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>✓ カメラが表示されるか</li>
							<li>✓ 相手の映像が表示されるか</li>
							<li>✓ 音声が聞こえるか</li>
							<li>✓ ビデオ・音声のON/OFFが動作するか</li>
						</ul>
					</div>

					<div className="pt-4">
						<p className="text-xs text-muted-foreground">
							<strong>注意:</strong> バックエンド（port
							8787）が起動していることを確認してください。
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
