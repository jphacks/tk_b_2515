"use client";

import {
	Bell,
	CreditCard,
	Heart,
	HelpCircle,
	Lock,
	LogOut,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PartnerSettingsPage() {
	const [notifications, setNotifications] = useState({
		emailNotifications: true,
		pushNotifications: true,
		sessionReminders: true,
		newMatchAlerts: true,
	});

	const [privacy, setPrivacy] = useState({
		profileVisibility: "public",
		showAge: true,
		showUniversity: true,
	});

	const handleNotificationToggle = (key: string) => {
		setNotifications((prev) => ({
			...prev,
			[key]: !prev[key as keyof typeof prev],
		}));
	};

	const handlePrivacyToggle = (key: string) => {
		setPrivacy((prev) => ({
			...prev,
			[key]: !prev[key as keyof typeof prev],
		}));
	};

	const handleSave = () => {
		// TODO: APIにデータを送信
		console.log("Saving settings:", { notifications, privacy });
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
				<div className="max-w-4xl mx-auto space-y-6">
					{/* Title */}
					<div className="space-y-2">
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
							設定
						</h1>
						<p className="text-muted-foreground">
							通知、プライバシー、その他の設定を管理
						</p>
					</div>

					{/* Notification Settings */}
					<Card className="p-6 border-2">
						<div className="space-y-6">
							<div className="flex items-center gap-2">
								<Bell className="w-6 h-6 text-primary" />
								<h2 className="text-2xl font-bold text-foreground">通知設定</h2>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">メール通知</p>
										<p className="text-sm text-muted-foreground">
											重要な更新をメールで受け取る
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={notifications.emailNotifications}
											onChange={() =>
												handleNotificationToggle("emailNotifications")
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">プッシュ通知</p>
										<p className="text-sm text-muted-foreground">
											アプリからのプッシュ通知を受け取る
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={notifications.pushNotifications}
											onChange={() =>
												handleNotificationToggle("pushNotifications")
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">
											セッションリマインダー
										</p>
										<p className="text-sm text-muted-foreground">
											予定の15分前に通知を受け取る
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={notifications.sessionReminders}
											onChange={() =>
												handleNotificationToggle("sessionReminders")
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">
											新規マッチング通知
										</p>
										<p className="text-sm text-muted-foreground">
											新しいセッション予約時に通知を受け取る
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={notifications.newMatchAlerts}
											onChange={() =>
												handleNotificationToggle("newMatchAlerts")
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
							</div>
						</div>
					</Card>

					{/* Privacy Settings */}
					<Card className="p-6 border-2">
						<div className="space-y-6">
							<div className="flex items-center gap-2">
								<Lock className="w-6 h-6 text-primary" />
								<h2 className="text-2xl font-bold text-foreground">
									プライバシー設定
								</h2>
							</div>

							<div className="space-y-4">
								<div className="space-y-2">
									<p className="font-medium text-foreground">
										プロフィール公開設定
									</p>
									<select
										value={privacy.profileVisibility}
										onChange={(e) =>
											setPrivacy((prev) => ({
												...prev,
												profileVisibility: e.target.value,
											}))
										}
										className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
									>
										<option value="public">すべてのユーザーに公開</option>
										<option value="verified">認証済みユーザーのみ</option>
										<option value="private">非公開</option>
									</select>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">年齢を表示</p>
										<p className="text-sm text-muted-foreground">
											プロフィールに年齢を表示する
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={privacy.showAge}
											onChange={() => handlePrivacyToggle("showAge")}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>

								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="font-medium text-foreground">大学名を表示</p>
										<p className="text-sm text-muted-foreground">
											プロフィールに大学名を表示する
										</p>
									</div>
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={privacy.showUniversity}
											onChange={() => handlePrivacyToggle("showUniversity")}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
							</div>
						</div>
					</Card>

					{/* Payment Settings */}
					<Card className="p-6 border-2">
						<div className="space-y-6">
							<div className="flex items-center gap-2">
								<CreditCard className="w-6 h-6 text-primary" />
								<h2 className="text-2xl font-bold text-foreground">報酬管理</h2>
							</div>

							<div className="space-y-4">
								<div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium text-foreground">現在の残高</p>
											<p className="text-2xl font-bold text-primary">
												0 ポイント
											</p>
										</div>
										<Button variant="outline" className="rounded-full">
											出金申請
										</Button>
									</div>
								</div>

								<Button variant="outline" className="w-full rounded-full">
									<CreditCard className="w-4 h-4 mr-2" />
									振込先情報を設定
								</Button>
							</div>
						</div>
					</Card>

					{/* Help & Support */}
					<Card className="p-6 border-2">
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<HelpCircle className="w-6 h-6 text-primary" />
								<h2 className="text-2xl font-bold text-foreground">
									ヘルプ & サポート
								</h2>
							</div>

							<div className="space-y-2">
								<Button
									variant="ghost"
									className="w-full justify-start rounded-full"
								>
									よくある質問
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start rounded-full"
								>
									利用規約
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start rounded-full"
								>
									プライバシーポリシー
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start rounded-full"
								>
									お問い合わせ
								</Button>
							</div>
						</div>
					</Card>

					{/* Account Actions */}
					<Card className="p-6 border-2 border-red-500/20">
						<div className="space-y-4">
							<h2 className="text-xl font-bold text-foreground">アカウント</h2>
							<div className="space-y-2">
								<Button
									variant="ghost"
									className="w-full justify-start rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
								>
									<LogOut className="w-4 h-4 mr-2" />
									ログアウト
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
								>
									アカウントを削除
								</Button>
							</div>
						</div>
					</Card>

					{/* Save Button */}
					<div className="flex justify-end">
						<Button onClick={handleSave} size="lg" className="rounded-full">
							<Settings className="w-5 h-5 mr-2" />
							設定を保存
						</Button>
					</div>
				</div>
			</main>
		</div>
	);
}
