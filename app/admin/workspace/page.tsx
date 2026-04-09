'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Doc { id: number; title: string; doc_type: string; content?: string; doc_url?: string; tags: string[]; department?: string; is_pinned: boolean; created_at: string; author?: { fullname: string } }

const DOC_TYPES = ['document','wiki','sop','template','resource','guide']
const TYPE_ICONS: Record<string, string> = { document:'📄', wiki:'📖', sop:'📋', template:'🗒️', resource:'🔗', guide:'📚' }
const TYPE_COLORS: Record<string, string> = { document:'#3B82F6', wiki:'#8B5CF6', sop:'#FF6B35', template:'#F59E0B', resource:'#10B981', guide:'#06B6D4' }

export default function WorkspacePage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Doc | null>(null)
  const [form, setForm] = useState({ title: '', doc_type: 'document', content: '', doc_url: '', tags: '', department: '', is_pinned: false })

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/workspace?action=list')
      const d = await res.json()
      setDocs(d.documents || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  const saveDoc = async () => {
    if (!form.title) return
    const payload = { ...form, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean), is_pinned: form.is_pinned }
    if (editing) {
      const res = await fetch('/api/admin/workspace', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) })
      if (res.ok) { const d = await res.json(); setDocs(p => p.map(doc => doc.id === editing.id ? d.document : doc)) }
    } else {
      const res = await fetch('/api/admin/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const d = await res.json(); setDocs(p => [d.document, ...p]) }
    }
    resetForm()
  }

  const deleteDoc = async (id: number) => {
    if (!confirm('Delete this document?')) return
    const res = await fetch('/api/admin/workspace', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setDocs(p => p.filter(d => d.id !== id))
  }

  const togglePin = async (doc: Doc) => {
    const res = await fetch('/api/admin/workspace', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id, is_pinned: !doc.is_pinned }) })
    if (res.ok) setDocs(p => p.map(d => d.id === doc.id ? { ...d, is_pinned: !doc.is_pinned } : d))
  }

  const startEdit = (doc: Doc) => {
    setEditing(doc)
    setForm({ title: doc.title, doc_type: doc.doc_type, content: doc.content || '', doc_url: doc.doc_url || '', tags: doc.tags?.join(', ') || '', department: doc.department || '', is_pinned: doc.is_pinned })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm({ title: '', doc_type: 'document', content: '', doc_url: '', tags: '', department: '', is_pinned: false })
  }

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchType = !filterType || d.doc_type === filterType
    return matchSearch && matchType
  })

  const pinned = filtered.filter(d => d.is_pinned)
  const regular = filtered.filter(d => !d.is_pinned)

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">📁 Shared Workspace</h1>
          <p className="text-slate-500 text-sm mt-0.5">Internal documents, SOPs, wiki pages, templates and resources for the team</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1B3A6B, #3B82F6)' }}>
          + New Document
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents, tags..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-accent shadow-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none shadow-sm">
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-bold text-navy">{filtered.length}</span> document{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* New / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
            <h3 className="font-bold text-navy font-heading mb-4">{editing ? '✏️ Edit Document' : '+ New Document'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Document title *" className="md:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={form.doc_type} onChange={e => setForm(p => ({ ...p, doc_type: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {DOC_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input value={form.doc_url} onChange={e => setForm(p => ({ ...p, doc_url: e.target.value }))} placeholder="Link URL (Google Doc, Drive, Notion...)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Tags (comma-separated)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                <option value="">All Departments (visible to everyone)</option>
                {['operations','marketing','digital','hr','finance','campus','calling','government','market'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Document content / description (optional — useful if not linking externally)" rows={3} className="md:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))} className="w-4 h-4 accent-navy" />
                <span className="text-sm text-slate-600 font-medium">📌 Pin this document</span>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveDoc} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>
                {editing ? 'Save Changes' : 'Add Document'}
              </button>
              <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer hover:bg-slate-200">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-navy rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm">Loading workspace...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="text-5xl block mb-3">📁</span>
          <p className="text-slate-400 text-sm mb-4">{search || filterType ? 'No documents found matching your search' : 'No documents yet. Add your first document!'}</p>
          {!search && !filterType && (
            <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl font-bold text-white text-xs cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>+ Add Document</button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📌 Pinned</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((doc, i) => <DocCard key={doc.id} doc={doc} idx={i} onEdit={startEdit} onDelete={deleteDoc} onPin={togglePin} />)}
              </div>
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">All Documents</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regular.map((doc, i) => <DocCard key={doc.id} doc={doc} idx={i} onEdit={startEdit} onDelete={deleteDoc} onPin={togglePin} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, idx, onEdit, onDelete, onPin }: { doc: Doc; idx: number; onEdit: (d: Doc) => void; onDelete: (id: number) => void; onPin: (d: Doc) => void }) {
  const TYPE_ICONS: Record<string, string> = { document:'📄', wiki:'📖', sop:'📋', template:'🗒️', resource:'🔗', guide:'📚' }
  const TYPE_COLORS: Record<string, string> = { document:'#3B82F6', wiki:'#8B5CF6', sop:'#FF6B35', template:'#F59E0B', resource:'#10B981', guide:'#06B6D4' }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border ${doc.is_pinned ? 'border-amber-200/60 ring-1 ring-amber-100' : 'border-slate-100'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${TYPE_COLORS[doc.doc_type] || '#6B7280'}15` }}>
          {TYPE_ICONS[doc.doc_type] || '📄'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-navy text-sm truncate">{doc.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
              style={{ background: `${TYPE_COLORS[doc.doc_type] || '#6B7280'}15`, color: TYPE_COLORS[doc.doc_type] || '#6B7280' }}>
              {doc.doc_type}
            </span>
            {doc.department && <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 capitalize">{doc.department}</span>}
            {doc.is_pinned && <span className="text-amber-500 text-xs">📌</span>}
          </div>
        </div>
      </div>

      {doc.content && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{doc.content}</p>}

      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.slice(0, 4).map(tag => <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-500">#{tag}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3">
        <span>By {doc.author?.fullname || 'Unknown'}</span>
        <span>{new Date(doc.created_at).toLocaleDateString('en-IN')}</span>
      </div>

      <div className="flex gap-2">
        {doc.doc_url && (
          <a href={doc.doc_url} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">
            🔗 Open
          </a>
        )}
        <button onClick={() => onPin(doc)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-amber-50 transition-colors" title={doc.is_pinned ? 'Unpin' : 'Pin'}>
          {doc.is_pinned ? '📌' : '📎'}
        </button>
        <button onClick={() => onEdit(doc)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-blue-50 transition-colors">✏️</button>
        <button onClick={() => onDelete(doc.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500">🗑️</button>
      </div>
    </motion.div>
  )
}
