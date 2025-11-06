"use client";

import { ArrowLeft, CheckCircle, Heart, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const emailInputId = useId();

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/callback`,
			});

			if (error) {
				throw error;
			}

			setSuccess(true);
		} catch (err: unknown) {
			console.error("Reset password error:", err);
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("パスワードリセットメールの送信に失敗しました");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<Link
						href="/"
						className="flex items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<span className="font-semibold text-foreground">恋ai</span>
					</Link>
					<Link href="/login">
						<Button variant="ghost" size="sm" className="rounded-full">
							<ArrowLeft className="w-4 h-4 mr-2" />
							ログインに戻る
						</Button>
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center p-4 sm:p-6">
				<div className="w-full max-w-md space-y-6">
					{/* Title */}
					<div className="text-center space-y-2">
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
							パスワードリセット
						</h1>
						<p className="text-muted-foreground">
							登録済みのメールアドレスを入力してください
						</p>
					</div>

					{/* Reset Card */}
					<Card className="p-6 sm:p-8 border-2">
						{success ? (
							<div className="text-center space-y-4">
								<div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
									<CheckCircle className="w-10 h-10 text-green-500" />
								</div>
								<div className="space-y-2">
									<h2 className="text-xl font-bold text-foreground">
										メールを送信しました
									</h2>
									<p className="text-sm text-muted-foreground">
										{email} にパスワードリセット用のリンクを送信しました。
										<br />
										メールをご確認ください。
									</p>
								</div>
								<Link href="/login">
									<Button size="lg" className="w-full rounded-full">
										ログインページに戻る
									</Button>
								</Link>
							</div>
						) : (
							<form onSubmit={handleResetPassword} className="space-y-6">
								{/* Email Input */}
								<div className="space-y-2">
									<label
										className="text-sm font-medium text-foreground"
										htmlFor={emailInputId}
									>
										メールアドレス
									</label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
										<input
											id={emailInputId}
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="example@email.com"
											required
											className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
										/>
									</div>
								</div>

								{/* Error Message */}
								{error && (
									<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
										<p className="text-sm text-red-600 dark:text-red-400">
											{error}
										</p>
									</div>
								)}

								{/* Info */}
								<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
									<p className="text-sm text-muted-foreground">
										パスワードリセット用のリンクをメールで送信します。
										リンクの有効期限は1時間です。
									</p>
								</div>

								{/* Submit Button */}
								<Button
									type="submit"
									disabled={isLoading}
									size="lg"
									className="w-full rounded-full"
								>
									{isLoading ? (
										<>
											<Loader2 className="w-5 h-5 mr-2 animate-spin" />
											送信中...
										</>
									) : (
										"リセットリンクを送信"
									)}
								</Button>
							</form>
						)}
					</Card>
				</div>
			</main>
		</div>
	);
}
