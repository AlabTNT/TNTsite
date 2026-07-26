import { notFound } from "next/navigation";
import { getYilulouPostBySlug, getYilulouPosts } from "@/lib/content";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export default async function YilulouPostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const post = getYilulouPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getYilulouPosts();
  const currentIndex = allPosts.findIndex(p => p.slug.join('/') === slug.join('/'));
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/yilulou"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            一路楼
          </Link>

          {post.frontmatter.date && (
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Clock className="w-3.5 h-3.5" />
              {post.frontmatter.date}
            </span>
          )}
        </div>

        <article>
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white/90 mb-4 leading-tight">
              {post.frontmatter.title}
            </h1>
            {post.frontmatter.description && (
              <p className="text-lg text-zinc-400 font-light leading-relaxed">
                {post.frontmatter.description}
              </p>
            )}
          </header>

          <div
            className="prose prose-invert prose-zinc max-w-none
              prose-headings:text-white/90 prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-zinc-300 prose-p:leading-relaxed
              prose-a:text-[#C23D1A] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white/90
              prose-code:text-[#C23D1A] prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl
              prose-blockquote:border-l-[#C23D1A] prose-blockquote:text-zinc-400 prose-blockquote:bg-white/[0.02] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-img:rounded-xl
              prose-ul:text-zinc-300
              prose-ol:text-zinc-300
              prose-li:leading-relaxed
              prose-hr:border-white/5
              [&_table]:text-zinc-300 [&_th]:text-zinc-200 [&_td]:border-white/5
              [word-spacing:0.05em]
              tracking-[0.01em]
              text-[15px] md:text-base
              [&>*]:leading-[1.75]
              [&>p]:mb-5
              [&_h2+p]:mt-4
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <nav className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between gap-4">
          <div>
            {prevPost && (
              <Link
                href={prevPost.slug.length > 0 ? `/yilulou/${prevPost.slug.join('/')}` : '/yilulou'}
                className="group flex flex-col gap-0.5"
              >
                <span className="text-xs text-zinc-500">Previous</span>
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-1">
                  {prevPost.title}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {nextPost && (
              <Link
                href={nextPost.slug.length > 0 ? `/yilulou/${nextPost.slug.join('/')}` : '/yilulou'}
                className="group flex flex-col gap-0.5 items-end"
              >
                <span className="text-xs text-zinc-500">Next</span>
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-1">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
