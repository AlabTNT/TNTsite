import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function Friends() {
  const friends = [
    { name: "TonyCrane", url: "https://tonycrane.cc/", desc: "“这是我翔哥，也可以是我爹”", avatar: "https://github.com/TonyCrane.png" },
    { name: "5dbwat4", url: "https://5dbwat4.top/", desc: "“ZJU-live-better YYDS!”", avatar: "https://github.com/5dbwat4.png" },
    { name: "Xecades", url: "https://xecades.xyz/", desc: "“Why not Xecades?”", avatar: "https://github.com/Xecades.png" },
    { name: "jayi0908", url: "https://note.jayi0908.cn/", desc: "“Ciallo～(∠・ω< )★”", avatar: "https://github.com/jayi0908.png" },
    { name: "NoPhskaHere", url: "https://phska.cn/", desc: "“令狐梦秧の小窝”", avatar: "https://github.com/Linghumy.png" },
    { name: "Maker", url: "https://makertechno.github.io/main.html", desc: "“🐴克儿今天又在捣鼓什么”", avatar: "https://github.com/Makertechno.png" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-start px-8 md:px-24 relative overflow-hidden bg-[#0a0a0a]">
      {/* Red lantern frosted glass effect */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full bg-[#C23D1A]/20 blur-[120px] md:blur-[180px] pointer-events-none max-md:top-auto max-md:bottom-[-20%] max-md:right-1/2 max-md:translate-x-1/2 max-md:translate-y-0" />

      <div className="z-10 w-full max-w-4xl pt-24 pb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">My Friends</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <a 
              key={friend.name}
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-[#C23D1A]/20 hover:border-[#C23D1A]/50 transition-all backdrop-blur-sm flex flex-col justify-between h-40 relative overflow-hidden"
            >
              <div className="flex justify-between items-start z-10">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-white group-hover:text-[#C23D1A] transition-colors flex items-center gap-2">
                    {friend.name}
                    <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-zinc-400 mt-2 text-sm">{friend.desc}</p>
                </div>
                {friend.avatar && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={friend.avatar} 
                    alt={friend.name} 
                    className="w-12 h-12 rounded-full border-2 border-white/10 group-hover:border-[#C23D1A]/50 transition-colors shadow-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
              <div className="text-zinc-500 text-xs mt-4 truncate z-10">{friend.url}</div>
              
              {/* Background decorative avatar */}
              {friend.avatar && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={friend.avatar} 
                  alt="" 
                  className="absolute -bottom-4 -right-4 w-32 h-32 opacity-[0.03] group-hover:opacity-10 rounded-full transition-opacity pointer-events-none grayscale"
                />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
