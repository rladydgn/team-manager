import type { Metadata } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/features/auth/model/auth-session";

export const metadata: Metadata = {
  title: "Team Manager",
  description: "축구 팀 회원, 경기 일정, 경기 기록, 회비 관리를 위한 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
