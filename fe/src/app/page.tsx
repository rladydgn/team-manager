import Link from "next/link";

const featureItems = [
  {
    title: "팀원 관리",
    description: "팀원 정보와 역할, 활동 상태를 한 곳에서 관리합니다.",
  },
  {
    title: "일정 관리",
    description: "다가오는 경기와 모임 일정을 관리 합니다.",
  },
  {
    title: "경기 기록",
    description: "스코어와 참여 인원, 기록을 남겨 돌아봅니다.",
  },
  {
    title: "회비 관리",
    description: "납부 현황과 미납 항목을 빠르게 확인합니다.",
  },
];

const matchRows = [
  { label: "다음 경기", value: "토요일 19:00", sub: "서울 풋살파크 A구장" },
  { label: "참석 응답", value: "12 / 18명", sub: "마감까지 2일" },
  { label: "이번 달 회비", value: "83%", sub: "15명 납부 완료" },
];

const memberRows = [
  { name: "김민준", status: "참석", fee: "납부" },
  { name: "이서준", status: "미응답", fee: "납부" },
  { name: "박도윤", status: "참석", fee: "미납" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
              TM
            </span>
            <span className="truncate text-base font-semibold tracking-normal">
              Team Manager
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#64748b] md:flex">
            <a href="#features">기능</a>
            <a href="#preview">운영 흐름</a>
            <a href="#start">시작하기</a>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] shadow-sm transition-colors hover:bg-[#f0f4fa]"
          >
            로그인
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="mb-4 w-fit rounded-md border border-[#c8d4e6] bg-white px-3 py-1 text-sm font-semibold text-[#4f6f9f]">
              팀 운영과 기록을 한 곳에서
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-[#0f172a] sm:text-5xl lg:text-6xl">
              팀 운영은 가볍게, 지난 기록은 또렷하게.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#64748b] sm:text-lg">
              Team Manager는 팀원, 일정, 참석 여부, 회비처럼 매주 챙겨야 하는
              운영 업무를 정리하고 경기 결과와 메모를 기록으로 남길 수 있게
              돕습니다.
            </p>

            <div
              id="start"
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f6f9f] px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#435f88]"
              >
                팀 운영 시작하기
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-6 text-base font-semibold text-[#111827] transition-colors hover:bg-[#f1f5f9]"
              >
                새 계정 만들기
              </Link>
            </div>
          </div>

          <div
            id="preview"
            className="flex h-full flex-col rounded-lg border border-[#dbe4f0] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5"
          >
            <div className="rounded-md border border-[#d7dfeb] bg-[#f3f6fb] p-4 text-[#172033] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#4f6f9f]">
                    이번 주 운영 현황
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">우리 FC</h2>
                </div>
                <span className="rounded-md border border-[#c8d4e6] bg-white px-3 py-1 text-sm font-semibold text-[#3d5b86]">
                  OWNER
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
                {["팀원 18명", "경기 2건", "기록 14개", "회비 83%"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-md border border-[#d5deeb] bg-white px-3 py-3 font-semibold text-[#25324a]"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {matchRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-md border border-[#e5eaf3] bg-[#f8fafc] p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-[#64748b]">
                      {row.label}
                    </p>
                    <p className="text-base font-bold text-[#111827]">
                      {row.value}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#64748b]">
                    {row.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid flex-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-md border border-[#e5eaf3] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#111827]">
                    참석과 회비
                  </h3>
                  <span className="text-xs font-semibold text-[#4f6f9f]">
                    최근 업데이트
                  </span>
                </div>
                <div className="mt-4 grid gap-2">
                  {memberRows.map((member) => (
                    <div
                      key={member.name}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md bg-[#f8fafc] px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-[#1f2937]">
                        {member.name}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#475569]">
                        {member.status}
                      </span>
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#475569]">
                        {member.fee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-[#e5eaf3] bg-[#f8fafc] p-4">
                <h3 className="text-sm font-bold text-[#111827]">경기 기록</h3>
                <div className="mt-4 rounded-md bg-white p-4">
                  <p className="text-xs font-semibold text-[#64748b]">
                    지난 경기
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#111827]">
                    3 : 2
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">
                    후반 추가 득점으로 승리. 다음 경기 전 수비 라인 조정 필요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-[#dbe4f0] bg-white px-5 py-8 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-[#e5eaf3] bg-white p-5"
              >
                <h2 className="text-lg font-bold text-[#111827]">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
