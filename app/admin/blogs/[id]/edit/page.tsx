'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false, loading: () => <div className="h-[400px] bg-slate-50 rounded-xl animate-pulse" /> })

interface Category {
  id: number
  name: string
  slug: string
}

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const blogId = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    tags: '',
    featured_image: '',
    is_published: false,
    is_featured: false,
    meta_title: '',
    meta_description: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/blogs/${blogId}`).then(r => r.json()),
      fetch('/api/blogs/categories').then(r => r.json()),
    ]).then(([blogData, catData]) => {
      const b = blogData.blog
      if (b) {
        setForm({
          title: b.title || '',
          content: b.content || '',
          excerpt: b.excerpt || '',
          category_id: b.category_id ? String(b.category_id) : '',
          tags: (b.tags || []).join(', '),
          featured_image: b.featured_image || '',
          is_published: b.is_published || false,
          is_featured: b.is_featured || false,
          meta_title: b.meta_title || '',
          meta_description: b.meta_description || '',
        })
      }
      setCategories(catData.categories || [])
      setLoading(false)
    })
  }, [blogId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id ? Number(form.category_id) : null,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      router.push('/admin/blogs')
    } catch {
      setError('Something went wrong')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-navy/20 border-t-accent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-navy font-heading">✏️ Edit Blog Post</h1>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
            className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:outline-none text-sm" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Content *</label>
          <RichTextEditor
            content={form.content}
            onChange={(html) => setForm(f => ({ ...f, content: html }))}
            placeholder="Edit your blog content..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Excerpt</label>
          <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={3}
            className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none text-sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none text-sm">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Featured Image URL</label>
          <input type="text" value={form.featured_image} onChange={e => setForm(f => ({ ...f, featured_image: e.target.value }))}
            className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 focus:outline-none text-sm" />
        </div>

        <div className="bg-slate-50 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-navy text-sm">🔍 SEO Settings</h3>
          <input type="text" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="Meta Title"
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none text-sm" />
          <textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={2} placeholder="Meta Description"
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none text-sm" />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" />
            <span className="text-sm font-medium text-slate-700">Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
            <span className="text-sm font-medium text-slate-700">Featured</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-accent text-white font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all cursor-pointer disabled:opacity-50">
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
