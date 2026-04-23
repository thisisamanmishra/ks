import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'
import type { Metadata } from 'next'

// ISR: Revalidate every 30 minutes for blog content
export const revalidate = 1800

interface Blog {
  id: number
  title: string
  content: string
  excerpt: string
  tags: string[]
  views: number
  created_at: string
  published_at: string
  featured_image: string | null
  meta_title: string | null
  meta_description: string | null
  category: { id: number; name: string; slug: string } | null
  author: { id: number; fullname: string; avatar_url: string | null } | null
}

async function getBlog(slug: string): Promise<Blog | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blogs')
    .select('id, title, content, excerpt, tags, views, created_at, published_at, featured_image, meta_title, meta_description, category:blog_categories(id, name, slug), author:users!blogs_author_id_fkey(id, fullname, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  return data as Blog | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlog(slug)
  if (!blog) return { title: 'Blog Not Found' }
  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt,
    openGraph: {
      title: blog.meta_title || blog.title,
      description: blog.meta_description || blog.excerpt,
      images: blog.featured_image ? [blog.featured_image] : [],
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blog = await getBlog(slug)

  if (!blog) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-20 bg-surface min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            {/* Category */}
            {blog.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-4">
                {blog.category.name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl lg:text-5xl font-bold text-navy font-heading leading-tight mb-6">
              {blog.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-6 border-b border-slate-200">
              {blog.author && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                    {blog.author.fullname.charAt(0)}
                  </div>
                  <span className="font-medium text-navy">{blog.author.fullname}</span>
                </div>
              )}
              <span>•</span>
              <span>{new Date(blog.published_at || blog.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>{blog.views} views</span>
            </div>

            {/* Featured Image */}
            {blog.featured_image && (
              <div className="mb-8 rounded-2xl overflow-hidden relative aspect-video">
                <Image
                  src={blog.featured_image}
                  alt={blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none text-slate-700 leading-relaxed
                prose-headings:text-navy prose-headings:font-heading
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-strong:text-navy
                prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
