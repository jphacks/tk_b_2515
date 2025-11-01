"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, User, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signUp, signIn } from "@/lib/auth-client";
import { AvatarSelector } from "@/components/auth/avatar-selector";
import { avatarOptions } from "@/lib/avatar-options";

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
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    avatarOptions[0]?.src ?? ""
  );
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

    // Validation
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
        image: selectedAvatar,
      });

      // サインアップ成功
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Heart className="w-6 h-6 text-primary fill-primary" aria-hidden="true" focusable="false" />
            <span className="font-semibold text-foreground">恋ai</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              新規登録
            </h1>
            <p className="text-muted-foreground">
              アカウントを作成して練習を始めましょう
            </p>
          </div>

          {/* Signup Card */}
          <Card className="p-6 sm:p-8 border-2">
              <div className="space-y-6">
                {/* Google Signup */}
                <Button
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                variant="outline"
                size="lg"
                className="w-full rounded-full border-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Googleで登録
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">または</span>
                </div>
              </div>

              {/* Email/Password Signup */}
              <form onSubmit={handleEmailSignup} className="space-y-4">
                {/* Avatar Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>アカウントアイコンを選択</span>
                  </div>
                  <AvatarSelector
                    value={selectedAvatar}
                    onChange={setSelectedAvatar}
                  />
                </div>

                {/* Name Input */}
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

                {/* Email Input */}
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

                {/* Password Input */}
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

                {/* Confirm Password Input */}
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

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Terms */}
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

                {/* Signup Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full rounded-full"
                >
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
          </Card>

          {/* Login Link */}
          <Card className="p-4 border-2 text-center">
            <p className="text-sm text-muted-foreground">
              すでにアカウントをお持ちの方は
              <Link href="/login" className="text-primary hover:underline ml-1">
                ログイン
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
