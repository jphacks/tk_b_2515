"use client";

import { Heart, Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

export default function PartnerLoginPage() {
	const router = useRouter();
	const emailId = useId();
	const passwordId = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await signIn.email({
				email,
				password,
			});

			if (result.error) {
				setError(result.error.message || "ログインに失敗しました");
				setIsLoading(false);
				return;
			}

			// ログイン成功後、パートナーページへリダイレクト
			// ロールの確認はミドルウェアで行われます
			router.push("/partner");
		} catch (err) {
			console.error("Login error:", err);
			setError("ログイン中にエラーが発生しました");
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
			<Card className="w-full max-w-md p-8 border-2">
				<div className="space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<div className="flex justify-center mb-4">
							<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
								<Heart className="w-8 h-8 text-primary fill-primary" />
							</div>
						</div>
						<h1 className="text-3xl font-bold text-foreground">
							パートナーログイン
						</h1>
						<p className="text-muted-foreground">
							恋ai パートナーダッシュボードへのアクセス
						</p>
					</div>

					{/* Error Message */}
					{error && (
						<div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
							<p className="text-sm text-destructive text-center">{error}</p>
						</div>
					)}

					{/* Login Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label
								htmlFor={emailId}
								className="text-sm font-medium text-foreground"
							>
								メールアドレス
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									id={emailId}
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="partner@example.com"
									required
									className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor={passwordId}
								className="text-sm font-medium text-foreground"
							>
								パスワード
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									id={passwordId}
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-full"
							size="lg"
						>
							{isLoading ? (
								<>
									<Loader2 className="w-5 h-5 mr-2 animate-spin" />
									ログイン中...
								</>
							) : (
								<>
									<Lock className="w-5 h-5 mr-2" />
									ログイン
								</>
							)}
						</Button>
					</form>

					{/* Info */}
					<div className="text-center space-y-2">
						<p className="text-xs text-muted-foreground">
							このページはパートナー専用です。
							<br />
							パートナー権限を持つアカウントでログインしてください。
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
