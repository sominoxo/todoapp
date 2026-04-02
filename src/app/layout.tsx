import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToDoリスト",
  description: "シンプルなToDoアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        {/* Tailwind v4 browser CDN — replaced by PostCSS pipeline on Vercel build */}
        <script src="https://unpkg.com/@tailwindcss/browser@4" async />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
