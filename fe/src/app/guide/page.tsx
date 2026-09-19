import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "가이드 | Team Manager",
  description: "팀원 가입 승인과 기존 비회원 팀원의 계정 연동 방법을 안내합니다.",
};

const approvalSteps = [
  {
    title: "신청자가 로그인 후 가입 신청",
    description: "신청자는 서비스 계정을 만든 뒤 로그인합니다. 팀 목록에서 가입할 팀을 열고, 팀 홈의 ‘가입 신청’을 누릅니다. 서비스 회원가입과 팀 가입은 별도 절차이며, 팀 가입은 운영진의 승인이 필요합니다.",
  },
  {
    title: "운영진이 가입 신청 관리 열기",
    description: "운영진은 해당 팀 홈에서 ‘가입 신청 관리’를 누릅니다. 대기 목록에서 신청자의 이름과 신청 시각을 확인합니다.",
  },
  {
    title: "기존 팀원 기록이 있는지 확인 후 승인",
    description: "처음 등록하는 사람이라면 ‘기존 기록 연결 (선택)’을 ‘새 팀원으로 승인’으로 두고 ‘승인’을 누릅니다. 연결할 비회원 팀원이 없으면 선택 항목 없이 ‘승인’ 버튼만으로 처리할 수 있습니다. 이미 비회원으로 등록한 사람이라면 아래의 연동 절차를 따라 주세요.",
  },
  {
    title: "팀원 목록에서 확인",
    description: "승인된 신청은 대기 목록에서 사라집니다. ‘팀원’ 메뉴에서 추가된 팀원을 확인하세요. 가입을 허용하지 않을 신청은 ‘거부’로 처리할 수 있습니다.",
  },
];

const linkingSteps = [
  {
    title: "기존 비회원 팀원 확인",
    description: "‘팀원’ 메뉴에서 연동할 사람의 기존 기록을 확인합니다. 이미 등록되어 있다면 같은 사람을 다시 추가하지 마세요. 아직 기록이 없다면 ‘용병·비회원 이름’을 입력하고, ‘구분’에서 ‘비회원 팀원’을 선택한 뒤 ‘팀원 추가’를 누르면 계정 없이 먼저 관리할 수 있습니다.",
  },
  {
    title: "본인 계정으로 팀 가입 신청",
    description: "해당 팀원이 서비스에 가입하고 로그인한 뒤, 팀 홈에서 ‘가입 신청’을 누릅니다. 비회원 이름을 미리 등록한 것만으로는 계정이 자동 연결되지 않습니다.",
  },
  {
    title: "신청자와 연결할 기존 팀원 선택",
    description: "운영진이 팀 홈의 ‘가입 신청 관리’를 엽니다. 해당 신청자의 ‘기존 기록 연결 (선택)’에서 같은 사람의 비회원 팀원 또는 계정이 연결되지 않은 용병을 선택합니다. 동명이인이 있다면 신청자에게 직접 확인한 뒤 선택하세요.",
  },
  {
    title: "선택한 상태로 승인",
    description: "대상을 선택한 상태에서 ‘승인’을 누릅니다. 기존 팀원 기록에 신청자의 계정이 연결되고, ‘기존 팀원 기록에 연결했습니다’라는 안내가 표시됩니다. 선택만 하고 승인하지 않으면 연동되지 않습니다.",
  },
  {
    title: "기존 기록과 역할 확인",
    description: "‘팀원’ 메뉴에서 연결된 팀원을 확인하세요. 기존 이름, 역할, 경기 기록과 회비 기록은 유지됩니다. 용병 기록을 연결한 경우 역할도 용병으로 유지되며, 역할 변경이 필요하면 팀장이 팀원 목록에서 변경할 수 있습니다.",
  },
];

function Steps({ items }: { items: { title: string; description: string }[] }) {
  return (
    <ol className="mt-6 space-y-6">
      {items.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3 sm:gap-4">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf3fa] text-sm font-bold text-[#3d5b86]">{index + 1}</span>
          <div className="min-w-0 pt-0.5">
            <h3 className="font-semibold text-[#1f2937]">{step.title}</h3>
            <p className="mt-2 break-words text-sm leading-7 text-[#52627b]">{step.description}</p>
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
          <p className="mt-3 text-sm leading-7 text-[#52627b]">새 팀원의 가입을 승인하고, 비회원으로 관리하던 기록을 본인 계정에 연결하는 방법을 안내합니다.</p>
          <p className="mt-3 rounded-lg border border-[#c8d4e6] bg-[#edf3fa] px-4 py-3 text-sm leading-6 text-[#3d5b86]">가입 승인과 기존 기록 연동은 운영진이 진행합니다. 운영진은 팀장과 부팀장을 뜻합니다.</p>
        </header>

        <nav aria-label="가이드 목차" className="grid gap-3 sm:grid-cols-2">
          <a href="#join-approval" className="rounded-lg border border-[#dbe4f0] bg-white p-5 transition-colors hover:border-[#4f6f9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f]">
            <span className="text-xs font-semibold text-[#64748b]">01 · 새 팀원 등록</span>
            <span className="mt-2 block font-bold text-[#1f2937]">팀원 가입 승인 →</span>
          </a>
          <a href="#link-existing-member" className="rounded-lg border border-[#dbe4f0] bg-white p-5 transition-colors hover:border-[#4f6f9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f]">
            <span className="text-xs font-semibold text-[#64748b]">02 · 기존 기록 유지</span>
            <span className="mt-2 block font-bold text-[#1f2937]">비회원 팀원과 계정 연동 →</span>
          </a>
        </nav>

        <section id="join-approval" aria-labelledby="join-approval-title" className="scroll-mt-24 rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 id="join-approval-title" className="text-xl font-bold text-[#0f172a]">팀원 가입 승인</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">팀에 처음 등록하는 사람을 새 팀원으로 승인하는 절차입니다.</p>
          <Steps items={approvalSteps} />
          <a href="#link-existing-member" className="mt-6 inline-flex min-h-10 items-center text-sm font-semibold text-[#3d5b86] underline underline-offset-4">이미 비회원 팀원으로 등록한 사람인가요? 연동 방법 보기 →</a>
        </section>

        <section id="link-existing-member" aria-labelledby="link-existing-title" className="scroll-mt-24 rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 id="link-existing-title" className="text-xl font-bold text-[#0f172a]">기존 비회원 팀원과 계정 연동</h2>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">기존 경기·회비 기록을 이어서 사용할 사람은 가입 승인 시 기존 팀원을 선택하세요.</p>
          <Steps items={linkingSteps} />
          <aside className="mt-6 rounded-lg border border-[#c8d4e6] bg-[#f0f4fa] p-4 text-sm leading-7 text-[#3d5b86]">
            <h3 className="font-bold">승인 전에 연결 대상을 선택하세요</h3>
            <p className="mt-1">‘새 팀원으로 승인’을 선택하면 별도 팀원으로 등록됩니다. 현재는 승인 후 두 팀원의 기록을 합치거나, 연결을 해제·변경하는 기능이 제공되지 않습니다. 승인 전에 신청자와 기존 기록이 같은 사람인지 확인해 주세요.</p>
          </aside>
        </section>

        <section aria-labelledby="guide-faq-title" className="rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
          <h2 id="guide-faq-title" className="text-xl font-bold text-[#0f172a]">진행 중 막혔나요?</h2>
          <dl className="mt-5 space-y-5 text-sm leading-7">
            <div><dt className="font-semibold text-[#1f2937]">‘가입 신청 관리’가 보이지 않아요.</dt><dd className="mt-1 text-[#52627b]">해당 팀의 운영진 계정으로 로그인했는지 확인하세요. 신청자는 가입 신청을 할 수 있지만, 승인과 기존 기록 연동은 운영진만 할 수 있습니다.</dd></div>
            <div><dt className="font-semibold text-[#1f2937]">‘기존 기록 연결 (선택)’이나 원하는 팀원이 보이지 않아요.</dt><dd className="mt-1 text-[#52627b]">현재 팀에 소속되어 있고 계정이 연결되지 않은 팀원만 선택할 수 있습니다. 다른 팀의 팀원, 이미 계정이 연결된 팀원, 내보낸 팀원은 대상이 아닙니다. 연결 가능한 팀원이 없으면 선택 항목 자체가 표시되지 않습니다.</dd></div>
            <div><dt className="font-semibold text-[#1f2937]">신청자가 대기 목록에 없어요.</dt><dd className="mt-1 text-[#52627b]">서비스 회원가입 후 해당 팀에도 ‘가입 신청’을 했는지 확인하세요. 이미 승인되거나 거부된 신청은 대기 목록에 표시되지 않습니다.</dd></div>
          </dl>
        </section>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-[#dbe4f0] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#52627b]">준비되었다면 관리할 팀을 선택해 진행하세요.</p>
          <Link href="/team" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-[#4f6f9f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">팀 목록으로 이동</Link>
        </div>
      </div>
    </main>
  );
}
