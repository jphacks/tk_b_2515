"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthCard, AuthTitle, GoogleAuthButton } from "@/components/auth";
import { signUp, signIn } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      setIsLoading(false);
      return;
    }

    try {
      await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      router.push("/");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("アカウント作成に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err: unknown) {
      console.error("Google signup error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Googleアカウント登録に失敗しました");
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthTitle
        title="新規登録"
        description="アカウントを作成して練習を始めましょう"
      />

      <AuthCard>
        <div className="space-y-6">
          <GoogleAuthButton
            onClick={handleGoogleSignup}
            isLoading={isLoading}
            label="Googleで登録"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">または</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor={nameId}>
                名前 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  aria-hidden="true"
                  focusable="false"
                />
                <input
                  type="text"
                  id={nameId}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="山田太郎"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor={emailId}>
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  aria-hidden="true"
                  focusable="false"
                />
                <input
                  type="email"
                  id={emailId}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor={passwordId}>
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  aria-hidden="true"
                  focusable="false"
                />
                <input
                  type="password"
                  id={passwordId}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="6文字以上"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor={confirmPasswordId}>
                パスワード（確認） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  aria-hidden="true"
                  focusable="false"
                />
                <input
                  type="password"
                  id={confirmPasswordId}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="パスワードを再入力"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              登録することで、
              <Link href="/terms" className="text-primary hover:underline">
                利用規約
              </Link>
              と
              <Link href="/privacy" className="text-primary hover:underline">
                プライバシーポリシー
              </Link>
              に同意したものとみなされます。
            </p>

            <Button type="submit" disabled={isLoading} size="lg" className="w-full rounded-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  登録中...
                </>
              ) : (
                "アカウントを作成"
              )}
            </Button>
          </form>
        </div>
      </AuthCard>

      <AuthCard withPadding={false} className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-primary hover:underline ml-1">
            ログイン
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
