import type { Metadata } from "next";
import "./globals.css";
import { getServerCurrentUser } from "@/features/auth/api/server-auth";
import { AuthSessionProvider } from "@/features/auth/model/auth-session";
import { AppHeader } from "@/shared/ui/AppHeader";

export const metadata: Metadata = {
  title: "Team Manager",
  description: "축구 팀 회원, 경기 일정, 경기 기록, 회비 관리를 위한 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getServerCurrentUser();

  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider initialUser={initialUser}>
          <AppHeader />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
