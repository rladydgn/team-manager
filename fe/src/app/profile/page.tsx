"use client";

import { useEffect, useState } from "react";
import {
  getKakaoLinkAuthorizeUrl,
  getProfile,
  type UserProfileResponse,
} from "@/features/auth/api/auth";
import { useAuthSession } from "@/features/auth/model/auth-session";

export default function ProfilePage() {
  const { currentUser, isSessionReady } = useAuthSession();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let isMounted = true;
    async function loadProfile() {
      try {
        const response = await getProfile();
        if (!isMounted) {
          return;
        }

        if (!response.data) {
          setErrorMessage("프로필 정보를 확인하지 못했습니다.");
          return;
        }

        setProfile(response.data);
        const query = new URLSearchParams(window.location.search);
        if (query.get("linked") === "kakao") {
          setNoticeMessage("카카오 계정이 연결되었습니다.");
        } else if (query.get("linkError") === "kakao") {
          setErrorMessage("카카오 계정을 연결하지 못했습니다. 이미 다른 계정에 연결됐는지 확인해 주세요.");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "프로필을 불러오지 못했습니다."
          );
        }
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUser, isSessionReady]);

  return (
    <main className="flex-1 bg-canvas px-5 py-8 text-ink sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-brand">내 계정</p>
          <h1 className="mt-2 text-3xl font-semibold">프로필</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            계정 정보와 연결된 로그인 수단을 확인할 수 있습니다.
          </p>
        </div>

        {noticeMessage ? (
          <p className="mb-5 rounded-lg border border-success-line bg-success-soft px-4 py-3 text-sm font-medium text-success">
            {noticeMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mb-5 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {errorMessage}
          </p>
        ) : null}

        {!profile && !errorMessage ? (
          <div className="rounded-xl border border-line bg-white p-6 text-sm text-muted">
            프로필을 불러오는 중입니다...
          </div>
        ) : null}

        {profile ? (
          <div className="grid gap-6">
            <section className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="border-b border-line bg-subtle px-5 py-4 sm:px-6">
                <h2 className="text-lg font-semibold">기본 정보</h2>
              </div>
              <dl className="divide-y divide-[#edf1f6] px-5 sm:px-6">
                <ProfileRow label="이름" value={profile.name} />
                <ProfileRow label="아이디" value={profile.username} fullValue />
                <ProfileRow label="생년월일" value={profile.birthDate ?? "등록되지 않음"} />
                <ProfileRow label="이메일" value={profile.email ?? "등록되지 않음"} />
              </dl>
            </section>

            <section className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="border-b border-line bg-subtle px-5 py-4 sm:px-6">
                <h2 className="text-lg font-semibold">로그인 연동</h2>
              </div>
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="font-semibold">카카오</p>
                  <p className="mt-1 text-sm text-muted">
                    {profile.kakaoLinked
                      ? "카카오 계정으로 로그인할 수 있습니다."
                      : "기존 계정에 카카오 로그인을 연결합니다."}
                  </p>
                </div>
                {profile.kakaoLinked ? (
                  <span className="inline-flex h-10 items-center justify-center rounded-lg border border-success-line bg-success-soft px-4 text-sm font-semibold text-success">
                    연동 완료
                  </span>
                ) : (
                  <a
                    href={getKakaoLinkAuthorizeUrl()}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-[#FEE500] px-5 text-sm font-semibold text-[rgba(0,0,0,0.85)] transition-colors hover:bg-[#f5dc00]"
                  >
                    카카오 연동하기
                  </a>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function ProfileRow({
  label,
  value,
  fullValue = false,
}: {
  label: string;
  value: string;
  fullValue?: boolean;
}) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className={`text-sm font-medium text-ink ${fullValue ? "break-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
