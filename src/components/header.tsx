// src/components/header.tsx
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span>ASO Analyzer</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/charts" className="hover:text-gray-900 transition-colors">
            Charts
          </Link>
          <Link href="/tracker" className="hover:text-gray-900 transition-colors">
            Tracker
          </Link>
          <Link href="/favorites" className="hover:text-gray-900 transition-colors">
            Favorites
          </Link>
        </nav>
      </div>
    </header>
  );
}
