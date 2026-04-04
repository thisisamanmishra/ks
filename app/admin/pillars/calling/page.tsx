'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Caller { id: number; fullname: string; email: string; phone: string; shift: string; calls_today: number; leads_today: number; conversion_rate: number; revenue: number; target_calls: number }
interface CallLog { id: number; caller_name: string; prospect_name: string; prospect_phone: string | null; duration: string | null; outcome: string; notes: string | null; created_at: string }
interface Script { id: number; title: string; content: string | null; objection_handling: string | null }

const TABS = ['📞 Roster', '📋 Call Logs', '📊 Performance', '📝 Scripts', '🗓️ Schedule'] as const
type Tab = typeof TABS[number]

const OUTCOME_CFG: Record<string, { label: string; color: string; bg: string }> = {
  interested: { label: 'Interested 🤝', color: '#8B5CF6', bg: '#EDE9FE' },
  not_interested: { label: 'Not Interested', color: '#EF4444', bg: '#FEE2E2' },
  callback: { label: 'Call Back 📞', color: '#F59E0B', bg: '#FEF3C7' },
  converted: { label: 'Converted ✅', color: '#10B981', bg: '#D1FAE5' },
  no_answer: { label: 'No Answer', color: '#6B7280', bg: '#F3F4F6' },
}

export default function CallingSaarthiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('📞 Roster')
  const [callers, setCallers] = useState<Caller[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [scriptsLoading, setScriptsLoading] = useState(true)
  const [newCall, setNewCall] = useState({ caller: '', prospect: '', phone: '', duration: '', outcome: 'interested', notes: '' })
  const [newScript, setNewScript] = useState({ title: '', content: '', objection: '' })
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', shift: 'morning', target_calls: '50' })
  const [saving, setSaving] = useState(false)
  const [logSaving, setLogSaving] = useState(false)
  const [scriptSaving, setScriptSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const loadCallers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pillars/calling/callers')
      const d = res.ok ? await res.json() : { callers: [] }
      setCallers(d.callers || [])
    } catch {} finally { setLoading(false) }
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await fetch('/api/admin/calling/logs?limit=200')
      const d = res.ok ? await res.json() : { logs: [] }
      setCallLogs(d.logs || [])
    } catch {} finally { setLogsLoading(false) }
  }, [])

  const loadScripts = useCallback(async () => {
    setScriptsLoading(true)
    try {
      const res = await fetch('/api/admin/calling/scripts')
      const d = res.ok ? await res.json() : { scripts: [] }
      setScripts(d.scripts || [])
    } catch {} finally { setScriptsLoading(false) }
  }, [])

  useEffect(() => { loadCallers(); loadLogs(); loadScripts() }, [loadCallers, loadLogs, loadScripts])

  const createCaller = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/admin/pillars/calling/callers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, target_calls: Number(form.target_calls) })
      })
      if (res.ok) { setShowNew(false); setForm({ fullname: '', email: '', phone: '', shift: 'morning', target_calls: '50' }); loadCallers() }
    } catch {} finally { setSaving(false) }
  }

  const logCall = async () => {
    if (!newCall.caller || !newCall.prospect) return
    setLogSaving(true)
    try {
      const res = await fetch('/api/admin/calling/logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_name: newCall.caller, prospect_name: newCall.prospect, phone: newCall.phone, duration: newCall.duration, outcome: newCall.outcome, notes: newCall.notes })
      })
      if (res.ok) { setNewCall({ caller: '', prospect: '', phone: '', duration: '', outcome: 'interested', notes: '' }); loadLogs() }
    } catch {} finally { setLogSaving(false) }
  }

  const saveScript = async () => {
    if (!newScript.title) return
    setScriptSaving(true)
    try {
      const res = await fetch('/api/admin/calling/scripts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newScript.title, content: newScript.content, objection: newScript.objection })
      })
      if (res.ok) { setNewScript({ title: '', content: '', objection: '' }); loadScripts() }
    } catch {} finally { setScriptSaving(false) }
  }

  const deleteScript = async (id: number) => {
    await fetch('/api/admin/calling/scripts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadScripts()
  }

  const totalCalls = callLogs.length
  const totalConverted = callLogs.filter(l => l.outcome === 'converted').length

  return (
    <div className="space-y-5 max-w-7xl">
      <div><h1 className="text-2xl font-bold text-navy font-heading">📞 Calling Saarthi</h1><p className="text-slate-500 text-sm">Caller roster · Call logs · Scripts · Performance · Schedules</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '👥', label: 'Callers', value: String(callers.length), color: '#3B82F6' },
          { icon: '📞', label: 'Total Calls', value: String(totalCalls), color: '#FF6B35' },
          { icon: '✅', label: 'Converted', value: String(totalConverted), color: '#10B981' },
          { icon: '📈', label: 'Conv. Rate', value: totalCalls > 0 ? `${((totalConverted / totalCalls) * 100).toFixed(1)}%` : '0%', color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <span className="text-2xl block mb-2">{s.icon}</span>
            <p className="text-2xl font-extrabold text-navy">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-bold cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-all ${activeTab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-navy'}`}>{t}</button>)}
      </div>

      {/* ── ROSTER ── */}
      {activeTab === '📞 Roster' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{callers.length} callers active</p>
            <button onClick={() => setShowNew(v => !v)} className="px-4 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer" style={{ background: '#FF6B35' }}>+ Add Caller</button>
          </div>
          {showNew && (
            <form onSubmit={createCaller} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input required value={form.fullname} onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))} placeholder="Full name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
                <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                  {['morning', 'afternoon', 'evening', 'night'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={form.target_calls} onChange={e => setForm(p => ({ ...p, target_calls: e.target.value }))} placeholder="Daily call target" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60" style={{ background: '#1B3A6B' }}>{saving ? '⏳' : '✅ Add Caller'}</button>
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer">Cancel</button>
              </div>
            </form>
          )}
          {loading ? (
            <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : callers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📞</span><p>No callers yet. Add your first caller above.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {callers.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center font-bold text-orange-600">{c.fullname.charAt(0)}</div>
                    <div><p className="font-bold text-navy">{c.fullname}</p><p className="text-[10px] text-slate-400 capitalize">{c.shift} Shift</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="p-2 rounded-xl bg-slate-50"><p className="font-bold text-navy">{c.calls_today}</p><p className="text-[10px] text-slate-400">Calls</p></div>
                    <div className="p-2 rounded-xl bg-green-50"><p className="font-bold text-green-600">{c.leads_today}</p><p className="text-[10px] text-slate-400">Leads</p></div>
                    <div className="p-2 rounded-xl bg-purple-50"><p className="font-bold text-purple-600">{c.conversion_rate}%</p><p className="text-[10px] text-slate-400">Conv.</p></div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-orange-400" style={{ width: `${Math.min((c.calls_today / Math.max(c.target_calls, 1)) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{c.calls_today}/{c.target_calls} daily target</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CALL LOGS ── */}
      {activeTab === '📋 Call Logs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Log a Call</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={newCall.caller} onChange={e => setNewCall(p => ({ ...p, caller: e.target.value }))} placeholder="Caller name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newCall.prospect} onChange={e => setNewCall(p => ({ ...p, prospect: e.target.value }))} placeholder="Prospect name *" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newCall.phone} onChange={e => setNewCall(p => ({ ...p, phone: e.target.value }))} placeholder="Prospect phone" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <input value={newCall.duration} onChange={e => setNewCall(p => ({ ...p, duration: e.target.value }))} placeholder="Duration (3:45)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
              <select value={newCall.outcome} onChange={e => setNewCall(p => ({ ...p, outcome: e.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none">
                {Object.entries(OUTCOME_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input value={newCall.notes} onChange={e => setNewCall(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            </div>
            <button onClick={logCall} disabled={logSaving} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{logSaving ? '⏳ Saving...' : '📋 Log Call'}</button>
          </div>
          {logsLoading ? <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            callLogs.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📋</span><p>No calls logged yet</p></div> :
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 border-b border-slate-100">{['Caller', 'Prospect', 'Phone', 'Duration', 'Outcome', 'Notes', 'Time'].map(h => <th key={h} className="px-3 py-3 text-left font-bold text-slate-400 uppercase text-[10px] whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {callLogs.map(l => {
                      const oc = OUTCOME_CFG[l.outcome] || OUTCOME_CFG.no_answer
                      return (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-3 py-3 font-semibold text-navy">{l.caller_name}</td>
                          <td className="px-3 py-3 text-slate-600">{l.prospect_name}</td>
                          <td className="px-3 py-3 text-slate-400">{l.prospect_phone || '—'}</td>
                          <td className="px-3 py-3 text-slate-400">{l.duration || '—'}</td>
                          <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: oc.bg, color: oc.color }}>{oc.label}</span></td>
                          <td className="px-3 py-3 text-slate-400 max-w-[120px] truncate">{l.notes || '—'}</td>
                          <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} {new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>}
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {activeTab === '📊 Performance' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-bold text-navy font-heading">Caller Performance Dashboard</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Calls', v: totalCalls }, { label: 'Converted', v: totalConverted },
              { label: 'Interested', v: callLogs.filter(l => l.outcome === 'interested').length },
              { label: 'Callbacks Pending', v: callLogs.filter(l => l.outcome === 'callback').length }
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50"><p className="text-2xl font-extrabold text-navy">{s.v}</p><p className="text-xs text-slate-400 mt-1">{s.label}</p></div>
            ))}
          </div>
          <h4 className="font-bold text-slate-600 text-sm">Outcome Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(OUTCOME_CFG).map(([key, cfg]) => {
              const count = callLogs.filter(l => l.outcome === key).length
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium" style={{ color: cfg.color }}>{cfg.label}</span><span className="font-bold text-navy">{count} calls · {totalCalls > 0 ? ((count / totalCalls) * 100).toFixed(1) : 0}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${totalCalls > 0 ? (count / totalCalls) * 100 : 0}%`, background: cfg.color }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SCRIPTS ── */}
      {activeTab === '📝 Scripts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-navy">Add Call Script</h4>
            <input value={newScript.title} onChange={e => setNewScript(p => ({ ...p, title: e.target.value }))} placeholder="Script title *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none" />
            <textarea rows={4} value={newScript.content} onChange={e => setNewScript(p => ({ ...p, content: e.target.value }))} placeholder="Step-by-step calling guide..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            <textarea rows={2} value={newScript.objection} onChange={e => setNewScript(p => ({ ...p, objection: e.target.value }))} placeholder="Common objections & handling..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none resize-none" />
            <button onClick={saveScript} disabled={scriptSaving} className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-60">{scriptSaving ? '⏳' : '+ Add Script'}</button>
          </div>
          {scriptsLoading ? <div className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" /> :
            scripts.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 text-slate-400"><span className="text-4xl block mb-3">📝</span><p>No scripts yet. 2 sample scripts were seeded — check if the SQL migration has been run.</p></div> :
              scripts.map(s => (
                <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-navy">{s.title}</h3>
                    <button onClick={() => deleteScript(s.id)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50">✕ Delete</button>
                  </div>
                  {s.content && <div className="p-3 rounded-xl bg-slate-50 mb-2"><p className="text-[10px] font-bold text-slate-400 mb-1">SCRIPT</p><p className="text-sm text-slate-600 whitespace-pre-wrap">{s.content}</p></div>}
                  {s.objection_handling && <div className="p-3 rounded-xl bg-amber-50"><p className="text-[10px] font-bold text-amber-600 mb-1">OBJECTION HANDLING</p><p className="text-sm text-slate-600">{s.objection_handling}</p></div>}
                </div>
              ))}
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {activeTab === '🗓️ Schedule' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-navy font-heading mb-5">Shift Schedule</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['morning', 'afternoon', 'evening', 'night'].map(shift => {
              const inShift = callers.filter(c => c.shift === shift)
              const TIMES: Record<string, string> = { morning: '8AM–12PM', afternoon: '12PM–4PM', evening: '4PM–8PM', night: '8PM–12AM' }
              return (
                <div key={shift} className="rounded-2xl p-4 border border-slate-100 bg-slate-50">
                  <p className="font-bold text-navy capitalize mb-0.5">{shift} Shift</p>
                  <p className="text-[10px] text-slate-400 mb-3">{TIMES[shift]}</p>
                  {inShift.length === 0 ? <p className="text-xs text-slate-300">No callers assigned</p> :
                    inShift.map(c => <div key={c.id} className="text-xs px-2 py-1.5 rounded-lg bg-white font-medium text-navy border border-slate-100 mb-1">{c.fullname}</div>)}
                  <p className="text-[10px] text-slate-400 mt-2 font-bold">{inShift.length} callers</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
