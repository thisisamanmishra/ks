'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Group {
  id: number
  name: string
  description: string | null
  type: string
  avatar: string | null
}

interface Member {
  user_id: number
  role: string
  user: { id: number; fullname: string; role: string; avatar_url: string | null }
}

interface ChatMessage {
  id: number
  content: string
  attachment_url: string | null
  file_type: string | null
  created_at: string
  is_deleted: boolean
  sender: { id: number; fullname: string; role: string; avatar_url: string | null } | null
  reads: { user_id: number }[]
}

interface GroupChatPanelProps {
  currentUserId: number
  isAdmin?: boolean
  onClose: () => void
}

const TYPE_ICONS: Record<string, string> = { general: '💬', team: '👥', project: '📋', announcement: '📣' }

export default function GroupChatPanel({ currentUserId, isAdmin, onClose }: GroupChatPanelProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMembers, setShowMembers] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupType, setNewGroupType] = useState('general')
  const [allUsers, setAllUsers] = useState<{ id: number; fullname: string; role: string }[]>([])
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null)
  const [confirmLeave, setConfirmLeave] = useState<Group | null>(null)
  const [actioning, setActioning] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/groups')
      if (res.ok) { const d = await res.json(); setGroups(d.groups || []) }
    } catch {} finally { setLoading(false) }
  }, [])

  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?limit=100')
      if (res.ok) {
        const d = await res.json()
        setAllUsers((d.users || []).map((u: { id: number; fullname: string; role: string }) => ({ id: u.id, fullname: u.fullname, role: u.role })))
      }
    } catch {}
  }, [])

  const fetchMessages = useCallback(async (groupId: number) => {
    try {
      const res = await fetch(`/api/chat/groups/${groupId}`)
      if (res.ok) {
        const d = await res.json()
        setMessages(d.messages || [])
        setMembers(d.members || [])
      }
    } catch {}
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])
  useEffect(() => { if (showCreate && isAdmin) fetchAllUsers() }, [showCreate, isAdmin, fetchAllUsers])

  useEffect(() => {
    if (!activeGroup) return
    fetchMessages(activeGroup.id)
    const interval = setInterval(() => fetchMessages(activeGroup.id), 4000)
    return () => clearInterval(interval)
  }, [activeGroup, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (attachmentUrl?: string, fileType?: string) => {
    if (!activeGroup || (!newMsg.trim() && !attachmentUrl)) return
    setSending(true)
    try {
      await fetch(`/api/chat/groups/${activeGroup.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg, attachment_url: attachmentUrl, file_type: fileType }),
      })
      setNewMsg('')
      await fetchMessages(activeGroup.id)
    } catch {} finally { setSending(false) }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeGroup) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) await sendMessage(d.url, d.file_type)
    } catch {} finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const deleteMessage = async (msgId: number) => {
    if (!activeGroup) return
    await fetch(`/api/chat/groups/${activeGroup.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msgId }),
    })
    await fetchMessages(activeGroup.id)
  }

  const deleteGroup = async (group: Group) => {
    setActioning(true)
    try {
      const res = await fetch(`/api/chat/groups/${group.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteGroup: true }),
      })
      if (res.ok) {
        setConfirmDelete(null)
        if (activeGroup?.id === group.id) setActiveGroup(null)
        fetchGroups()
      }
    } catch {} finally { setActioning(false) }
  }

  const leaveGroup = async (group: Group) => {
    setActioning(true)
    try {
      const res = await fetch(`/api/chat/groups/${group.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveGroup: true }),
      })
      if (res.ok) {
        setConfirmLeave(null)
        if (activeGroup?.id === group.id) setActiveGroup(null)
        fetchGroups()
      }
    } catch {} finally { setActioning(false) }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc, type: newGroupType, member_ids: selectedMembers }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create group. Check server logs.')
      }
      setNewGroupName('')
      setNewGroupDesc('')
      setSelectedMembers([])
      setMemberSearch('')
      setShowCreate(false)
      fetchGroups()
    } catch (err: any) {
      alert(`Error creating group: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex h-[90vh] sm:h-[600px]">

        {/* Sidebar — Groups list */}
        <div className="w-64 flex-shrink-0 border-r border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-navy text-sm font-heading">💬 Group Chat</h3>
            <div className="flex gap-1.5">
              {isAdmin && (
                <button onClick={() => setShowCreate(v => !v)}
                  className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm cursor-pointer hover:bg-accent/20 font-bold">
                  +
                </button>
              )}
              <button onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-200">
                ✕
              </button>
            </div>
          </div>

          {showCreate && isAdmin && (
            <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2 max-h-80 overflow-y-auto">
              <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                placeholder="Group name...*" className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-navy" />
              <input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                placeholder="Description (optional)" className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none" />
              <select value={newGroupType} onChange={e => setNewGroupType(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none">
                {Object.entries(TYPE_ICONS).map(([key, icon]) => (
                  <option key={key} value={key}>{icon} {key}</option>
                ))}
              </select>
              {/* Member picker */}
              {allUsers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 mb-1">Add Members ({selectedMembers.length} selected)</p>
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] focus:outline-none mb-1"
                  />
                  <div className="max-h-28 overflow-y-auto space-y-0.5">
                    {allUsers
                      .filter(u => u.fullname.toLowerCase().includes(memberSearch.toLowerCase()))
                      .map(u => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedMembers(prev =>
                            prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          )}
                          className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] text-left cursor-pointer transition-colors ${
                            selectedMembers.includes(u.id) ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-[8px] ${
                            selectedMembers.includes(u.id) ? 'bg-accent' : 'bg-slate-300'
                          }`}>{selectedMembers.includes(u.id) ? '✓' : ''}</span>
                          {u.fullname} <span className="text-slate-400 capitalize">({u.role})</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <button onClick={createGroup} disabled={!newGroupName.trim()} className="w-full py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer disabled:opacity-50" style={{ background: '#FF6B35' }}>
                Create Group {selectedMembers.length > 0 ? `(+${selectedMembers.length} members)` : ''}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : groups.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <span className="text-3xl block mb-2">💬</span>
                <p className="text-xs">No groups yet</p>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.id} className={`flex items-center border-b border-slate-50 group/item ${activeGroup?.id === group.id ? 'bg-navy/5 border-l-2 border-l-navy' : 'hover:bg-slate-50'}`}>
                  <button onClick={() => setActiveGroup(group)} className="flex-1 flex items-center gap-3 px-4 py-3 text-left cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center text-lg flex-shrink-0">
                      {TYPE_ICONS[group.type] || '💬'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{group.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{group.type}</p>
                    </div>
                  </button>
                  {/* Delete (admin) or Leave (member) */}
                  <div className="px-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-1">
                    {isAdmin ? (
                      <button onClick={() => setConfirmDelete(group)} title="Delete Group"
                        className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] cursor-pointer hover:bg-red-200">🗑</button>
                    ) : (
                      <button onClick={() => setConfirmLeave(group)} title="Leave Group"
                        className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] cursor-pointer hover:bg-amber-200">↩</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeGroup ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <span className="text-5xl block mb-3">💬</span>
                <p className="text-sm">Select a group to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center text-lg">
                    {TYPE_ICONS[activeGroup.type] || '💬'}
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">{activeGroup.name}</p>
                    <p className="text-[10px] text-slate-400">{members.length} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowMembers(v => !v)}
                    className="text-xs text-slate-400 hover:text-navy cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-50">
                    👥 {members.length}
                  </button>
                  {isAdmin ? (
                    <button onClick={() => setConfirmDelete(activeGroup)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer font-bold">🗑 Delete</button>
                  ) : (
                    <button onClick={() => setConfirmLeave(activeGroup)}
                      className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer font-bold">↩ Leave</button>
                  )}
                </div>
              </div>

              {/* Members panel */}
              <AnimatePresence>
                {showMembers && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden border-b border-slate-100 bg-slate-50">
                    <div className="flex gap-2 p-3 flex-wrap">
                      {members.map(m => (
                        <div key={m.user_id} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-slate-200 text-xs">
                          <div className="w-4 h-4 rounded-full bg-navy flex items-center justify-center text-white text-[8px] font-bold">
                            {m.user?.fullname?.charAt(0) || '?'}
                          </div>
                          <span className="text-navy font-medium">{m.user?.fullname}</span>
                          {m.role === 'admin' && <span className="text-amber-500">★</span>}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isOwn = msg.sender?.id === currentUserId
                  const isDeleted = msg.is_deleted
                  const readCount = msg.reads?.length || 0
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-xs flex-shrink-0 mb-1">
                          {msg.sender?.fullname?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className={`max-w-[70%] group relative`}>
                        {!isOwn && <p className="text-[9px] text-slate-400 mb-0.5 ml-1">{msg.sender?.fullname}</p>}
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isDeleted ? 'bg-slate-100 text-slate-400 italic' :
                          isOwn ? 'bg-navy text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'
                        }`}>
                          {isDeleted ? '[deleted]' : (
                            <>
                              <p>{msg.content}</p>
                              {msg.attachment_url && (
                                <div className="mt-2">
                                  {msg.file_type === 'image' ? (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={msg.attachment_url} alt="" className="max-w-[160px] rounded-xl" />
                                    </a>
                                  ) : (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                                      className={`flex items-center gap-1 text-xs underline ${isOwn ? 'text-white/80' : 'text-accent'}`}>
                                      📎 Attachment
                                    </a>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[9px] text-slate-400">
                            {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && readCount > 1 && <span className="text-[9px] text-blue-400">✓✓ {readCount}</span>}
                        </div>
                        {isOwn && !isDeleted && (
                          <button onClick={() => deleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex items-center gap-2">
                <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer text-base flex-shrink-0 transition-colors">
                  {uploading ? '⏳' : '📎'}
                </button>
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:border focus:border-navy transition-all" />
                <button onClick={() => sendMessage()} disabled={!newMsg.trim() || sending}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer disabled:opacity-50 transition-all flex-shrink-0"
                  style={{ background: '#FF6B35' }}>
                  {sending ? '⏳' : '→'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Confirm Delete Group */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
              <p className="text-2xl mb-3">🗑️</p>
              <h3 className="font-bold text-navy text-lg mb-1">Delete Group?</h3>
              <p className="text-sm text-slate-500 mb-5">Delete <strong>"{confirmDelete.name}"</strong>? All messages will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold cursor-pointer">Cancel</button>
                <button onClick={() => deleteGroup(confirmDelete)} disabled={actioning}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold cursor-pointer disabled:opacity-60">
                  {actioning ? '⏳' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Leave Group */}
      <AnimatePresence>
        {confirmLeave && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
              <p className="text-2xl mb-3">↩️</p>
              <h3 className="font-bold text-navy text-lg mb-1">Leave Group?</h3>
              <p className="text-sm text-slate-500 mb-5">You will leave <strong>"{confirmLeave.name}"</strong> and won't see new messages.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmLeave(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold cursor-pointer">Cancel</button>
                <button onClick={() => leaveGroup(confirmLeave)} disabled={actioning}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold cursor-pointer disabled:opacity-60">
                  {actioning ? '⏳' : 'Leave'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
