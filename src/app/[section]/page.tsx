import { notFound } from "next/navigation";
import { getAllPosts } from "@/lib/content";
import Link from "next/link";
import { Book, FileText } from "lucide-react";

export default async function SectionIndex({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  
  if (!["notes", "tutorial", "misc"].includes(section)) {
    notFound();
  }

  const posts = getAllPosts(section);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 capitalize">{section}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => {
          const href = `/${section}/${post.slug.join('/')}`;
          const title = post.frontmatter.title || post.slug[post.slug.length - 1];
          return (
            <Link key={href} href={href} className="group flex items-start p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <FileText className="w-6 h-6 text-zinc-400 mr-4 mt-1 group-hover:text-blue-400 transition-colors" />
              <div>
                <h2 className="text-lg font-semibold mb-1 group-hover:text-blue-400 transition-colors">{title}</h2>
                {post.frontmatter.description && (
                  <p className="text-sm text-zinc-400 line-clamp-2">{post.frontmatter.description}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
