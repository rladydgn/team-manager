import "server-only";

import { cookies } from "next/headers";
import type { CurrentUser } from "@/features/auth/model/auth-user";

const ACCESS_TOKEN_COOKIE_NAME = "team_manager_access_token";
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
};

export async function getServerCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME);

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/users/me`, {
      headers: {
        Cookie: `${accessToken.name}=${accessToken.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as ApiResponse<CurrentUser>;
    return body.data;
  } catch {
    return null;
  }
}
