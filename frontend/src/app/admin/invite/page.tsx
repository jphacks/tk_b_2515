"use client";

import { CheckCircle, Loader2, Lock, Mail, UserPlus } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminInvitePage() {
	const emailId = useId();
	const nameId = useId();
	const passwordId = useId();
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const generateRandomPassword = () => {
		const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
		const length = 12;
		let password = "";
		for (let i = 0; i < length; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		setPassword(password);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await fetch("/api/admin/invite-partner", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					name,
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "招待に失敗しました");
				setIsLoading(false);
				return;
			}

			setSuccess(true);
			setEmail("");
			setName("");
			setPassword("");
			setIsLoading(false);
		} catch (err) {
			console.error("Invite error:", err);
			setError("招待中にエラーが発生しました");
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen p-8 bg-gradient-to-br from-background to-muted/20">
			<div className="max-w-2xl mx-auto space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold text-foreground">パートナー招待</h1>
					<p className="text-muted-foreground">
						新しいパートナーを招待して、アカウントを作成します
					</p>
				</div>

				<Card className="p-8 border-2 border-primary/20">
					{/* Success Message */}
					{success && (
						<div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
							<div className="flex items-center gap-2">
								<CheckCircle className="w-5 h-5 text-green-500" />
								<p className="text-sm text-green-500">
									パートナーを招待しました。初期パスワードをパートナーに共有してください。
								</p>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
							<p className="text-sm text-destructive text-center">{error}</p>
						</div>
					)}

					{/* Invite Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label
								htmlFor={nameId}
								className="text-sm font-medium text-foreground"
							>
								名前
							</label>
							<input
								id={nameId}
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="山田 花子"
								required
								className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

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
								初期パスワード
							</label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
									<input
										id={passwordId}
										type="text"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="初期パスワード"
										required
										className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<Button
									type="button"
									onClick={generateRandomPassword}
									variant="outline"
									className="shrink-0"
								>
									自動生成
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								このパスワードはパートナーに共有してください。パートナーは初回ログイン後に変更できます。
							</p>
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
									招待中...
								</>
							) : (
								<>
									<UserPlus className="w-5 h-5 mr-2" />
									パートナーを招待
								</>
							)}
						</Button>
					</form>
				</Card>
			</div>
		</div>
	);
}
