'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Profile {
  id: number
  fullname: string
  email: string
  phone: string | null
  role: string
  department: string | null
  created_at: string
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [fullname, setFullname] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.json()).then(d => {
      if (d.profile) { setProfile(d.profile); setFullname(d.profile.fullname || ''); setPhone(d.profile.phone || '') }
      setLoading(false)
    })
  }, [])

  const saveProfile = async () => {
    setSaving(true); setMsg('')
    const res = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullname, phone }) })
    const d = await res.json()
    if (res.ok) { setMsg('✅ Profile updated!'); setProfile(d.profile) } else setMsg(`❌ ${d.error}`)
    setSaving(false)
  }

  const changePassword = async () => {
    setPwSaving(true); setPwMsg('')
    if (newPw !== confirmPw) { setPwMsg('❌ Passwords do not match'); setPwSaving(false); return }
    if (newPw.length < 6) { setPwMsg('❌ Min 6 characters'); setPwSaving(false); return }
    const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) })
    const d = await res.json()
    if (res.ok) { setPwMsg('✅ Password changed!'); setCurrentPw(''); setNewPw(''); setConfirmPw('') } else setPwMsg(`❌ ${d.error}`)
    setPwSaving(false)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-navy/20 border-t-accent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy font-heading">⚙️ Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and password</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-navy text-lg mb-4 font-heading">👤 Profile</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label><input value={fullname} onChange={e => setFullname(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label><input value={profile?.email || ''} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" /></div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={saveProfile} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-dark disabled:opacity-50 shadow-lg cursor-pointer">{saving ? 'Saving...' : '💾 Save'}</button>
            {msg && <span className="text-sm">{msg}</span>}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-navy text-lg mb-4 font-heading">🔐 Change Password</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Current Password</label><input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">New Password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Confirm Password</label><input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" /></div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={changePassword} disabled={pwSaving} className="px-6 py-2.5 rounded-xl bg-navy text-white font-bold text-sm hover:bg-navy-dark disabled:opacity-50 shadow-lg cursor-pointer">{pwSaving ? 'Changing...' : '🔑 Change'}</button>
            {pwMsg && <span className="text-sm">{pwMsg}</span>}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-navy text-lg mb-4 font-heading">ℹ️ Account</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-400">Role</span><p className="font-semibold text-navy capitalize">{profile?.role?.replace('_', ' ')}</p></div>
          {profile?.department && <div><span className="text-slate-400">Department</span><p className="font-semibold text-navy capitalize">{profile.department}</p></div>}
          <div><span className="text-slate-400">Member Since</span><p className="font-semibold text-navy">{profile ? new Date(profile.created_at).toLocaleDateString('en-IN') : '-'}</p></div>
        </div>
      </motion.div>
    </div>
  )
}
