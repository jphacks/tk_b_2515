"use client";

import { CheckCircle, KeyRound, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

export default function ChangePasswordPage() {
	const router = useRouter();
	const session = useSession();
	const currentPasswordId = useId();
	const newPasswordId = useId();
	const confirmPasswordId = useId();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccess(false);

		// パスワード確認
		if (newPassword !== confirmPassword) {
			setError("新しいパスワードが一致しません");
			setIsLoading(false);
			return;
		}

		// パスワードの強度チェック
		if (newPassword.length < 8) {
			setError("パスワードは8文字以上で入力してください");
			setIsLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "パスワードの変更に失敗しました");
				setIsLoading(false);
				return;
			}

			setSuccess(true);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setIsLoading(false);

			// 3秒後にパートナーページにリダイレクト
			setTimeout(() => {
				router.push("/partner");
			}, 3000);
		} catch (err) {
			console.error("Change password error:", err);
			setError("パスワード変更中にエラーが発生しました");
			setIsLoading(false);
		}
	};

	if (session.isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
			<Card className="w-full max-w-md p-8 border-2 border-primary/20">
				<div className="space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<div className="flex justify-center mb-4">
							<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
								<KeyRound className="w-8 h-8 text-primary" />
							</div>
						</div>
						<h1 className="text-3xl font-bold text-foreground">
							パスワード変更
						</h1>
						<p className="text-muted-foreground">
							新しいパスワードを設定してください
						</p>
					</div>

					{/* Success Message */}
					{success && (
						<div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
							<div className="flex items-center gap-2">
								<CheckCircle className="w-5 h-5 text-green-500" />
								<p className="text-sm text-green-500">
									パスワードを変更しました。パートナーページに戻ります...
								</p>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
							<p className="text-sm text-destructive text-center">{error}</p>
						</div>
					)}

					{/* Change Password Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label
								htmlFor={currentPasswordId}
								className="text-sm font-medium text-foreground"
							>
								現在のパスワード
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									id={currentPasswordId}
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									placeholder="現在のパスワード"
									required
									className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor={newPasswordId}
								className="text-sm font-medium text-foreground"
							>
								新しいパスワード
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									id={newPasswordId}
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="新しいパスワード（8文字以上）"
									required
									minLength={8}
									className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label
								htmlFor={confirmPasswordId}
								className="text-sm font-medium text-foreground"
							>
								新しいパスワード（確認）
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<input
									id={confirmPasswordId}
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="新しいパスワード（確認）"
									required
									minLength={8}
									className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isLoading || success}
							className="w-full rounded-full"
							size="lg"
						>
							{isLoading ? (
								<>
									<Loader2 className="w-5 h-5 mr-2 animate-spin" />
									変更中...
								</>
							) : (
								<>
									<KeyRound className="w-5 h-5 mr-2" />
									パスワードを変更
								</>
							)}
						</Button>
					</form>

					{/* Back Link */}
					<div className="text-center">
						<button
							type="button"
							onClick={() => router.push("/partner")}
							className="text-sm text-primary hover:underline"
						>
							パートナーページに戻る
						</button>
					</div>
				</div>
			</Card>
		</div>
	);
}
