import { postJson } from "@/shared/api/http";

export type SignInRequest = {
  username: string;
  password: string;
};

export type SignUpRequest = {
  username: string;
  password: string;
  email?: string;
};

export type UserResponse = {
  id: number;
  username: string;
  email: string | null;
};

export type SignInResponse = UserResponse & {
  accessToken: string;
};

export function signIn(request: SignInRequest) {
  return postJson<SignInResponse, SignInRequest>("/users/sign-in", request);
}

export function refreshSession() {
  return postJson<SignInResponse>("/users/token/refresh");
}

export function signUp(request: SignUpRequest) {
  return postJson<null, SignUpRequest>("/users/sign-up", request);
}
