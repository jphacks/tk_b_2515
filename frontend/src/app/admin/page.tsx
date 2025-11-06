"use client";

import { Heart, LogOut, Settings, Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";

export default function AdminDashboardPage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();

	const handleSignOut = async () => {
		await signOut();
		router.push("/admin/login");
	};

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
						<Shield className="w-8 h-8 text-primary animate-pulse" />
					</div>
					<p className="text-muted-foreground">読み込み中...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-8 bg-gradient-to-br from-background to-muted/20">
			<div className="max-w-6xl mx-auto space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
							<Shield className="w-10 h-10 text-primary" />
							管理者ダッシュボード
						</h1>
						<p className="text-muted-foreground mt-2">
							恋ai管理システムへようこそ
						</p>
					</div>
					<div className="flex items-center gap-4">
						{session?.user && (
							<div className="text-right">
								<p className="text-sm font-medium text-foreground">
									{session.user.name || session.user.email}
								</p>
								<p className="text-xs text-muted-foreground">管理者</p>
							</div>
						)}
						<Button variant="outline" onClick={handleSignOut} className="gap-2">
							<LogOut className="w-4 h-4" />
							ログアウト
						</Button>
					</div>
				</div>

				{/* Main Navigation Cards */}
				<div className="grid md:grid-cols-2 gap-6">
					{/* User Page Card */}
					<Card className="p-8 border-2 border-border hover:border-primary transition-colors cursor-pointer group">
						<div onClick={() => router.push("/")} className="space-y-6">
							<div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
								<Users className="w-8 h-8 text-blue-500" />
							</div>
							<div className="space-y-2">
								<h2 className="text-2xl font-bold text-foreground">
									ユーザーページ
								</h2>
								<p className="text-muted-foreground">
									AI練習システムにアクセスします。AIとの会話練習やフィードバックの確認ができます。
								</p>
							</div>
							<div className="flex gap-2 flex-wrap">
								<span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
									AI会話練習
								</span>
								<span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
									フィードバック
								</span>
								<span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
									シミュレーション
								</span>
							</div>
							<Button className="w-full gap-2" size="lg">
								<Users className="w-5 h-5" />
								ユーザーページへ
							</Button>
						</div>
					</Card>

					{/* Partner Page Card */}
					<Card className="p-8 border-2 border-border hover:border-primary transition-colors cursor-pointer group">
						<div onClick={() => router.push("/partner")} className="space-y-6">
							<div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
								<Heart className="w-8 h-8 text-pink-500" />
							</div>
							<div className="space-y-2">
								<h2 className="text-2xl font-bold text-foreground">
									パートナーページ
								</h2>
								<p className="text-muted-foreground">
									パートナー管理システムにアクセスします。セッション管理やフィードバックの提供ができます。
								</p>
							</div>
							<div className="flex gap-2 flex-wrap">
								<span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-medium">
									セッション管理
								</span>
								<span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-medium">
									対応履歴
								</span>
								<span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-medium">
									プロフィール
								</span>
							</div>
							<Button className="w-full gap-2" size="lg">
								<Heart className="w-5 h-5" />
								パートナーページへ
							</Button>
						</div>
					</Card>
				</div>

				{/* Admin Functions */}
				<div className="space-y-4">
					<h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
						<Settings className="w-6 h-6" />
						管理機能
					</h2>
					<div className="grid md:grid-cols-3 gap-4">
						<Card className="p-6 border-2 border-border hover:border-primary transition-colors cursor-pointer">
							<button
								onClick={() => router.push("/admin/invite")}
								className="w-full text-left space-y-3"
							>
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<Users className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">
										パートナー招待
									</h3>
									<p className="text-sm text-muted-foreground">
										新しいパートナーを招待
									</p>
								</div>
							</button>
						</Card>

						<Card className="p-6 border-2 border-border hover:border-primary transition-colors cursor-pointer opacity-50">
							<div className="w-full text-left space-y-3">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<Users className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">
										ユーザー管理
									</h3>
									<p className="text-sm text-muted-foreground">
										ユーザー一覧と管理
									</p>
								</div>
								<span className="text-xs text-muted-foreground">
									（準備中）
								</span>
							</div>
						</Card>

						<Card className="p-6 border-2 border-border hover:border-primary transition-colors cursor-pointer opacity-50">
							<div className="w-full text-left space-y-3">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<Settings className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">
										システム設定
									</h3>
									<p className="text-sm text-muted-foreground">
										システムの設定変更
									</p>
								</div>
								<span className="text-xs text-muted-foreground">
									（準備中）
								</span>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
