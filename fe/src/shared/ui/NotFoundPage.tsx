import Link from "next/link";

export function NotFoundPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-5 py-20 text-center">
      <title>404 | Team Manager</title>
      <meta name="robots" content="noindex" />
      <section className="w-full max-w-lg rounded-2xl border border-line bg-white px-6 py-12 sm:px-10">
        <p className="text-5xl font-semibold text-brand">404</p>
        <h1 className="mt-5 text-xl font-semibold text-ink">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm leading-6 text-muted">요청하신 페이지를 확인할 수 없습니다.</p>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-ink">홈으로 이동</Link>
      </section>
    </main>
  );
}
