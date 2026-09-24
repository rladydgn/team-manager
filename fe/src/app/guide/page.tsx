import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "가이드 | Team Manager",
  description: "팀 가입 승인과 기존 비회원·용병 기록에 계정을 연결하는 방법을 안내합니다.",
};

const approvalSteps = [
  {
    title: "신청자 · 팀 가입 신청",
    description: "로그인 후 팀 목록에서 팀을 열고 ‘가입 신청’을 누릅니다. 서비스 회원가입과 팀 가입은 별도입니다.",
  },
  {
    title: "운영진 · 신청 확인",
    description: "팀 홈의 ‘가입 신청 관리’에서 신청자를 확인합니다. 이미 등록된 비회원·용병이라면 아래의 기존 기록 연결 절차를 따르세요.",
  },
  {
    title: "운영진 · 새 팀원으로 승인",
    description: "‘기존 기록 연결 (선택)’을 ‘새 팀원으로 승인’으로 두고 ‘승인’을 누릅니다. 선택 항목이 없으면 바로 승인하세요. 결과는 ‘팀원’ 메뉴에서 확인합니다.",
  },
];

const linkingSteps = [
  {
    title: "신청자 · 본인 계정으로 가입 신청",
    description: "로그인 후 팀 홈에서 ‘가입 신청’을 누릅니다. 미리 등록된 비회원·용병 기록은 계정에 자동 연결되지 않습니다.",
  },
  {
    title: "운영진 · 기존 기록 선택 후 승인",
    description: "‘가입 신청 관리’ → ‘기존 기록 연결 (선택)’에서 신청자의 비회원·용병 기록을 선택하고 ‘승인’을 누릅니다. 동명이인은 본인에게 확인하세요.",
  },
  {
    title: "운영진 · 연결 결과 확인",
    description: "‘팀원’ 메뉴에서 확인합니다. 기존 이름·역할·경기·회비 기록은 유지됩니다. 용병을 팀원으로 바꾸려면 팀장이 역할을 변경하세요.",
  },
];

function Steps({ items }: { items: { title: string; description: string }[] }) {
  return (
    <ol className="mt-5 space-y-5">
      {items.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3 sm:gap-4">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf3fa] text-sm font-bold text-[#3d5b86]">{index + 1}</span>
          <div className="min-w-0 pt-0.5">
            <h3 className="font-semibold text-[#1f2937]">{step.title}</h3>
            <p className="mt-1 break-words text-sm leading-6 text-[#52627b]">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-10 lg:px-8">
        <header>
          <p className="text-sm font-semibold text-[#4f6f9f]">Team Manager 이용 안내</p>
          <h1 className="mt-2 text-3xl font-bold text-[#0f172a] sm:text-4xl">가이드</h1>
          <p className="mt-3 text-sm leading-7 text-[#52627b]">팀 가입 승인과 기존 비회원·용병 기록 연결 방법입니다.</p>
          <p className="mt-3 rounded-lg border border-[#c8d4e6] bg-[#edf3fa] px-4 py-3 text-sm leading-6 text-[#3d5b86]">가입 신청은 본인이, 승인과 기록 연결은 운영진(팀장·부팀장)이 진행합니다.</p>
        </header>

        <nav aria-label="가이드 목차" className="grid gap-3 sm:grid-cols-2">
          <a href="#join-approval" className="rounded-lg border border-[#dbe4f0] bg-white p-5 transition-colors hover:border-[#4f6f9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f]">
            <span className="text-xs font-semibold text-[#64748b]">01 · 새 팀원 등록</span>
            <span className="mt-2 block font-bold text-[#1f2937]">팀원 가입 승인 →</span>
          </a>
          <a href="#link-existing-member" className="rounded-lg border border-[#dbe4f0] bg-white p-5 transition-colors hover:border-[#4f6f9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f]">
            <span className="text-xs font-semibold text-[#64748b]">02 · 기존 기록 유지</span>
            <span className="mt-2 block font-bold text-[#1f2937]">기존 기록에 계정 연결 →</span>
          </a>
        </nav>

        <section id="join-approval" aria-labelledby="join-approval-title" className="scroll-mt-24 rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 id="join-approval-title" className="text-xl font-bold text-[#0f172a]">팀원 가입 승인</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">팀에 처음 등록하는 사람을 새 팀원으로 승인하는 절차입니다.</p>
          <Steps items={approvalSteps} />
          <a href="#link-existing-member" className="mt-6 inline-flex min-h-10 items-center text-sm font-semibold text-[#3d5b86] underline underline-offset-4">이미 등록된 비회원·용병이라면? 기존 기록 연결 →</a>
        </section>

        <section id="link-existing-member" aria-labelledby="link-existing-title" className="scroll-mt-24 rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 id="link-existing-title" className="text-xl font-bold text-[#0f172a]">기존 기록에 계정 연결</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">비회원·용병으로 관리하던 기록에 본인 계정을 연결하는 절차입니다.</p>
          <Steps items={linkingSteps} />
          <aside className="mt-6 rounded-lg border border-[#c8d4e6] bg-[#f0f4fa] p-4 text-sm leading-6 text-[#3d5b86]">
            <h3 className="font-bold">승인 전에 연결 대상을 선택하세요</h3>
            <p className="mt-1">‘새 팀원으로 승인’하면 별도 등록됩니다. 승인 후에는 기록 병합이나 연결 해제·변경을 할 수 없으니, 승인 전에 대상을 확인하세요.</p>
          </aside>
        </section>

        <section aria-labelledby="guide-faq-title" className="rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 id="guide-faq-title" className="text-xl font-bold text-[#0f172a]">자주 묻는 질문</h2>
          <dl className="mt-5 space-y-5 text-sm leading-6">
            <div><dt className="font-semibold text-[#1f2937]">‘가입 신청 관리’가 보이지 않아요.</dt><dd className="mt-1 text-[#52627b]">해당 팀의 팀장·부팀장 계정으로 로그인했는지 확인하세요.</dd></div>
            <div><dt className="font-semibold text-[#1f2937]">‘기존 기록 연결 (선택)’이나 원하는 팀원이 보이지 않아요.</dt><dd className="mt-1 text-[#52627b]">현재 팀에서 활동 중이며 계정이 연결되지 않은 팀원만 표시됩니다. 대상이 없으면 선택 항목도 나타나지 않습니다.</dd></div>
            <div><dt className="font-semibold text-[#1f2937]">신청자가 대기 목록에 없어요.</dt><dd className="mt-1 text-[#52627b]">서비스 회원가입 후 팀에도 ‘가입 신청’을 했는지 확인하세요. 승인·거부된 신청은 대기 목록에서 사라집니다.</dd></div>
          </dl>
        </section>

        <section className="rounded-lg border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 className="text-lg font-bold text-[#0f172a]">가이드로 해결되지 않았나요?</h2>
          <p className="mt-2 text-sm leading-7 text-[#52627b]">로그인 후 서비스 운영자에게 비공개로 문의하세요.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/inquiries/new" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#435f88]">문의하기</Link>
            <Link href="/inquiries" className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#c8d4e6] px-4 py-2 text-sm font-semibold text-[#3d5b86] hover:bg-[#f0f4fa]">내 문의</Link>
          </div>
        </section>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-[#dbe4f0] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#52627b]">팀을 선택해 시작하세요.</p>
          <Link href="/team" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-[#4f6f9f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">팀 목록으로 이동</Link>
        </div>
      </div>
    </main>
  );
}
