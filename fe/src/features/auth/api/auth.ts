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

export function signIn(request: SignInRequest) {
  return postJson<UserResponse, SignInRequest>("/users/sign-in", request);
}

export function signUp(request: SignUpRequest) {
  return postJson<null, SignUpRequest>("/users/sign-up", request);
}
