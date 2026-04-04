'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Blog {
  id: number
  title: string
  slug: string
  is_published: boolean
  is_featured: boolean
  views: number
  created_at: string
  published_at: string | null
  category: { id: number; name: string } | null
  author: { id: number; fullname: string } | null
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchBlogs = async () => {
    const res = await fetch('/api/admin/blogs')
    const data = await res.json()
    setBlogs(data.blogs || [])
    setLoading(false)
  }

  useEffect(() => { fetchBlogs() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return
    setDeleteId(id)
    await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
    await fetchBlogs()
    setDeleteId(null)
  }

  const togglePublish = async (id: number, isPublished: boolean) => {
    await fetch(`/api/admin/blogs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !isPublished }),
    })
    fetchBlogs()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">📝 Blog Management</h1>
          <p className="text-slate-500 text-sm mt-1">{blogs.length} total posts</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-105 transition-all"
        >
          + New Blog Post
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left p-4 font-semibold text-slate-600">Title</th>
                <th className="text-left p-4 font-semibold text-slate-600">Category</th>
                <th className="text-left p-4 font-semibold text-slate-600">Author</th>
                <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                <th className="text-left p-4 font-semibold text-slate-600">Views</th>
                <th className="text-right p-4 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td colSpan={6} className="p-4"><div className="h-6 bg-slate-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : blogs.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">
                  <span className="text-4xl block mb-2">📝</span>No blog posts yet. Create your first one!
                </td></tr>
              ) : (
                blogs.map(blog => (
                  <motion.tr key={blog.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-medium text-navy">{blog.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">/blogs/{blog.slug}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                        {blog.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{blog.author?.fullname || 'Unknown'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        blog.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {blog.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{blog.views}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePublish(blog.id, blog.is_published)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          {blog.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          disabled={deleteId === blog.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer disabled:opacity-50"
                        >
                          {deleteId === blog.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
