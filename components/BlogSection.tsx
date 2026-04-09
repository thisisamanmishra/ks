'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Blog {
  id: number
  title: string
  slug: string
  excerpt: string
  is_featured: boolean
  views: number
  created_at: string
  published_at: string | null
  category: { id: number; name: string; slug: string } | null
  author: { id: number; fullname: string } | null
}

export default function BlogSection() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/blogs?public=true')
      .then(r => r.json())
      .then(d => setBlogs((d.blogs || []).slice(0, 6)))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && blogs.length === 0) return null

  const featured = blogs.find(b => b.is_featured) || blogs[0]
  const rest = blogs.filter(b => b.id !== featured?.id).slice(0, 4)

  return (
    <section id="blog" className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-navy/5 text-navy text-sm font-semibold mb-4">Blog</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Insights &amp; Resources</h2>
            <p className="mt-4 text-slate-500">Expert tips, tutorials, and industry insights to help you succeed.</p>
          </div>
          <Link href="/blogs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-navy text-navy hover:bg-navy hover:text-white transition-all whitespace-nowrap">
            View All Blogs →
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl animate-pulse" />
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featured && (
              <Link href={`/blogs/${featured.slug}`} className="lg:col-span-2 lg:row-span-2">
                <motion.article
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="h-full bg-navy rounded-2xl p-8 lg:p-10 text-white flex flex-col justify-end relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy/80 to-transparent" />
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-accent text-white text-xs font-bold mb-4">{featured.category?.name || 'Featured'}</span>
                    <h3 className="text-2xl lg:text-3xl font-bold mb-3 font-heading group-hover:text-accent transition-colors">{featured.title}</h3>
                    <p className="text-white/70 mb-4 line-clamp-2">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-white/50 text-sm">
                      <span>{new Date(featured.published_at || featured.created_at).toLocaleDateString('en-IN')}</span>
                      <span>•</span>
                      <span>{featured.views} views</span>
                    </div>
                  </div>
                </motion.article>
              </Link>
            )}
            {rest.map((post, i) => (
              <Link key={post.id} href={`/blogs/${post.slug}`}>
                <motion.article
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-6 hover:shadow-lg border border-slate-100 transition-all duration-300 cursor-pointer group h-full"
                >
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">{post.category?.name || 'Article'}</span>
                  <h3 className="font-bold text-navy mt-2 mb-2 font-heading group-hover:text-accent transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN')}</span>
                    <span>•</span>
                    <span>{post.views} views</span>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
