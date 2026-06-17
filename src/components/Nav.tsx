"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

export default function Nav() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="fixed top-6 left-6 z-50">
      <Link 
        href="/" 
        className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-[#C23D1A]/80 text-white backdrop-blur-md transition-all border border-white/5 shadow-lg"
        title="Back to Home"
      >
        <Home className="w-5 h-5" />
      </Link>
    </nav>
  );
}
