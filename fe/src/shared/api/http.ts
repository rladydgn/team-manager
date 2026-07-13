import { API_BASE_URL } from "@/shared/config/api";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
};

type ApiErrorResponse = {
  status?: number;
  code?: string;
  message?: string;
};

export async function postJson<TResponse, TBody>(
  path: string,
  body: TBody
): Promise<ApiResponse<TResponse>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

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
