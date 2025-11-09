"use client";

import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Loader2,
	RefreshCcw,
	ShieldCheck,
	UserRound,
	Users,
	Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { config } from "@/lib/config";

type WaitingSession = {
	id: string;
	status: string;
	createdAt: string;
	user?: {
		id: string;
		name: string | null;
		image: string | null;
	} | null;
	partner?: {
		id: string;
		name: string | null;
	} | null;
};

const POLL_INTERVAL_MS = 15_000;

export default function PartnerWaitingPage() {
	const router = useRouter();
	const sessionState = useSession();
	const { data: sessionData, isPending } = sessionState;

	const [sessions, setSessions] = useState<WaitingSession[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
	const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

	const fetchWaitingSessions = useCallback(async () => {
		setError(null);
		try {
			const params = new URLSearchParams();
			if (sessionData?.user?.id) {
				params.set("partnerId", sessionData.user.id);
			}
			const response = await fetch(
				`/api/partners/sessions/waiting${params.size > 0 ? `?${params.toString()}` : ""}`,
				{
					cache: "no-store",
				},
			);

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				const message =
					typeof payload?.error === "string"
						? payload.error
						: "待機中セッションの取得に失敗しました。";
				setError(message);
				setSessions([]);
				return;
			}

			const data = (await response.json()) as { sessions: WaitingSession[] };
			setSessions(
				data.sessions?.filter((session) =>
					sessionData?.user?.id ? session.partner?.id === sessionData.user.id : true,
				) ?? [],
			);
			setLastUpdated(new Date());
		} catch (err) {
			console.error("Failed to load waiting sessions:", err);
			setError("待機中セッションの取得に失敗しました。");
			setSessions([]);
		} finally {
			setIsLoading(false);
		}
	}, [sessionData?.user?.id]);

	useEffect(() => {
		void fetchWaitingSessions();
		const interval = setInterval(() => {
			void fetchWaitingSessions();
		}, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [fetchWaitingSessions]);

	const waitingCount = useMemo(() => sessions.length, [sessions]);

	const handleCopy = useCallback(async (sessionId: string) => {
		try {
			await navigator.clipboard.writeText(sessionId);
		} catch {
			// ignore clipboard failures
		}
	}, []);

	const handleJoinSession = useCallback(
		async (sessionId: string, userName?: string | null) => {
			setJoiningSessionId(sessionId);
			try {
				await fetch(
					`${config.api.baseUrl}/api/partners/sessions/${sessionId}/start`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);
			} catch (err) {
				console.error("Failed to mark session active:", err);
			} finally {
				router.push(
					`/partner-call/${sessionId}?partnerName=${encodeURIComponent(
						userName || "ユーザー",
					)}`,
				);
				setJoiningSessionId(null);
			}
		},
		[router],
	);

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="flex items-center gap-3 text-muted-foreground">
					<Loader2 className="w-5 h-5 animate-spin" />
					<span>セッション情報を読み込み中...</span>
				</div>
			</div>
		);
	}

	// if (!sessionData?.user) {
	// 	return (
	// 		<div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
	// 			<AlertCircle className="w-10 h-10 text-red-500" />
	// 			<div>
	// 				<p className="text-lg font-semibold text-foreground">ログインが必要です</p>
	// 				<p className="text-sm text-muted-foreground">
	// 					このページにアクセスするにはパートナーアカウントでログインしてください。
	// 				</p>
	// 			</div>
	// 			<Link href="/login">
	// 				<Button className="rounded-full">ログインページへ</Button>
	// 			</Link>
	// 		</div>
	// 	);
	// }

	// if (!isPartner) {
	// 	return (
	// 		<div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
	// 			<AlertCircle className="w-10 h-10 text-red-500" />
	// 			<div>
	// 				<p className="text-lg font-semibold text-foreground">
	// 					パートナー権限が必要です
	// 				</p>
	// 				<p className="text-sm text-muted-foreground">
	// 					このページは認定パートナーのみが利用できます。ログインし直すか管理者にお問い合わせください。
	// 				</p>
	// 			</div>
	// 			<Link href="/login">
	// 				<Button className="rounded-full">ログインページへ</Button>
	// 			</Link>
	// 		</div>
	// 	);
	// }

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
			<header className="border-b border-border bg-card/70 backdrop-blur">
				<div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
					<Link
						href="/partner"
						className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						パートナーダッシュボードに戻る
					</Link>
					<div className="text-sm text-muted-foreground flex items-center gap-2">
						<UserRound className="w-4 h-4" />
						<span>{sessionData?.user?.name ?? "パートナー"}</span>
					</div>
				</div>
			</header>

			<main className="flex-1 px-4 py-6">
				<div className="max-w-5xl mx-auto space-y-6">
					<div className="space-y-2 text-center">
						<p className="text-xs font-medium text-primary uppercase tracking-widest">
							Partner Control Room
						</p>
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
							ユーザー待機ルーム
						</h1>
						<p className="text-muted-foreground">
							AI練習を終えたユーザーが表示されます。セッションIDを確認し、準備ができたら通話を開始してください。
						</p>
					</div>

					<Card className="p-6 border-2 border-primary/20 bg-card/80 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div className="flex items-center gap-3 text-foreground">
								<ShieldCheck className="w-6 h-6 text-primary" />
								<div>
									<p className="text-sm font-semibold">待機フロー</p>
									<p className="text-xs text-muted-foreground">
										ユーザーがパートナーを選択すると即座にセッションIDが発行されます。
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void fetchWaitingSessions()}
								className="rounded-full"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										更新中...
									</>
								) : (
									<>
										<RefreshCcw className="w-4 h-4 mr-2" />
										最新情報を取得
									</>
								)}
							</Button>
						</div>

						<div className="grid sm:grid-cols-3 gap-3 text-sm">
							<div className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3 bg-background/60">
								<Users className="w-5 h-5 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">待機中ユーザー</p>
									<p className="text-lg font-semibold">
										{isLoading ? "-" : waitingCount}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3 bg-background/60">
								<Clock className="w-5 h-5 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">自動更新</p>
									<p className="text-lg font-semibold">15秒ごと</p>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3 bg-background/60">
								<ShieldCheck className="w-5 h-5 text-primary" />
								<div>
									<p className="text-xs text-muted-foreground">最新取得</p>
									<p className="text-lg font-semibold">
										{lastUpdated
											? lastUpdated.toLocaleTimeString("ja-JP", {
													hour: "2-digit",
													minute: "2-digit",
													second: "2-digit",
												})
											: "-"}
									</p>
								</div>
							</div>
						</div>

						{error && (
							<Card className="p-4 border-red-500/40 bg-red-500/10 flex items-start gap-3">
								<AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
								<div>
									<p className="text-sm font-semibold text-red-600">
										情報の取得に失敗しました
									</p>
									<p className="text-sm text-red-500">{error}</p>
								</div>
							</Card>
						)}
					</Card>

					<Card className="p-6 border-2">
						<div className="flex items-center justify-between flex-wrap gap-3 mb-4">
							<div>
								<h2 className="text-xl font-bold text-foreground">
									待機中のセッション
								</h2>
								<p className="text-sm text-muted-foreground">
									ユーザー名とセッションIDを確認して、通話を開始してください
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => void fetchWaitingSessions()}
								className="rounded-full"
							>
								<RefreshCcw className="w-4 h-4 mr-2" />
								再読み込み
							</Button>
						</div>

						{isLoading ? (
							<div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
								<Loader2 className="w-6 h-6 animate-spin" />
								<p>待機中セッションを読み込み中...</p>
							</div>
						) : sessions.length === 0 ? (
							<div className="text-center py-12 space-y-3">
								<p className="text-sm text-muted-foreground">
									現在待機中のユーザーはいません。
								</p>
								<p className="text-xs text-muted-foreground">
									ユーザーがパートナーを選択すると自動的に表示されます。
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{sessions.map((session) => (
									<Card key={session.id} className="p-4 border rounded-xl">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
											<div className="space-y-2">
												<div className="flex items-center gap-3">
													<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
														{session.user?.name
															? session.user.name.charAt(0).toUpperCase()
															: "U"}
													</div>
													<div>
														<p className="font-semibold text-lg text-foreground">
															{session.user?.name ?? "匿名ユーザー"}
														</p>
														<p className="text-xs text-muted-foreground">
															待機開始:
															{" "}
															{new Date(session.createdAt).toLocaleString("ja-JP", {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</p>
													</div>
												</div>
												<div className="rounded-lg border border-border bg-background/70 px-4 py-3 text-sm">
													<p className="text-xs text-muted-foreground">
														セッションID
													</p>
													<div className="flex items-center justify-between gap-3">
														<span className="font-mono text-sm break-all">
															{session.id}
														</span>
														<Button
															variant="ghost"
															size="sm"
															className="text-xs px-2 py-1 rounded-full"
															onClick={() => void handleCopy(session.id)}
														>
															IDをコピー
														</Button>
													</div>
												</div>
											</div>

											<div className="flex flex-col gap-2 w-full sm:w-48">
												<Button
													size="lg"
													className="rounded-full"
													onClick={() =>
														void handleJoinSession(session.id, session.user?.name)
													}
													disabled={joiningSessionId === session.id}
												>
													{joiningSessionId === session.id ? (
														<>
															<Loader2 className="w-5 h-5 mr-2 animate-spin" />
															接続中...
														</>
													) : (
														<>
															<Video className="w-5 h-5 mr-2" />
															通話を開始
														</>
													)}
												</Button>
												<p className="text-xs text-muted-foreground">
													通話開始後、自動でステータスが更新されます。
												</p>
											</div>
										</div>
									</Card>
								))}
							</div>
						)}
					</Card>

					<Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 space-y-3">
						<div className="flex items-center gap-3">
							<CheckCircle2 className="w-6 h-6 text-primary" />
							<div>
								<p className="font-semibold text-foreground">スムーズな接続のために</p>
								<p className="text-sm text-muted-foreground">
									開始前にカメラとマイクのチェックを済ませ、笑顔でユーザーを迎えてください。
								</p>
							</div>
						</div>
					</Card>
				</div>
			</main>
		</div>
	);
}
