import { getYilulouPosts, getYilulouCategories } from "@/lib/content";
import Link from "next/link";
import { BookOpen, Clock, FolderOpen, ArrowRight } from "lucide-react";

export default async function YilulouPage() {
  const posts = getYilulouPosts();
  const categories = getYilulouCategories();

  const uncategorizedPosts = posts.filter(p => !p.category);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white/90 mb-4">
            一路楼
          </h1>
          <p className="text-lg text-zinc-400 font-light leading-relaxed max-w-xl mx-auto">
            Notes, thoughts, and writings — a personal archive of ideas and explorations.
          </p>
        </header>

        {categories.length > 0 && (
          <section className="mb-16">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-6">
              <FolderOpen className="w-4 h-4" />
              Categories
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <Link
                  key={cat.name}
                  href={`#cat-${cat.name}`}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-[#C23D1A]/20 hover:border-[#C23D1A]/30 hover:text-white transition-all duration-300"
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs text-zinc-500">{cat.count}</span>
                </Link>
              ))}
              {uncategorizedPosts.length > 0 && (
                <Link
                  href="#uncategorized"
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-[#C23D1A]/20 hover:border-[#C23D1A]/30 hover:text-white transition-all duration-300"
                >
                  General
                  <span className="ml-1.5 text-xs text-zinc-500">{uncategorizedPosts.length}</span>
                </Link>
              )}
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No posts yet. Write your first markdown in <code className="text-zinc-400 bg-white/5 px-2 py-0.5 rounded">content/yilulou/</code>.</p>
          </div>
        )}

        {Object.entries(
          posts.reduce((acc, post) => {
            const key = post.category || '__uncategorized';
            if (!acc[key]) acc[key] = [];
            acc[key].push(post);
            return acc;
          }, {} as Record<string, typeof posts>)
        ).map(([catKey, catPosts]) => (
          <section key={catKey} id={catKey === '__uncategorized' ? 'uncategorized' : `cat-${catKey}`} className="mb-16">
            {catKey !== '__uncategorized' && (
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-200 mb-6 pb-3 border-b border-white/5">
                <span>{catKey}</span>
                <span className="text-xs text-zinc-500 font-normal">({catPosts.length})</span>
              </h2>
            )}
            <div className="space-y-3">
              {catPosts.map(post => {
                const href = post.slug.length > 0
                  ? `/yilulou/${post.slug.join('/')}`
                  : `/yilulou`;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors mb-1 line-clamp-1">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                          {post.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {post.date && (
                        <span className="flex items-center gap-1 text-xs text-zinc-600">
                          <Clock className="w-3 h-3" />
                          {post.date}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
