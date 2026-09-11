import { getJson, postJson } from "@/shared/api/http";
import { API_BASE_URL } from "@/shared/config/api";

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
  email: string | null;
};

export type KakaoSignUpRequest = {
  username: string;
};

export type UserProfileResponse = {
  id: number;
  name: string;
  username: string;
  birthDate: string | null;
  email: string | null;
  kakaoLinked: boolean;
};

export function getKakaoAuthorizeUrl() {
  return `${API_BASE_URL}/oauth/kakao/authorize`;
}

export function getKakaoLinkAuthorizeUrl() {
  return `${API_BASE_URL}/oauth/kakao/link/authorize`;
}

export function getProfile() {
  return getJson<UserProfileResponse>("/users/profile");
}

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

export function completeKakaoSignUp(request: KakaoSignUpRequest) {
  return postJson<UserResponse, KakaoSignUpRequest>(
    "/oauth/kakao/register",
    request
  );
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
