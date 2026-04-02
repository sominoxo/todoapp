"use client";

import { useState, useRef, useEffect } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "todos-v1";

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const doneCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <main className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-stone-800">
            ToDoリスト
          </h1>
          {totalCount > 0 && (
            <p className="mt-1 text-sm text-stone-400">
              {doneCount} / {totalCount} 件完了
            </p>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && addTodo()}
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
                onClick={() => toggleTodo(todo.id)}
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
                  <path
                    strokeLinecap="round"
                    d="M4 4l8 8M12 4l-8 8"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {/* Clear done */}
        {doneCount > 0 && (
          <button
            onClick={() => setTodos((prev) => prev.filter((t) => !t.completed))}
            className="mt-6 text-xs text-stone-300 hover:text-red-400 transition"
          >
            完了済みをすべて削除
          </button>
        )}
      </div>
    </main>
  );
}
