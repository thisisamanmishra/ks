'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'

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
}

interface Achievement {
  id: number
  icon: string
  value: string
  label: string
}

interface Company {
  vision: string
  mission: string
  story: string
  tagline: string
}

interface AboutData {
  company: Company
  timeline: TimelineItem[]
  achievements: Achievement[]
  members: Member[]
}

export default function AboutPage() {
  const [flipped, setFlipped] = useState<number | null>(null)
  const [data, setData] = useState<AboutData>({
    company: { vision: '', mission: '', story: '', tagline: '' },
    timeline: [],
    achievements: [],
    members: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/about')
      .then(r => r.json())
      .then(d => {
        setData({
          company: d.company || {},
          timeline: d.timeline || [],
          achievements: d.achievements || [],
          members: d.members || [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-20 bg-white min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-navy to-navy-dark text-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-4">Our Story</span>
              <h1 className="text-3xl lg:text-5xl font-bold font-heading">About Karya Saarthi</h1>
              <p className="mt-4 text-white/60 max-w-2xl mx-auto">
                {data.company.tagline || 'From a small idea to India\'s most trusted work companion — powered by passion, driven by purpose.'}
              </p>
            </motion.div>
          </div>
        </section>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-20 space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Timeline */}
            {data.timeline.length > 0 && (
              <section className="py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-14 font-heading">Our Journey</h2>
                  <div className="relative">
                    <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-navy via-accent to-navy-light hidden md:block" />
                    <div className="space-y-8 lg:space-y-12">
                      {data.timeline.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 }}
                          className={`flex flex-col md:flex-row items-center gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                        >
                          <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-xl transition-shadow">
                              <span className="text-accent font-bold text-sm">{item.year}</span>
                              <h4 className="text-lg font-bold text-navy mt-1 font-heading">{item.title}</h4>
                              <p className="text-slate-500 text-sm mt-2">{item.description}</p>
                            </div>
                          </div>
                          <div className="hidden md:flex w-4 h-4 bg-accent rounded-full border-4 border-white shadow-lg flex-shrink-0 z-10" />
                          <div className="flex-1" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Vision & Mission */}
            {(data.company.vision || data.company.mission) && (
              <section className="py-16 lg:py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-14 font-heading">Our Vision &amp; Mission</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 lg:p-10">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-2xl font-bold text-navy mb-4 font-heading">Vision</h3>
                      <p className="text-slate-600 leading-relaxed">&ldquo;{data.company.vision}&rdquo;</p>
                      {data.members[0] && (
                        <p className="mt-4 text-accent font-semibold text-sm">— {data.members[0].name}, {data.members[0].role}</p>
                      )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 lg:p-10">
                      <div className="text-4xl mb-4">🚀</div>
                      <h3 className="text-2xl font-bold text-navy mb-4 font-heading">Mission</h3>
                      <p className="text-slate-600 leading-relaxed">&ldquo;{data.company.mission}&rdquo;</p>
                      {data.members[0] && (
                        <p className="mt-4 text-accent font-semibold text-sm">— {data.members[0].name}, {data.members[0].role}</p>
                      )}
                    </motion.div>
                  </div>
                </div>
              </section>
            )}

            {/* Team Section */}
            {data.members.length > 0 && (
              <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-4 font-heading">Meet Our Team</h2>
                  <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">The passionate people behind Karya Saarthi — click a card to know more!</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.members.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setFlipped(flipped === i ? null : i)}
                        className="cursor-pointer perspective-1000"
                      >
                        <div className={`relative h-[420px] transition-transform duration-700 transform-style-3d ${flipped === i ? '[transform:rotateY(180deg)]' : ''}`}>
                          {/* Front */}
                          <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-white">
                            <div className="h-56 relative overflow-hidden bg-gradient-to-br from-navy/10 to-accent/10">
                              {m.image_url ? (
                                <Image
                                  src={m.image_url}
                                  alt={m.name}
                                  fill
                                  className="object-contain p-4"
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  onError={() => {}}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-6xl text-navy/20 font-bold">{m.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <div className="p-5 text-center">
                              <h4 className="font-bold text-navy text-lg font-heading">{m.name}</h4>
                              <p className="text-accent text-sm font-semibold mt-1">{m.role}</p>
                              <p className="text-slate-400 text-xs mt-3">Click to flip →</p>
                            </div>
                          </div>

                          {/* Back */}
                          <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-2xl overflow-hidden shadow-lg bg-navy text-white p-6 flex flex-col justify-center">
                            <h4 className="font-bold text-lg font-heading mb-1">{m.name}</h4>
                            <p className="text-accent text-sm font-semibold mb-4">{m.role}</p>
                            <div className="space-y-3 text-sm">
                              {m.vision && (
                                <div>
                                  <span className="text-accent font-semibold text-xs">VISION</span>
                                  <p className="text-white/70 text-xs leading-relaxed mt-1">{m.vision}</p>
                                </div>
                              )}
                              {m.mission && (
                                <div>
                                  <span className="text-accent font-semibold text-xs">MISSION</span>
                                  <p className="text-white/70 text-xs leading-relaxed mt-1">{m.mission}</p>
                                </div>
                              )}
                              {m.statement && (
                                <div>
                                  <span className="text-accent font-semibold text-xs">STATEMENT</span>
                                  <p className="text-white/60 text-xs italic leading-relaxed mt-1">&ldquo;{m.statement}&rdquo;</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Achievements */}
            {data.achievements.length > 0 && (
              <section className="py-16 lg:py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-14 font-heading">Our Achievements</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.achievements.map(a => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="text-4xl mb-3">{a.icon}</div>
                        <div className="text-3xl font-extrabold text-navy font-heading">{a.value}</div>
                        <div className="text-slate-500 text-sm mt-1">{a.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}
