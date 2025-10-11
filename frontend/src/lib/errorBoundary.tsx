"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * エラーをキャッチしてフォールバックUIを表示するError Boundary
 */
export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error Boundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-screen flex items-center justify-center p-6 bg-background">
					<div className="max-w-md w-full space-y-6 text-center">
						<div className="flex justify-center">
							<div className="p-4 rounded-full bg-destructive/10">
								<AlertCircle className="w-12 h-12 text-destructive" />
							</div>
						</div>
						<div className="space-y-2">
							<h2 className="text-2xl font-bold text-foreground">
								エラーが発生しました
							</h2>
							<p className="text-muted-foreground">
								申し訳ございません。予期しないエラーが発生しました。
							</p>
							{this.state.error && (
								<details className="mt-4 text-left">
									<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
										エラー詳細
									</summary>
									<pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
										{this.state.error.toString()}
									</pre>
								</details>
							)}
						</div>
						<Button
							onClick={() => {
								this.setState({ hasError: false, error: null });
								window.location.reload();
							}}
							size="lg"
							className="w-full"
						>
							ページを再読み込み
						</Button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
