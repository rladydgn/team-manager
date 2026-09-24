"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { canAccessTeam, getPageAccess, isPageAccessFailure } from "@/features/auth/model/page-access";
import { getTeam } from "@/features/team/api/team";
import { getMatch } from "@/features/match/api/match";
import { getMyInquiry } from "@/features/inquiry/api/inquiry";
import { ApiRequestError } from "@/shared/api/http";
import { subscribeToAccessFailures } from "@/shared/api/access-failures";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";

function LoadingAccess() {
  return <main className="flex-1 px-5 py-20 text-center text-sm text-[#64748b]" role="status">페이지를 확인하고 있습니다.</main>;
}

export function PageAccessBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isSessionReady } = useAuthSession();
  const access = getPageAccess(pathname);
  if (access.kind === "public") return children;
  if (access.kind === "missing") return <NotFoundPage />;
  if (!isSessionReady) return <LoadingAccess />;
  if (!currentUser && !(access.kind === "team" && access.permission === "public")) return <NotFoundPage />;
  return <CheckedPage key={`${pathname}:${currentUser?.id ?? "anonymous"}`} pathname={pathname} userId={currentUser?.id ?? null}>{children}</CheckedPage>;
}

function CheckedPage({ children, pathname, userId }: { children: ReactNode; pathname: string; userId: number | null }) {
  const [state, setState] = useState<"loading" | "allowed" | "missing" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAccessFailures(() => setState("missing"));
    async function check() {
      const access = getPageAccess(pathname);
      let allowed = true;
      try {
        if (access.kind === "team" || access.kind === "match") {
          const teamId = access.kind === "team" ? access.id : (await getMatch(access.id)).data?.teamId;
          if (!teamId) throw new ApiRequestError("", 404);
          const { data } = await getTeam(teamId);
          allowed = Boolean(data && (access.permission === "public" ||
            (userId !== null && canAccessTeam(data.members, userId, access.permission))));
        } else if (access.kind === "inquiry") {
          allowed = Boolean((await getMyInquiry(access.id)).data);
        }
        if (active) setState(allowed ? "allowed" : "missing");
      } catch (error) {
        if (active) setState(error instanceof ApiRequestError && isPageAccessFailure(error.status) ? "missing" : "error");
      }
    }
    void check();
    return () => { active = false; unsubscribe(); };
  }, [pathname, userId, attempt]);

  if (state === "missing") return <NotFoundPage />;
  if (state === "loading") return <LoadingAccess />;
  if (state === "error") return (
    <main className="flex-1 px-5 py-20 text-center">
      <p className="text-sm text-[#64748b]">페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button type="button" onClick={() => { setState("loading"); setAttempt((value) => value + 1); }} className="mt-5 min-h-11 rounded-md border border-[#c8d4e6] px-5 text-sm font-semibold text-[#3d5b86]">다시 시도</button>
    </main>
  );
  return children;
}
