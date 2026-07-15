import { API_BASE_URL } from "@/shared/config/api";
import { getAccessToken } from "@/shared/auth/access-token";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
};

type ApiErrorResponse = {
  status?: number;
  code?: string;
  message?: string;
};

async function resolveResponse<TResponse>(
  response: Response
): Promise<ApiResponse<TResponse>> {
  if (!response.ok) {
    let errorMessage = "요청을 처리하지 못했습니다.";

    try {
      const errorBody = (await response.json()) as ApiErrorResponse;
      errorMessage = errorBody.message ?? errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<ApiResponse<TResponse>>;
}

function createHeaders(includeJsonContentType = false) {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export async function getJson<TResponse>(
  path: string
): Promise<ApiResponse<TResponse>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: createHeaders(),
    credentials: "include",
  });

  return resolveResponse<TResponse>(response);
}

export async function postJson<TResponse, TBody = undefined>(
  path: string,
  body?: TBody
): Promise<ApiResponse<TResponse>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: createHeaders(body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
  });

  return resolveResponse<TResponse>(response);
}
