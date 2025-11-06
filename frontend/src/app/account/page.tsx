"use client";

import { Heart, Loader2, LogOut, Save, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AvatarSelector } from "@/components/auth/avatar-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
import { avatarOptions } from "@/lib/avatar-options";
import { cn } from "@/lib/utils";

export default function AccountPage() {
	const router = useRouter();
	const sessionState = useSession();
	const { data, isPending, error, refetch } = sessionState;

	const [name, setName] = useState("");
	const [avatar, setAvatar] = useState<string>(avatarOptions[0]?.src ?? "");
	const [status, setStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const nicknameInputId = `nickname-${Math.random().toString(36).slice(2, 11)}`;
	const user = data?.user ?? null;

	const hasLoadedUser = useMemo(() => !isPending && !!data, [isPending, data]);

	useEffect(() => {
		if (!isPending && !data) {
			router.push("/login");
		}
	}, [isPending, data, router]);

	useEffect(() => {
		if (user) {
			setName(user.name ?? "");
			setAvatar(user.image ?? avatarOptions[0]?.src ?? "");
		}
	}, [user]);

	const handleSave = async () => {
		if (!user) return;
		setIsSaving(true);
		setStatus(null);

		try {
			const payload: Record<string, string> = {};
			if (name && name !== user.name) {
				payload.name = name;
			}
			if (avatar && avatar !== user.image) {
				payload.image = avatar;
			}

			if (Object.keys(payload).length === 0) {
				setStatus({
					type: "error",
					message: "変更された内容がありません。",
				});
				setIsSaving(false);
				return;
			}

			const response = await fetch("/api/auth/update-user", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const result = await response.json().catch(() => ({}));
				const message =
					typeof result?.message === "string"
						? result.message
						: "プロフィールの更新に失敗しました。";
				throw new Error(message);
			}

			await refetch?.();
			setStatus({
				type: "success",
				message: "プロフィールを更新しました。",
			});
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "プロフィールの更新に失敗しました。";
			setStatus({
				type: "error",
				message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleSignOut = async () => {
		await signOut();
		router.push("/login");
	};

	return (
		<div className="min-h-screen flex flex-col">
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-5xl mx-auto flex items-center justify-between">
					<Link
						href="/"
						className="flex items-center gap-2 hover:opacity-80 transition-opacity"
					>
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<span className="font-semibold text-foreground">恋ai</span>
					</Link>
					{user ? (
						<Button
							variant="ghost"
							onClick={handleSignOut}
							className="rounded-full"
						>
							<LogOut className="w-4 h-4 mr-2" />
							ログアウト
						</Button>
					) : null}
				</div>
			</header>

			<main className="flex-1 p-4 sm:p-6">
				<div className="max-w-3xl mx-auto space-y-6">
					<div className="space-y-2">
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
							プロフィール設定
						</h1>
						<p className="text-muted-foreground">
							アカウント情報とアイコンをカスタマイズできます。
						</p>
					</div>

					<Card className="p-6 sm:p-8 border-2 space-y-6">
						{isPending ? (
							<div className="flex items-center gap-3 text-muted-foreground">
								<Loader2 className="w-5 h-5 animate-spin" />
								<span>プロフィールを読み込み中です...</span>
							</div>
						) : error ? (
							<div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
								<p className="text-sm text-red-600 dark:text-red-400">
									セッション情報の取得に失敗しました。ページを再読み込みしてください。
								</p>
							</div>
						) : hasLoadedUser && user ? (
							<div className="space-y-6">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									<div className="flex items-center gap-4">
										<div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-primary/40 bg-primary/10">
											<Image
												src={avatar || "/avatars/avatar-1.svg"}
												alt="プロフィールアイコン"
												fill
												sizes="80px"
												className="object-cover"
											/>
										</div>
										<div>
											<p className="text-base font-semibold text-foreground">
												{user.email}
											</p>
											<p className="text-sm text-muted-foreground">
												ログイン中のアカウント
											</p>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<label
										htmlFor={nicknameInputId}
										className="text-sm font-medium text-foreground flex items-center gap-2"
									>
										<User className="w-4 h-4 text-primary" />
										ニックネーム
									</label>
									<input
										id={nicknameInputId}
										type="text"
										value={name}
										onChange={(event) => setName(event.target.value)}
										className="w-full rounded-lg border-2 border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:border-primary"
										placeholder="ニックネームを入力"
									/>
								</div>

								<div className="space-y-3">
									<p className="text-sm font-medium text-foreground">
										アイコンを選択
									</p>
									<AvatarSelector value={avatar} onChange={setAvatar} />
								</div>

								{status ? (
									<div
										className={cn(
											"rounded-lg border p-3 text-sm",
											status.type === "success"
												? "border-primary/20 bg-primary/5 text-primary"
												: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
										)}
									>
										{status.message}
									</div>
								) : null}

								<div className="flex items-center justify-end">
									<Button
										type="button"
										onClick={handleSave}
										disabled={isSaving}
										className="rounded-full px-6"
									>
										{isSaving ? (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										) : (
											<Save className="w-4 h-4 mr-2" />
										)}
										保存する
									</Button>
								</div>
							</div>
						) : null}
					</Card>
				</div>
			</main>
		</div>
	);
}
