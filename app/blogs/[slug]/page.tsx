'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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

export default function BlogDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/blogs/${slug}`)
      .then(r => r.json())
      .then(d => { setBlog(d.blog || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-navy/20 border-t-accent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  if (!blog) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center text-center">
          <span className="text-5xl mb-4">📝</span>
          <h1 className="text-2xl font-bold text-navy font-heading mb-2">Blog Not Found</h1>
          <p className="text-slate-500">The article you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-20 bg-surface min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img src={blog.featured_image} alt={blog.title} className="w-full h-auto object-cover" />
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
          </motion.div>
        </article>
      </main>
      <Footer />
    </>
  )
}
