'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ─────────────────────────────────────────────────────────────────
interface CompanyInfo {
  id?: number
  vision: string
  mission: string
  story: string
  tagline: string
}

interface TimelineItem {
  id: number
  year: string
  title: string
  description: string
  sort_order: number
}

interface Member {
  id: number
  name: string
  role: string
  image_url: string | null
  vision: string | null
  mission: string | null
  statement: string | null
  sort_order: number
  is_active: boolean
}

interface Achievement {
  id: number
  icon: string
  value: string
  label: string
  sort_order: number
}

interface AboutData {
  company: CompanyInfo
  timeline: TimelineItem[]
  members: Member[]
  achievements: Achievement[]
}

const FALLBACK_COMPANY: CompanyInfo = {
  vision: 'To create a global platform where knowledge meets opportunity, making quality education and professional services accessible to every student and business across India and beyond.',
  mission: 'To empower 10 million students and 1 million businesses by 2030 through collaborative learning and affordable professional services.',
  story: 'Karya Saarthi was founded with a vision to bridge the gap between what education teaches and what the industry demands.',
  tagline: "From a small idea to India's most trusted work companion — powered by passion, driven by purpose.",
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function notify(msg: string) {
  // Simple inline toast — avoids dependencies
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1B3A6B;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.15);'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

// ─── Subcomponents ─────────────────────────────────────────────────────────
function SectionTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${active ? 'bg-navy text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
      {children}
    </button>
  )
}

function FieldInput({ label, value, onChange, multiline = false, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number }) {
  const cls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 resize-none'
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{label}</label>
      {multiline
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} className={cls} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AboutPageManager() {
  const [data, setData] = useState<AboutData>({ company: FALLBACK_COMPANY, timeline: [], members: [], achievements: [] })
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<'company' | 'timeline' | 'members' | 'achievements'>('company')

  // Company
  const [company, setCompany] = useState<CompanyInfo>(FALLBACK_COMPANY)
  const [savingCompany, setSavingCompany] = useState(false)

  // Timeline
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [editingTimeline, setEditingTimeline] = useState<TimelineItem | null>(null)
  const [timelineForm, setTimelineForm] = useState({ year: '', title: '', description: '' })
  const [savingTimeline, setSavingTimeline] = useState(false)

  // Members
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [memberForm, setMemberForm] = useState({ name: '', role: '', image_url: '', vision: '', mission: '', statement: '', is_active: true })
  const [savingMember, setSavingMember] = useState(false)

  // Achievements
  const [showAchForm, setShowAchForm] = useState(false)
  const [editingAch, setEditingAch] = useState<Achievement | null>(null)
  const [achForm, setAchForm] = useState({ icon: '🏆', value: '', label: '' })
  const [savingAch, setSavingAch] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/about?admin=true')
      const d = await res.json()
      const co = (d.company && d.company.vision) ? d.company : FALLBACK_COMPANY
      const merged = { ...FALLBACK_COMPANY, ...co }
      setData({ company: merged, timeline: d.timeline || [], members: d.members || [], achievements: d.achievements || [] })
      setCompany(merged)
    } catch {
      notify('⚠️ Failed to load about data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Company Save ─────────────────────────────────────────
  const saveCompany = async () => {
    setSavingCompany(true)
    try {
      const res = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'company', ...company }),
      })
      if (!res.ok) throw new Error()
      notify('✅ Company info saved!')
      await fetchData()
    } catch { notify('❌ Failed to save company info') }
    setSavingCompany(false)
  }

  // ── Timeline ─────────────────────────────────────────────
  const openTimelineForm = (item?: TimelineItem) => {
    setEditingTimeline(item || null)
    setTimelineForm(item ? { year: item.year, title: item.title, description: item.description } : { year: new Date().getFullYear().toString(), title: '', description: '' })
    setShowTimelineForm(true)
  }

  const saveTimeline = async () => {
    if (!timelineForm.title) return
    setSavingTimeline(true)
    try {
      const method = editingTimeline ? 'PATCH' : 'POST'
      const body = editingTimeline
        ? { type: 'timeline', id: editingTimeline.id, ...timelineForm }
        : { type: 'timeline', ...timelineForm, sort_order: data.timeline.length + 1 }
      const res = await fetch('/api/admin/about', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      notify(`✅ Timeline ${editingTimeline ? 'updated' : 'added'}!`)
      setShowTimelineForm(false)
      await fetchData()
    } catch { notify('❌ Failed to save') }
    setSavingTimeline(false)
  }

  const deleteTimeline = async (id: number) => {
    if (!confirm('Delete this timeline event?')) return
    await fetch(`/api/admin/about?type=timeline&id=${id}`, { method: 'DELETE' })
    setData(p => ({ ...p, timeline: p.timeline.filter(t => t.id !== id) }))
    notify('🗑 Timeline event deleted')
  }

  // ── Members ──────────────────────────────────────────────
  const openMemberForm = (m?: Member) => {
    setEditingMember(m || null)
    setMemberForm(m
      ? { name: m.name, role: m.role, image_url: m.image_url || '', vision: m.vision || '', mission: m.mission || '', statement: m.statement || '', is_active: m.is_active }
      : { name: '', role: '', image_url: '', vision: '', mission: '', statement: '', is_active: true })
    setShowMemberForm(true)
  }

  const saveMember = async () => {
    if (!memberForm.name) return
    setSavingMember(true)
    try {
      const method = editingMember ? 'PATCH' : 'POST'
      const body = editingMember
        ? { type: 'member', id: editingMember.id, ...memberForm }
        : { type: 'member', ...memberForm, sort_order: data.members.length + 1 }
      const res = await fetch('/api/admin/about', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      notify(`✅ Member ${editingMember ? 'updated' : 'added'}!`)
      setShowMemberForm(false)
      await fetchData()
    } catch { notify('❌ Failed to save member') }
    setSavingMember(false)
  }

  const toggleMemberActive = async (m: Member) => {
    await fetch('/api/admin/about', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'member', id: m.id, is_active: !m.is_active }),
    })
    await fetchData()
    notify(`${!m.is_active ? '✅ Member shown' : '👁 Member hidden'} on public page`)
  }

  const deleteMember = async (id: number, name: string) => {
    if (!confirm(`Delete ${name}?`)) return
    await fetch(`/api/admin/about?type=member&id=${id}`, { method: 'DELETE' })
    setData(p => ({ ...p, members: p.members.filter(m => m.id !== id) }))
    notify('🗑 Member deleted')
  }

  // ── Achievements ─────────────────────────────────────────
  const openAchForm = (a?: Achievement) => {
    setEditingAch(a || null)
    setAchForm(a ? { icon: a.icon, value: a.value, label: a.label } : { icon: '🏆', value: '', label: '' })
    setShowAchForm(true)
  }

  const saveAch = async () => {
    if (!achForm.value) return
    setSavingAch(true)
    try {
      const method = editingAch ? 'PATCH' : 'POST'
      const body = editingAch
        ? { type: 'achievement', id: editingAch.id, ...achForm }
        : { type: 'achievement', ...achForm, sort_order: data.achievements.length + 1 }
      const res = await fetch('/api/admin/about', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      notify(`✅ Achievement ${editingAch ? 'updated' : 'added'}!`)
      setShowAchForm(false)
      await fetchData()
    } catch { notify('❌ Failed to save') }
    setSavingAch(false)
  }

  const deleteAch = async (id: number) => {
    if (!confirm('Delete this achievement?')) return
    await fetch(`/api/admin/about?type=achievement&id=${id}`, { method: 'DELETE' })
    setData(p => ({ ...p, achievements: p.achievements.filter(a => a.id !== id) }))
    notify('🗑 Achievement deleted')
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy font-heading">🌐 About Page Manager</h2>
          <p className="text-xs text-slate-400 mt-0.5">All changes reflect immediately on the public /about page</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors">
          🔄 Refresh
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 flex-wrap">
        <SectionTab active={section === 'company'} onClick={() => setSection('company')}>🏢 Company Info</SectionTab>
        <SectionTab active={section === 'timeline'} onClick={() => setSection('timeline')}>
          📅 Timeline {!loading && <span className="ml-1 opacity-60">({data.timeline.length})</span>}
        </SectionTab>
        <SectionTab active={section === 'members'} onClick={() => setSection('members')}>
          👥 Team Members {!loading && <span className="ml-1 opacity-60">({data.members.length})</span>}
        </SectionTab>
        <SectionTab active={section === 'achievements'} onClick={() => setSection('achievements')}>
          🏆 Stats {!loading && <span className="ml-1 opacity-60">({data.achievements.length})</span>}
        </SectionTab>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
      ) : (
        <>
          {/* ── COMPANY INFO ── */}
          {section === 'company' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="text-2xl">🏢</span>
                <div>
                  <h3 className="font-bold text-navy font-heading">Company Vision, Mission &amp; Story</h3>
                  <p className="text-xs text-slate-400 mt-0.5">These fields appear on the public /about page</p>
                </div>
              </div>
              <FieldInput label="Tagline (hero subtitle)" value={company.tagline} onChange={v => setCompany(p => ({ ...p, tagline: v }))} />
              <FieldInput label="Vision" value={company.vision} onChange={v => setCompany(p => ({ ...p, vision: v }))} multiline rows={4} />
              <FieldInput label="Mission" value={company.mission} onChange={v => setCompany(p => ({ ...p, mission: v }))} multiline rows={4} />
              <FieldInput label="Our Story" value={company.story} onChange={v => setCompany(p => ({ ...p, story: v }))} multiline rows={5} />
              <button onClick={saveCompany} disabled={savingCompany}
                className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: '#1B3A6B' }}>
                {savingCompany ? '⏳ Saving...' : '💾 Save Company Info'}
              </button>
            </motion.div>
          )}

          {/* ── TIMELINE ── */}
          {section === 'timeline' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{data.timeline.length} milestone events · chronological order</p>
                <button onClick={() => openTimelineForm()}
                  className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#FF6B35' }}>
                  + Add Milestone
                </button>
              </div>

              <AnimatePresence>
                {showTimelineForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                    <h4 className="font-bold text-navy">{editingTimeline ? '✏️ Edit Milestone' : '➕ New Milestone'}</h4>
                    <div className="grid grid-cols-5 gap-3">
                      <input value={timelineForm.year} onChange={e => setTimelineForm(p => ({ ...p, year: e.target.value }))}
                        placeholder="Year" className="col-span-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                      <input value={timelineForm.title} onChange={e => setTimelineForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Title *" className="col-span-4 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                    </div>
                    <textarea rows={2} value={timelineForm.description} onChange={e => setTimelineForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy resize-none" />
                    <div className="flex gap-3">
                      <button onClick={saveTimeline} disabled={savingTimeline || !timelineForm.title}
                        className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">
                        {savingTimeline ? '⏳' : editingTimeline ? '💾 Update' : '✅ Add'}
                      </button>
                      <button onClick={() => setShowTimelineForm(false)} className="text-sm text-slate-400 cursor-pointer hover:text-slate-600">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-3">
                  {data.timeline.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4 relative">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 z-10">
                        <span className="text-accent font-extrabold text-sm leading-tight text-center">{item.year}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy text-sm">{item.title}</p>
                        <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openTimelineForm(item)}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 text-xs flex items-center justify-center cursor-pointer hover:bg-blue-100">✏️</button>
                        <button onClick={() => deleteTimeline(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-400 text-xs flex items-center justify-center cursor-pointer hover:bg-red-100">🗑</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {data.timeline.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="font-semibold">No timeline events yet</p>
                  <p className="text-xs mt-1">Click &quot;Add Milestone&quot; to create your first entry</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TEAM MEMBERS ── */}
          {section === 'members' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <p className="text-sm text-slate-500">{data.members.length} total · {data.members.filter(m => m.is_active).length} visible on /about</p>
                  <p className="text-xs text-slate-400 mt-0.5">Toggle visibility without deleting. Images: use full URL or /images/team/filename.jpg</p>
                </div>
                <button onClick={() => openMemberForm()}
                  className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#8B5CF6' }}>
                  + Add Member
                </button>
              </div>

              <AnimatePresence>
                {showMemberForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                    <h4 className="font-bold text-navy text-base">{editingMember ? '✏️ Edit Member' : '➕ Add Team Member'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FieldInput label="Full Name *" value={memberForm.name} onChange={v => setMemberForm(p => ({ ...p, name: v }))} />
                      <FieldInput label="Role / Designation *" value={memberForm.role} onChange={v => setMemberForm(p => ({ ...p, role: v }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Profile Image URL</label>
                      <input value={memberForm.image_url} onChange={e => setMemberForm(p => ({ ...p, image_url: e.target.value }))}
                        placeholder="e.g. https://... or /images/team/name.jpg"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" />
                      {memberForm.image_url && (
                        <div className="mt-2 flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={memberForm.image_url} alt="preview" className="h-12 w-12 rounded-full object-cover border-2 border-slate-200" onError={e => (e.target as HTMLImageElement).style.opacity = '0.3'} />
                          <p className="text-xs text-slate-400">Preview</p>
                        </div>
                      )}
                    </div>
                    <FieldInput label="Vision" value={memberForm.vision} onChange={v => setMemberForm(p => ({ ...p, vision: v }))} multiline rows={2} />
                    <FieldInput label="Mission" value={memberForm.mission} onChange={v => setMemberForm(p => ({ ...p, mission: v }))} multiline rows={2} />
                    <FieldInput label="Personal Statement / Quote" value={memberForm.statement} onChange={v => setMemberForm(p => ({ ...p, statement: v }))} multiline rows={3} />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setMemberForm(p => ({ ...p, is_active: !p.is_active }))}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${memberForm.is_active ? 'bg-green-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${memberForm.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{memberForm.is_active ? 'Visible on /about' : 'Hidden from public'}</span>
                      </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={saveMember} disabled={savingMember || !memberForm.name}
                        className="px-6 py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer disabled:opacity-60 hover:opacity-90">
                        {savingMember ? '⏳ Saving...' : editingMember ? '💾 Update Member' : '✅ Add Member'}
                      </button>
                      <button onClick={() => { setShowMemberForm(false); setEditingMember(null) }}
                        className="text-sm text-slate-400 cursor-pointer hover:text-slate-600">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.members.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${m.is_active ? 'border-slate-100 shadow-sm hover:shadow-md' : 'border-dashed border-slate-200 opacity-60'}`}>
                    {/* Photo */}
                    <div className="relative h-40 bg-gradient-to-br from-navy/10 via-purple-50 to-blue-50 flex items-center justify-center">
                      {!m.is_active && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-700 text-white text-[10px] font-bold rounded-full">HIDDEN</div>
                      )}
                      {m.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.image_url} alt={m.name}
                          className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-lg"
                          onError={e => { const t = e.target as HTMLImageElement; t.style.display = 'none'; t.nextElementSibling?.classList.remove('hidden') }} />
                      ) : null}
                      <div className={`h-28 w-28 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-white font-extrabold text-4xl border-4 border-white shadow-lg ${m.image_url ? 'hidden' : ''}`}>
                        {m.name.charAt(0)}
                      </div>
                    </div>
                    {/* Details */}
                    <div className="p-4">
                      <p className="font-bold text-navy text-sm">{m.name}</p>
                      <p className="text-accent text-xs font-semibold mt-0.5 mb-3">{m.role}</p>
                      {m.vision && (
                        <div className="mb-1.5">
                          <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">Vision</span>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{m.vision}</p>
                        </div>
                      )}
                      {m.mission && (
                        <div className="mb-1.5">
                          <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">Mission</span>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{m.mission}</p>
                        </div>
                      )}
                      {m.statement && (
                        <div className="mb-3">
                          <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">Statement</span>
                          <p className="text-xs text-slate-500 line-clamp-3 mt-0.5 italic">&ldquo;{m.statement}&rdquo;</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-auto pt-2 border-t border-slate-50">
                        <button onClick={() => openMemberForm(m)}
                          className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors">✏️ Edit</button>
                        <button onClick={() => toggleMemberActive(m)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${m.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {m.is_active ? '👁 Hide' : '✅ Show'}
                        </button>
                        <button onClick={() => deleteMember(m.id, m.name)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-400 text-xs flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors">🗑</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {data.members.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="font-semibold">No team members yet</p>
                  <p className="text-xs mt-1 max-w-xs mx-auto">Click &quot;Add Member&quot; to add your first team member. They will appear on the public About page.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {section === 'achievements' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{data.achievements.length} stats · shown in About page grid</p>
                <button onClick={() => openAchForm()}
                  className="px-4 py-2 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#10B981' }}>
                  + Add Stat
                </button>
              </div>

              <AnimatePresence>
                {showAchForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-navy mb-3">{editingAch ? '✏️ Edit Stat' : '➕ Add Achievement Stat'}</h4>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Emoji Icon</label>
                        <input value={achForm.icon} onChange={e => setAchForm(p => ({ ...p, icon: e.target.value }))}
                          placeholder="🏆" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value *</label>
                        <input value={achForm.value} onChange={e => setAchForm(p => ({ ...p, value: e.target.value }))}
                          placeholder="500+" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Label *</label>
                        <input value={achForm.label} onChange={e => setAchForm(p => ({ ...p, label: e.target.value }))}
                          placeholder="Projects Done" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={saveAch} disabled={savingAch || !achForm.value}
                        className="px-5 py-2 rounded-xl bg-green-600 text-white text-xs font-bold cursor-pointer disabled:opacity-60">
                        {savingAch ? '⏳' : editingAch ? '💾 Update' : '✅ Add Stat'}
                      </button>
                      <button onClick={() => setShowAchForm(false)} className="text-sm text-slate-400 cursor-pointer hover:text-slate-600">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.achievements.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="text-3xl mb-1">{a.icon}</div>
                    <p className="text-2xl font-extrabold text-navy font-heading">{a.value}</p>
                    <p className="text-slate-400 text-xs mt-1 mb-4">{a.label}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openAchForm(a)}
                        className="flex-1 py-1 rounded-lg bg-blue-50 text-blue-500 text-[10px] font-bold cursor-pointer hover:bg-blue-100">✏️</button>
                      <button onClick={() => deleteAch(a.id)}
                        className="flex-1 py-1 rounded-lg bg-red-50 text-red-400 text-[10px] font-bold cursor-pointer hover:bg-red-100">🗑</button>
                    </div>
                  </motion.div>
                ))}
              </div>
              {data.achievements.length === 0 && (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-4xl mb-3">🏆</p>
                  <p className="font-semibold">No stats yet</p>
                  <p className="text-xs mt-1">Add achievement stats like &quot;500+ Projects&quot; to display on the About page</p>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
