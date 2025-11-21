"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/practice/waiting");
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="flex items-center gap-3 text-muted-foreground">
				<Loader2 className="w-5 h-5 animate-spin" />
				<span>待機ルームに移動しています...</span>
			</div>
		</div>
	);
}

/*
以前のログインフォーム実装（再開時に戻せるよう保持）
import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { signIn } from "@/lib/auth-client";
...
*/
