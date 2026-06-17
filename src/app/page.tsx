import Link from "next/link";
import { Book, Users, Utensils, Box } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      {/* Red lantern frosted glass effect */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full bg-[#C23D1A]/30 blur-[120px] md:blur-[180px] pointer-events-none max-md:top-auto max-md:bottom-[-20%] max-md:right-1/2 max-md:translate-x-1/2 max-md:translate-y-0" />

      {/* Main Content (Shifted Right) */}
      <div className="z-10 w-full max-w-4xl pl-4 pr-8 md:pl-24 md:pr-12 mt-[-5%]">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight text-white/90">
          Hi there!
        </h1>
        <p className="text-lg md:text-2xl text-zinc-300 leading-relaxed font-light space-y-4">
          <span className="block mb-2">I&apos;m <strong className="font-semibold text-white">AlabTNT</strong>. Now in Chu Kouchen Honor College of Zhejiang University.</span>
          <span className="block mb-2">Feature in Python, Minecraft, Riichi Mahjong, Music, Japanese, Imaging Medicine and Trip.</span>
          <span className="block text-zinc-400 mt-8 mb-6">Look for my ...</span>
        </p>

        {/* Circular SVG Buttons */}
        <div className="flex flex-wrap gap-8 items-center mt-12">
          <Link href="https://github.com/AlabTNT" target="_blank" className="relative group flex items-center justify-center">
            {/* Tooltip */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-sky-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-sky-400/90 whitespace-nowrap">
              GitHub
            </div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-300">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </Link>

          <Link href="https://www.reasonable.org.cn" target="_blank" className="relative group flex items-center justify-center">
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-sky-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-sky-400/90 whitespace-nowrap">
              Reasonable Team
            </div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-300">
              <circle cx="12" cy="12" r="10"></circle>
              <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" fontWeight="bold" fontFamily="sans-serif">R</text>
            </svg>
          </Link>

          <Link href="/notes" className="relative group flex items-center justify-center">
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-sky-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-sky-400/90 whitespace-nowrap">
              Notebook
            </div>
            <Book className="w-8 h-8 text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
          </Link>

          <Link href="/tutorial" className="relative group flex items-center justify-center">
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-sky-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-sky-400/90 whitespace-nowrap">
              Mahjong Tutorial
            </div>
            <Box className="w-8 h-8 text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
          </Link>

          <Link href="http://eat.alabtnt.cn" target="_blank" className="relative group flex items-center justify-center">
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-sky-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-sky-400/90 whitespace-nowrap">
              SzhuEating
            </div>
            <Utensils className="w-8 h-8 text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
          </Link>

          <Link href="/friends" className="relative group flex items-center justify-center">
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 bg-sky-400/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-sky-400/90 whitespace-nowrap">
              Friends
            </div>
            <Users className="w-8 h-8 text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Overlapping Photos at Bottom Right */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 flex items-end justify-end pointer-events-none select-none z-10">
        <div className="relative w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl">
          {/* Left Tilted Photo */}
          <div className="absolute bottom-0 right-12 md:right-16 w-24 h-24 md:w-36 md:h-36 -rotate-[15deg] rounded-lg overflow-hidden border-4 border-white/20 shadow-xl bg-zinc-800 transition-transform duration-500 hover:rotate-0 hover:z-20 pointer-events-auto">
            <Image 
              src="/images/alabtnt.jpg" 
              alt="AlabTNT" 
              fill 
              className="object-cover" 
              sizes="(max-width: 768px) 96px, 144px"
            />
          </div>
          {/* Right Tilted Photo (Overlapping) */}
          <div className="absolute bottom-0 right-0 w-24 h-24 md:w-36 md:h-36 rotate-[10deg] rounded-lg overflow-hidden border-4 border-white/20 shadow-xl bg-zinc-800 z-10 transition-transform duration-500 hover:rotate-0 pointer-events-auto">
            <Image 
              src="/images/rainfall.jpg" 
              alt="Rainfall" 
              fill 
              className="object-cover" 
              sizes="(max-width: 768px) 96px, 144px"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 w-full text-center text-zinc-500 text-xs pointer-events-auto z-20 flex flex-col items-center justify-center space-y-1">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
          浙ICP备2025150796号-1
        </a>
        <p>Copyright©2026 @AlabTNT</p>
      </div>
    </div>
  );
}
