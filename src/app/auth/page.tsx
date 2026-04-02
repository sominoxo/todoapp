"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // メール確認リンク経由でここに来た場合、セッションを検知して / に遷移
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        router.replace("/");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(errorMessage(error.message));
      } else {
        setMessage(
          "確認メールを送信しました。メールボックスを確認してください。"
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(errorMessage(error.message));
      } else {
        router.replace("/");
      }
    }

    setLoading(false);
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
    setMessage(null);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-800">
            {mode === "login" ? "ログイン" : "アカウント登録"}
          </h1>
          <p className="mt-1 text-sm text-stone-400">ToDoリストにようこそ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 shadow-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（6文字以上）"
            required
            minLength={6}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 shadow-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-500">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-800 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? "処理中..."
              : mode === "login"
              ? "ログイン"
              : "登録する"}
          </button>
        </form>

        <button
          onClick={switchMode}
          className="mt-6 w-full text-center text-xs text-stone-400 hover:text-stone-600 transition"
        >
          {mode === "login"
            ? "アカウントをお持ちでない方 → 新規登録"
            : "すでにアカウントをお持ちの方 → ログイン"}
        </button>
      </div>
    </main>
  );
}

function errorMessage(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "メールアドレスまたはパスワードが正しくありません";
  if (msg.includes("User already registered"))
    return "このメールアドレスはすでに登録されています";
  if (msg.includes("Password should be at least"))
    return "パスワードは6文字以上で入力してください";
  if (msg.includes("Unable to validate email"))
    return "メールアドレスの形式が正しくありません";
  return msg;
}
