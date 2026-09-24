"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { inquiryButtonClass } from "@/features/inquiry/ui/InquiryPresentation";

export default function InquiriesLayout({ children }: { children: ReactNode }) {
  const { currentUser } = useAuthSession();
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-10 lg:px-8">
        <nav aria-label="문의 메뉴" className="flex flex-wrap gap-2">
          <Link href="/inquiries/new" aria-current={pathname === "/inquiries/new" ? "page" : undefined} className={`${inquiryButtonClass} ${pathname === "/inquiries/new" ? "!bg-[#edf3fa]" : ""}`}>문의하기</Link>
          <Link href="/inquiries" aria-current={pathname === "/inquiries" ? "page" : undefined} className={`${inquiryButtonClass} ${pathname === "/inquiries" ? "!bg-[#edf3fa]" : ""}`}>내 문의</Link>
        </nav>
        <div key={currentUser?.id}>{children}</div>
      </div>
    </main>
  );
}
