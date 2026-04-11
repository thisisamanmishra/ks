'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  type: 'bot' | 'user'
  text: string
  time: string
}

const FAQ_RESPONSES: Record<string, string> = {
  // Greetings
  'hi': '👋 Hello! Welcome to Karya Saarthi. I can help you with services, pricing, delivery, and more. What are you looking for?',
  'hello': '👋 Hi there! I\'m the Karya Saarthi assistant. Ask me about our services, pricing, or how to get started.',
  'hey': '👋 Hey! How can I help you today?',

  // Services
  'services': '🛍️ We offer services across 4 categories:\n\n• **Academic** — Thesis, research papers, project reports\n• **Technical** — Website, app, data analysis\n• **Business** — Business plans, consulting, legal docs\n• **Government** — Tender docs, compliance, proposals\n\nVisit /services to explore all offerings!',
  'academic': '🎓 Our academic services include:\n• Thesis & Research Paper Writing\n• MBA/BBA Project Reports\n• Assignment Help\n• Data Analysis (SPSS, Excel, Python)\n\nStarting from ₹500. [View Academic Services →](/services?category=academic)',
  'technical': '💻 Our technical services include:\n• Website Development\n• Mobile App Development\n• Data Analysis & Dashboards\n• UI/UX Design\n\nStarting from ₹1,000. [View Technical Services →](/services?category=technical)',
  'business': '💼 Our business services include:\n• Business Plan Writing\n• Company Registration\n• Resume & LinkedIn\n• Financial Projections\n\nStarting from ₹500. [View Business Services →](/services?category=business)',
  'government': '🏛️ Our government services include:\n• Tender Documentation\n• Compliance Support\n• MOU/Agreement Drafting\n• Proposal Preparation\n\nStarting from ₹5,000. [View Govt Services →](/services?category=government)',

  // Pricing
  'price': '💰 Our pricing starts from:\n• Academic: ₹500\n• Technical: ₹1,000\n• Business: ₹500\n• Government: ₹5,000\n\nWe also offer custom quotes for large projects!',
  'pricing': '💰 Our pricing is transparent and competitive. Prices vary by complexity. You can get a **free custom quote** at [/contact?type=quote](/contact?type=quote).',
  'cost': '💰 Costs depend on the service and complexity. Use our [free consultation](/contact) to get an accurate estimate.',
  'free': '🆓 Yes! We offer:\n• Free initial consultation\n• Free sample project download\n• Free custom quote\n\nBook a free slot at [/contact](/contact)!',
  'discount': '🎁 Enter a referral code at checkout for discounts. Ask your campus ambassador for a code!',

  // Delivery
  'delivery': '🕐 Delivery times vary:\n• Quick projects: 1-3 days\n• Standard: 5-7 days\n• Complex: 10-30 days\n\nEach service shows estimated delivery on its listing page.',
  'deadline': '📅 We can accommodate urgent deadlines. Contact us via WhatsApp for express delivery options.',
  'time': '⏱️ Delivery timelines are shown on each service page. Express options available — contact us!',

  // Process
  'how': '📋 Our process:\n1. Browse & select a service\n2. Submit enquiry or book instantly\n3. We match you with an expert\n4. Work begins within 24 hours\n5. Deliver to your specifications',
  'process': '📋 It\'s simple:\n1. Choose a service → 2. Enquire or Book → 3. Expert assigned → 4. Delivery + Revisions → 5. All done!',
  'payment': '💳 We accept secure payments via **Razorpay** — UPI, cards, net banking, EMI. 100% secure.',

  // Contact
  'contact': '📞 You can reach us via:\n• WhatsApp: +91-XXXXXXXXXX\n• Email: support@karyasaarthi.com\n• Free consultation: [Book Now →](/contact)',
  'whatsapp': '💬 Chat with us on WhatsApp right now! Click the WhatsApp button at the bottom-right of your screen.',
  'phone': '📞 Call us or book a callback. We\'re available Mon-Sat, 9am-7pm IST.',
  'email': '📧 Email us at support@karyasaarthi.com. We reply within 2-4 hours.',
  'support': '🛟 We\'re here to help! You can:\n• Chat with us here\n• WhatsApp us (button bottom-right)\n• Book a [free consultation](/contact)\n• Email support@karyasaarthi.com',

  // Account
  'login': '🔐 Login at [/login](/login). New user? Sign up at [/signup](/signup).',
  'signup': '📝 Create an account at [/signup](/signup) to track orders and manage projects.',
  'account': '👤 Manage your account at [/dashboard](/dashboard) after logging in.',
}

function getResponse(input: string): string {
  const lower = input.toLowerCase().trim()
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) return response
  }
  return '🤔 I\'m not sure about that. Let me connect you with a human agent!\n\n👉 **Options:**\n• [WhatsApp Chat](https://wa.me/919999999999)\n• [Book Free Consultation](/contact)\n• Email: support@karyasaarthi.com'
}

function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', type: 'bot', text: '👋 Hi! I\'m Karya, your virtual assistant. Ask me anything about our services, pricing, or delivery!', time: now() }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: Date.now().toString(), type: 'user', text, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const response = getResponse(text)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'bot', text: response, time: now() }])
      setTyping(false)
    }, 800 + Math.random() * 600)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-20">
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-3 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            style={{ maxHeight: '480px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1B3A6B, #0f2545)' }}>
              <div className="w-9 h-9 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-lg flex-shrink-0">
                🤖
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Karya Assistant</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/50 text-[10px]">Online · Replies instantly</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white cursor-pointer text-lg">
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50" style={{ maxHeight: '320px' }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {msg.type === 'bot' && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5"
                      style={{ background: '#1B3A6B0F' }}>
                      🤖
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    msg.type === 'user'
                      ? 'bg-navy text-white rounded-br-sm'
                      : 'bg-white text-slate-700 shadow-sm rounded-bl-sm border border-slate-100'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                    <div className={`text-[9px] mt-1 ${msg.type === 'user' ? 'text-white/50' : 'text-slate-300'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-navy/5 flex items-center justify-center text-xs">🤖</div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-slate-100 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-3 py-2 border-t border-slate-100 bg-white">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {['Services', 'Pricing', 'How it works', 'Contact'].map(q => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 0) }}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border border-slate-200 text-slate-600 hover:border-navy hover:text-navy cursor-pointer bg-slate-50 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-slate-100 bg-white flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-navy"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm cursor-pointer disabled:opacity-40 transition-all flex-shrink-0"
                style={{ background: '#FF6B35' }}>
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-13 h-13 rounded-2xl shadow-xl flex items-center justify-center text-2xl text-white cursor-pointer relative"
        style={{ background: 'linear-gradient(135deg, #1B3A6B, #0f2545)', width: 52, height: 52 }}>
        <AnimatePresence mode="wait">
          <motion.span key={open ? 'close' : 'open'} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            {open ? '✕' : '🤖'}
          </motion.span>
        </AnimatePresence>
        {!open && messages.length === 1 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
      </motion.button>
    </div>
  )
}
