import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5" />
          <span>Case Study Companion</span>
        </Link>
      </div>
    </header>
  );
}
