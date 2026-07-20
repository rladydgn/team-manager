import "server-only";

import type { Team } from "@/features/team/api/team";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
};

type ServerTeamsResult = {
  teams: Team[];
  errorMessage: string | null;
};

export async function getServerTeams(): Promise<ServerTeamsResult> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/teams`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        teams: [],
        errorMessage: "팀 목록을 불러오지 못했습니다.",
      };
    }

    const body = (await response.json()) as ApiResponse<Team[]>;

    return {
      teams: body.data ?? [],
      errorMessage: null,
    };
  } catch {
    return {
      teams: [],
      errorMessage: "팀 목록을 불러오지 못했습니다.",
    };
  }
}
