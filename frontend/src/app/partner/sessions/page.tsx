"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Heart,
	User,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PartnerSessionsPage() {
	const router = useRouter();

	// TODO: 実際のセッションデータをAPIから取得
	// 女性パートナー側なので、男性ユーザーの名前を表示
	const mockSessions = [
		{
			id: "session-1",
			userName: "田中太郎",
			status: "scheduled",
			scheduledAt: "2025-10-28T14:00:00Z",
			duration: 30,
		},
		{
			id: "session-active-123",
			userName: "山田一郎", // 男性ユーザー
			status: "active",
			scheduledAt: "2025-10-28T10:00:00Z",
			duration: 30,
		},
		{
			id: "session-2",
			userName: "佐藤健太", // 男性ユーザー
			status: "completed",
			scheduledAt: "2025-10-27T16:00:00Z",
			duration: 30,
			rating: 4.5,
		},
	];

	const handleJoinSession = (sessionId: string) => {
		// パートナー用の通話ページへ遷移
		router.push(`/partner-call/${sessionId}`);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "scheduled":
				return (
					<div className="flex items-center gap-1 text-blue-500">
						<Clock className="w-4 h-4" />
						<span className="text-sm font-medium">予定</span>
					</div>
				);
			case "active":
				return (
					<div className="flex items-center gap-1 text-green-500">
						<AlertCircle className="w-4 h-4" />
						<span className="text-sm font-medium">進行中</span>
					</div>
				);
			case "completed":
				return (
					<div className="flex items-center gap-1 text-gray-500">
						<CheckCircle className="w-4 h-4" />
						<span className="text-sm font-medium">完了</span>
					</div>
				);
			case "cancelled":
				return (
					<div className="flex items-center gap-1 text-red-500">
						<XCircle className="w-4 h-4" />
						<span className="text-sm font-medium">キャンセル</span>
					</div>
				);
			default:
				return null;
		}
	};

	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<Link
						href="/partner"
						className="flex items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<span className="font-semibold text-foreground">
							恋ai パートナー
						</span>
					</Link>
					<Link href="/partner">
						<Button variant="ghost" size="sm" className="rounded-full">
							ダッシュボードに戻る
						</Button>
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 p-4 sm:p-6">
				<div className="max-w-6xl mx-auto space-y-6">
					{/* Title */}
					<div className="space-y-2">
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
							セッション管理
						</h1>
						<p className="text-muted-foreground">
							予定されているセッションと履歴を確認できます
						</p>
					</div>

					{/* Upcoming Sessions */}
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-foreground">
							予定中のセッション
						</h2>
						{mockSessions.filter(
							(s) => s.status === "scheduled" || s.status === "active",
						).length === 0 ? (
							<Card className="p-6 border-2">
								<p className="text-center text-muted-foreground">
									現在予定されているセッションはありません
								</p>
							</Card>
						) : (
							<div className="space-y-3">
								{mockSessions
									.filter(
										(s) => s.status === "scheduled" || s.status === "active",
									)
									.map((session) => (
										<Card key={session.id} className="p-4 border-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
														<User className="w-6 h-6 text-primary" />
													</div>
													<div className="space-y-1">
														<p className="font-semibold text-foreground">
															{session.userName}
														</p>
														<div className="flex items-center gap-3 text-sm text-muted-foreground">
															<span className="flex items-center gap-1">
																<Calendar className="w-4 h-4" />
																{formatDateTime(session.scheduledAt)}
															</span>
															<span className="flex items-center gap-1">
																<Clock className="w-4 h-4" />
																{session.duration}分
															</span>
														</div>
													</div>
												</div>
												<div className="flex items-center gap-3">
													{getStatusBadge(session.status)}
													{session.status === "active" && (
														<Button
															className="rounded-full"
															onClick={() => handleJoinSession(session.id)}
														>
															セッションに参加
														</Button>
													)}
												</div>
											</div>
										</Card>
									))}
							</div>
						)}
					</div>

					{/* Past Sessions */}
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-foreground">
							過去のセッション
						</h2>
						{mockSessions.filter(
							(s) => s.status === "completed" || s.status === "cancelled",
						).length === 0 ? (
							<Card className="p-6 border-2">
								<p className="text-center text-muted-foreground">
									過去のセッションはまだありません
								</p>
							</Card>
						) : (
							<div className="space-y-3">
								{mockSessions
									.filter(
										(s) => s.status === "completed" || s.status === "cancelled",
									)
									.map((session) => (
										<Card key={session.id} className="p-4 border-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
														<User className="w-6 h-6 text-primary" />
													</div>
													<div className="space-y-1">
														<p className="font-semibold text-foreground">
															{session.userName}
														</p>
														<div className="flex items-center gap-3 text-sm text-muted-foreground">
															<span className="flex items-center gap-1">
																<Calendar className="w-4 h-4" />
																{formatDateTime(session.scheduledAt)}
															</span>
															<span className="flex items-center gap-1">
																<Clock className="w-4 h-4" />
																{session.duration}分
															</span>
															{session.rating && (
																<span className="flex items-center gap-1">
																	<Heart className="w-4 h-4 text-yellow-500" />
																	{session.rating.toFixed(1)}
																</span>
															)}
														</div>
													</div>
												</div>
												{getStatusBadge(session.status)}
											</div>
										</Card>
									))}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
