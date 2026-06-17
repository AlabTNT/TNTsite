import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AlabTNT Space",
  description: "A dynamic space for AlabTNT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`antialiased bg-[#0a0a0a] text-zinc-100 min-h-screen flex flex-col`}
        style={{ fontFamily: "'Fredoka', sans-serif" }}
      >
        <Nav />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
