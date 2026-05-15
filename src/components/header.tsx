// src/components/header.tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b-2 border-black bg-white">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="bg-black text-white px-2 py-0.5 text-sm tracking-widest">SEEDI</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold uppercase tracking-wider">
          <Link href="/charts" className="hover:underline underline-offset-4 decoration-2">
            Charts
          </Link>
          <Link href="/tracker" className="hover:underline underline-offset-4 decoration-2">
            Tracker
          </Link>
          <Link href="/favorites" className="hover:underline underline-offset-4 decoration-2">
            Favorites
          </Link>
        </nav>
      </div>
    </header>
  );
}
