'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'

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

interface Category {
  id: number
  name: string
  slug: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/blogs?public=true').then(r => r.json()),
      fetch('/api/blogs/categories').then(r => r.json()),
    ]).then(([blogData, catData]) => {
      setBlogs(blogData.blogs || [])
      setCategories(catData.categories || [])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let result = blogs
    if (activeCategory !== 'All') result = result.filter(b => b.category?.name === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.excerpt?.toLowerCase().includes(q))
    }
    return result
  }, [blogs, activeCategory, search])

  const featured = filtered.find(b => b.is_featured)
  const rest = filtered.filter(b => !b.is_featured)

  return (
    <>
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-20 bg-surface min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Blog & Resources</h1>
            <p className="mt-3 text-slate-500">Insights, guides, and tips from our team of experts.</p>
          </motion.div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input type="text" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 text-sm shadow-sm" />
            <div className="flex flex-wrap gap-2">
              {['All', ...categories.map(c => c.name)].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    activeCategory === cat ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-navy/5'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Link href={`/blogs/${featured.slug}`}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-10 bg-gradient-to-br from-navy to-navy-dark rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                    <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-4">FEATURED</span>
                    <h2 className="text-2xl lg:text-4xl font-bold font-heading mb-3">{featured.title}</h2>
                    <p className="text-white/60 max-w-2xl mb-4">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-white/40 text-sm">
                      <span>{new Date(featured.published_at || featured.created_at).toLocaleDateString('en-IN')}</span>
                      <span>•</span>
                      <span>{featured.views} views</span>
                      {featured.category && <><span>•</span><span className="text-accent">{featured.category.name}</span></>}
                    </div>
                  </motion.div>
                </Link>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((b, i) => (
                  <Link key={b.id} href={`/blogs/${b.slug}`}>
                    <motion.article initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold mb-3">
                        {b.category?.name || 'Uncategorized'}
                      </span>
                      <h3 className="font-bold text-navy text-lg mb-2 font-heading group-hover:text-accent transition-colors">{b.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">{b.excerpt}</p>
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>{new Date(b.published_at || b.created_at).toLocaleDateString('en-IN')}</span>
                        <span>{b.views} views</span>
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <span className="text-4xl block mb-3">📝</span>
                  <p>No articles found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}
