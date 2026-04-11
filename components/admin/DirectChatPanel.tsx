'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Contact {
  id: number
  fullname: string
  email: string
  role: string
  lastMessage: { content: string; created_at: string; sender_id: number } | null
  unreadCount: number
}

interface Message {
  id: number
  content: string
  attachment_url: string | null
  file_type: string | null
  created_at: string
  sender: { id: number; fullname: string; role: string } | null
}

interface Props {
  currentUserId: number
  /** 'ops' = operations mode (Customer / Vendor tabs, pick a person to chat)
   *  'user' = customer or vendor mode (sends directly to ops team, no picker) */
  mode: 'ops' | 'user'
  onClose: () => void
}

export default function DirectChatPanel({ currentUserId, mode, onClose }: Props) {
  const [tab, setTab] = useState<'customer' | 'vendor'>('customer')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  /** In user-mode: store the ops-team receiver id directly so send always works */
  const [opsReceiverId, setOpsReceiverId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ─── Fetch messages for a specific thread ───────────────────────────────────
  const fetchMessages = useCallback(async (userId: number) => {
    try {
      const r = await fetch(`/api/direct-messages?userId=${userId}`)
      if (r.ok) {
        const d = await r.json()
        setMessages(d.messages || [])
      }
    } catch {}
  }, [])

  // ─── Fetch contacts list ────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      const r = await fetch('/api/direct-messages?contacts=1')
      if (r.ok) {
        const d = await r.json()
        const list: Contact[] = d.contacts || []
        setContacts(list)
        return list          // return so callers can use the fresh data
      }
    } catch {}
    return []
  }, [])

  // ─── Initialise on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const list = await fetchContacts()
      if (mode === 'user' && list.length > 0) {
        // Auto-select first ops/admin contact as receiver
        const opsContact = list[0]
        setOpsReceiverId(opsContact.id)
        setSelectedContact(opsContact)
        // Fetch their conversation thread
        await fetchMessages(opsContact.id)
      }
      setLoading(false)
    }
    init()
  // fetchContacts and fetchMessages are stable ([] deps), safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // ─── Auto-refresh messages every 5 s ────────────────────────────────────────
  useEffect(() => {
    const id = mode === 'user' ? opsReceiverId : selectedContact?.id
    if (!id) return
    const interval = setInterval(() => fetchMessages(id), 5000)
    return () => clearInterval(interval)
  }, [mode, opsReceiverId, selectedContact, fetchMessages])

  // ─── Scroll to bottom when messages change ───────────────────────────────────
  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages])

  // ─── Open a conversation (ops mode) ─────────────────────────────────────────
  const openConversation = (contact: Contact) => {
    setSelectedContact(contact)
    fetchMessages(contact.id)
    setSearch('')
  }

  // ─── Send a message ──────────────────────────────────────────────────────────
  const sendMessage = async (attachmentUrl?: string, fileType?: string) => {
    if (!newMsg.trim() && !attachmentUrl) return

    // Determine receiver: in ops mode use selectedContact, in user mode use opsReceiverId
    const receiverId = mode === 'ops' ? selectedContact?.id : opsReceiverId
    if (!receiverId) return

    setSending(true)
    try {
      await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiverId,
          content: newMsg,
          attachment_url: attachmentUrl,
          file_type: fileType,
        }),
      })
      setNewMsg('')
      await fetchMessages(receiverId)
    } catch {}
    setSending(false)
  }

  // ─── File upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (d.url) await sendMessage(d.url, d.file_type)
    } catch {}
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ─── Filtered contacts for ops tabs ─────────────────────────────────────────
  const tabContacts = contacts
    .filter(c => c.role === tab)
    .filter(c =>
      c.fullname.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )

  const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0)

  // ─── Message bubble renderer ─────────────────────────────────────────────────
  const renderMessages = (isMe: (m: Message) => boolean, fromLabel: string) => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
          <span className="text-5xl mb-3">👋</span>
          <p className="font-semibold text-slate-600">No messages yet</p>
          <p className="text-sm mt-1">Start the conversation!</p>
        </div>
      ) : (
        messages.map(m => {
          const mine = isMe(m)
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                {!mine && <p className="text-[10px] text-slate-400 mb-1 ml-1">{fromLabel}</p>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${mine ? 'bg-navy text-white rounded-tr-sm' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm'}`}>
                  {m.content && <p>{m.content}</p>}
                  {m.attachment_url && (
                    <div className="mt-1.5">
                      {m.file_type === 'image'
                        ? <a href={m.attachment_url} target="_blank" rel="noopener noreferrer"><img src={m.attachment_url} alt="attachment" className="max-w-[180px] rounded-lg" /></a>
                        : <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${mine ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>📎 Download File</a>
                      }
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-1 mx-1">{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )
        })
      )}
      <div ref={chatEndRef} />
    </div>
  )

  // ─── Input bar renderer ──────────────────────────────────────────────────────
  const renderInput = (placeholder: string, canSend: boolean) => (
    <div className="p-3 bg-white border-t border-slate-100 flex gap-2 flex-shrink-0">
      <input type="file" ref={fileRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer text-base flex-shrink-0"
      >
        {uploading ? '⏳' : '📎'}
      </button>
      <input
        value={newMsg}
        onChange={e => setNewMsg(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && canSend && sendMessage()}
        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-navy"
      />
      <button
        onClick={() => sendMessage()}
        disabled={!newMsg.trim() || sending || !canSend}
        className="px-4 py-2 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer disabled:opacity-50 shadow-md shadow-accent/20 transition-opacity"
      >
        {sending ? '⏳' : 'Send'}
      </button>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // USER MODE (customer / vendor) — direct chat with ops team, no contact picker
  // ════════════════════════════════════════════════════════════════════════════
  if (mode === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        style={{ height: '480px' }}
      >
        {/* Header */}
        <div className="bg-navy text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎧</span>
            <div>
              <h3 className="font-bold font-heading text-sm">Chat with Support</h3>
              <p className="text-xs text-white/50">Operations Team · Karya Saarthi</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors text-sm">✕</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {renderMessages(m => m.sender?.id === currentUserId, 'Support Team')}
            {renderInput('Type your message...', opsReceiverId !== null)}
          </>
        )}
      </motion.div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // OPS MODE — two tabs (Customers / Vendors) + contact list + chat thread
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col w-full max-w-2xl"
        style={{ height: '580px' }}
      >
      {/* Top bar */}
      <div className="bg-navy text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">💬</span>
          <div>
            <h3 className="font-bold font-heading text-sm">
              Direct Messages
              {totalUnread > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{totalUnread}</span>}
            </h3>
            <p className="text-xs text-white/50">Chat with customers or vendors</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors text-sm">✕</button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        {(['customer', 'vendor'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedContact(null); setMessages([]) }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              tab === t
                ? t === 'customer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t === 'customer' ? '👤 Customers' : '🏪 Vendors'}
            {contacts.filter(c => c.role === t && c.unreadCount > 0).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Contact list */}
        <div className={`flex flex-col border-r border-slate-100 ${selectedContact ? 'hidden sm:flex sm:w-52' : 'flex w-full sm:w-52'}`}>
          <div className="p-2.5 border-b border-slate-100">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${tab}s...`}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-navy"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border-b border-slate-50">
                  <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : tabContacts.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <p className="text-2xl mb-2">{tab === 'customer' ? '👤' : '🏪'}</p>
                <p className="text-xs">No {tab}s registered yet</p>
              </div>
            ) : (
              tabContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => openConversation(contact)}
                  className={`w-full flex items-center gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left cursor-pointer ${selectedContact?.id === contact.id ? (tab === 'customer' ? 'bg-blue-50' : 'bg-teal-50') : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${tab === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                      {contact.fullname.charAt(0).toUpperCase()}
                    </div>
                    {contact.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{contact.fullname}</p>
                    {contact.lastMessage ? (
                      <p className={`text-[10px] truncate mt-0.5 ${contact.unreadCount > 0 ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
                        {contact.lastMessage.sender_id === currentUserId ? 'You: ' : ''}{contact.lastMessage.content || '📎 File'}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">{contact.email}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat thread */}
        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div key={selectedContact.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                <button
                  onClick={() => { setSelectedContact(null); setMessages([]) }}
                  className="sm:hidden w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs cursor-pointer"
                >←</button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${tab === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                  {selectedContact.fullname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">{selectedContact.fullname}</p>
                  <p className="text-[10px] text-slate-400">{selectedContact.email}</p>
                </div>
              </div>

              {renderMessages(m => m.sender?.id === currentUserId, selectedContact.fullname)}
              {renderInput(`Message ${selectedContact.fullname}...`, true)}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden sm:flex flex-1 items-center justify-center flex-col text-slate-400 text-center p-6">
              <span className="text-5xl mb-3">{tab === 'customer' ? '👤' : '🏪'}</span>
              <p className="font-semibold text-slate-500">Select a {tab}</p>
              <p className="text-sm mt-1">Choose a {tab} from the list to start chatting</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </motion.div>
  )
}
