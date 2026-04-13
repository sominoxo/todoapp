"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Todo } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // セッション確認 & 初回データ取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/auth");
        return;
      }
      setUserId(session.user.id);

      supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setTodos(data ?? []);
          setLoading(false);
        });
    });
  }, []);

  // 別タブでログアウトした場合にも追随
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // リアルタイム同期（他デバイスでの変更を即時反映）
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Todo>) => {
          if (payload.eventType === "INSERT") {
            setTodos((prev) => [payload.new as Todo, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            setTodos((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Todo).id ? (payload.new as Todo) : t
              )
            );
          }
          if (payload.eventType === "DELETE") {
            setTodos((prev) =>
              prev.filter((t) => t.id !== (payload.old as Todo).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addTodo = async () => {
    const text = input.trim();
    if (!text || !userId) return;
    setInput("");
    inputRef.current?.focus();
    const { data } = await supabase
      .from("todos")
      .insert({ text, completed: false, user_id: userId })
      .select()
      .single();
    if (data) {
      setTodos((prev) => [data as Todo, ...prev]);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { data } = await supabase
      .from("todos")
      .update({ completed: !completed })
      .eq("id", id)
      .select()
      .single();
    if (data) {
      setTodos((prev) => prev.map((t) => (t.id === id ? (data as Todo) : t)));
    }
  };

  const deleteTodo = async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = async () => {
    const ids = todos.filter((t) => t.completed).map((t) => t.id);
    if (ids.length === 0) return;
    await supabase.from("todos").delete().in("id", ids);
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const doneCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-stone-300">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-800">
              ToDoリスト
            </h1>
            {totalCount > 0 && (
              <p className="mt-1 text-sm text-stone-400">
                {doneCount} / {totalCount} 件完了
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 text-xs text-stone-300 hover:text-stone-500 transition"
          >
            ログアウト
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.nativeEvent.isComposing && addTodo()
            }
            placeholder="新しいタスクを入力..."
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder-stone-300 shadow-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="rounded-xl bg-stone-800 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>

        {/* Filter tabs */}
        {totalCount > 0 && (
          <div className="flex gap-1 mb-4 rounded-xl bg-stone-100 p-1">
            {(["all", "active", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                  filter === f
                    ? "bg-white text-stone-800 shadow-sm"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了"}
              </button>
            ))}
          </div>
        )}

        {/* Todo list */}
        <ul className="space-y-2">
          {filtered.length === 0 && (
            <li className="py-12 text-center text-sm text-stone-300">
              {totalCount === 0
                ? "タスクがありません"
                : filter === "active"
                ? "未完了のタスクはありません"
                : "完了したタスクはありません"}
            </li>
          )}
          {filtered.map((todo) => (
            <li
              key={todo.id}
              className={`group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition ${
                todo.completed ? "border-stone-100" : "border-stone-200"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className={`flex-shrink-0 h-5 w-5 rounded-full border-2 transition flex items-center justify-center ${
                  todo.completed
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-stone-300 hover:border-stone-400"
                }`}
                aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
              >
                {todo.completed && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 10 10"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1.5 5l2.5 2.5 4.5-4.5"
                    />
                  </svg>
                )}
              </button>

              {/* Text */}
              <span
                className={`flex-1 text-sm leading-relaxed transition ${
                  todo.completed
                    ? "line-through text-stone-300"
                    : "text-stone-700"
                }`}
              >
                {todo.text}
              </span>

              {/* Delete */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-stone-300 hover:text-red-400 transition"
                aria-label="削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 16 16"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {/* Clear completed */}
        {doneCount > 0 && (
          <button
            onClick={clearCompleted}
            className="mt-6 text-xs text-stone-300 hover:text-red-400 transition"
          >
            完了済みをすべて削除
          </button>
        )}
      </div>
    </main>
  );
}
