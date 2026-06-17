import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/markdown";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function MarkdownPage({
  params,
}: {
  params: Promise<{ section: string; slug: string[] }>;
}) {
  const { section, slug } = await params;
  
  if (!["notes", "tutorial", "misc"].includes(section)) {
    notFound();
  }

  const post = getPostBySlug(section, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href={`/${section}`} className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {section}
      </Link>
      <article className="prose prose-invert prose-xl max-w-none prose-headings:font-bold prose-headings:mt-16 prose-headings:mb-8 prose-p:leading-loose prose-p:my-8 prose-p:text-zinc-300 prose-p:tracking-wide prose-li:my-4 prose-li:leading-loose prose-li:text-zinc-300 prose-img:my-10 prose-hr:my-16 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/10 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-a:text-blue-400 hover:prose-a:text-blue-300">
        <Markdown 
          rehypePlugins={[rehypeRaw, rehypeSlug]}
          components={{
            img: ({node, ...props}) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="rounded-xl border border-white/10" {...props} alt={props.alt || ''} />
            )
          }}
        >
          {post.content}
        </Markdown>
      </article>
    </div>
  );
}
