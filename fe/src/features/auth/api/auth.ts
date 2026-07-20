import { getJson, postJson } from "@/shared/api/http";

export type SignInRequest = {
  username: string;
  password: string;
};

export type SignUpRequest = {
  name: string;
  birthDate: string;
  username: string;
  password: string;
  email: string;
};

export type UserResponse = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export function signIn(request: SignInRequest) {
  return postJson<UserResponse, SignInRequest>("/users/sign-in", request);
}

export function refreshSession() {
  return postJson<UserResponse>("/users/token/refresh");
}

export function signOut() {
  return postJson<null>("/users/sign-out");
}

export function signUp(request: SignUpRequest) {
  return postJson<null, SignUpRequest>("/users/sign-up", request);
}

export async function isUsernameAvailable(username: string) {
  const response = await getJson<boolean>(
    `/users/id/check?id=${encodeURIComponent(username)}`
  );

  return response.data === true;
}

export async function isEmailAvailable(email: string) {
  const response = await getJson<boolean>(
    `/users/email/check?email=${encodeURIComponent(email)}`
  );

  return response.data === true;
}
