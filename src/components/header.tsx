// src/components/header.tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 text-sm tracking-widest">SEEDI</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/charts" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Charts
          </Link>
          <Link href="/features" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Features
          </Link>
          <Link href="/multi-country" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Countries
          </Link>
          <Link href="/gap" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Gap
          </Link>
          <Link href="/validate" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Validate
          </Link>
          <Link href="/tracker" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Tracker
          </Link>
          <Link href="/favorites" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Favorites
          </Link>
        </nav>
      </div>
    </header>
  );
}
