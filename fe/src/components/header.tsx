import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-green text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-lg font-bold">
        Team manager
      </Link>
      <div>
        <Link href="/members">회원</Link>
      </div>
    </header>
  );
}
