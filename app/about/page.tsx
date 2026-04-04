'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'

const timeline = [
  { year: '2024', title: 'KaryaSaarthi Founded', desc: 'Started with a vision to make professional services accessible to every student and business.' },
  { year: '2024', title: 'First 100 Clients', desc: 'Crossed 100 happy clients within 6 months of launch.' },
  { year: '2025', title: '500+ Projects Done', desc: 'Expanded to 50+ service categories across academic, tech, and design.' },
  { year: '2025', title: 'Going Digital', desc: 'Launched online platform with AI-powered service matching and project tracking.' },
]

const team = [
  {
    name: 'Adv. Saloni Kumari',
    role: 'Founder & Director',
    image: '/images/team/Saloni.jpg',
    vision: 'To create a global platform where knowledge meets opportunity, making quality education and professional services accessible to every student and business across India and beyond.',
    mission: 'To empower 10 million students and 1 million businesses by 2030 through collaborative learning and affordable professional services.',
    statement: 'As a legal professional turned entrepreneur, I\'ve witnessed the gap between what education teaches and what the industry demands. KaryaSaarthi bridges that gap. We are not service providers; we are growth partners.',
  },
  {
    name: 'Pawandeep Kaur',
    role: 'Co-Founder & Project Manager Head',
    image: '/images/team/Pawandeep.jpg',
    vision: 'To build the most efficient and customer-centric project delivery system in India.',
    mission: 'To ensure 100% on-time delivery with 98%+ customer satisfaction through transparent communication and quality control.',
    statement: 'Project management is not about deadlines alone - it\'s about people. Every project has a student behind it with dreams. My role is to ensure they sleep peacefully knowing their project is in safe hands.',
  },
  {
    name: 'Bhawna',
    role: 'HR Executive',
    image: '/images/team/Bhawna.jpeg',
    vision: 'To build the strongest network of verified experts where talent meets opportunity.',
    mission: 'To recruit, train, and retain the best talent with 1000+ verified experts across 100+ specializations by 2027.',
    statement: 'People are our biggest asset. Every vendor we hire, every intern we train - they all contribute to the KaryaSaarthi family.',
  },
  {
    name: 'Rakhi Bhatt',
    role: 'Operations Manager',
    image: '/images/team/Rakhi.jpeg',
    vision: 'To create the most streamlined operational framework where every customer query is resolved within hours.',
    mission: 'To maintain 99% operational efficiency through daily monitoring, customer feedback integration, and continuous improvement.',
    statement: 'Operations is the backbone of any business. I monitor, I improve, I optimize - daily.',
  },
  {
    name: 'Annu Priya',
    role: 'Digital Marketing Executive',
    image: '/images/team/Annu.jpg',
    vision: 'To make KaryaSaarthi a household name across India through strategic digital marketing.',
    mission: 'To grow online presence to 500K+ followers across platforms by 2027 and generate 10,000+ monthly leads.',
    statement: 'In today\'s digital age, if you\'re not online, you don\'t exist. I ensure we reach those who need us most.',
  },
  {
    name: 'Anish',
    role: 'Management Head',
    image: '/images/team/Anish1.jpeg',
    vision: 'To oversee all business operations with strategic precision, ensuring sustainable growth and financial stability.',
    mission: 'To manage cash flows, oversee departmental performance, and ensure KaryaSaarthi scales efficiently.',
    statement: 'Good management is invisible - things just work. I manage the business so the team can focus on serving customers.',
  },
]

const achievements = [
  { icon: '🏆', value: '500+', label: 'Projects Delivered' },
  { icon: '⭐', value: '4.9/5', label: 'Average Rating' },
  { icon: '🎓', value: '50+', label: 'Service Categories' },
  { icon: '🌐', value: '10+', label: 'Cities Served' },
  { icon: '👨‍💼', value: '100+', label: 'Verified Experts' },
  { icon: '🔄', value: '80%', label: 'Repeat Rate' },
]

export default function AboutPage() {
  const [flipped, setFlipped] = useState<number | null>(null)

  return (
    <>
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-20 bg-white min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-navy to-navy-dark text-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-4">Our Story</span>
              <h1 className="text-3xl lg:text-5xl font-bold font-heading">About KaryaSaarthi</h1>
              <p className="mt-4 text-white/60 max-w-2xl mx-auto">From a small idea to India&apos;s most trusted work companion — powered by passion, driven by purpose.</p>
            </motion.div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-14 font-heading">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-navy via-accent to-navy-light hidden md:block" />
              <div className="space-y-8 lg:space-y-12">
                {timeline.map((item, i) => (
                  <motion.div
                    key={i}
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
                        <p className="text-slate-500 text-sm mt-2">{item.desc}</p>
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

        {/* Vision & Mission — Founder Quote */}
        <section className="py-16 lg:py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-14 font-heading">Our Vision & Mission</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 lg:p-10">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-navy mb-4 font-heading">Vision</h3>
                <p className="text-slate-600 leading-relaxed">&ldquo;To create a global platform where knowledge meets opportunity, making quality education and professional services accessible to every student and business across India and beyond. KaryaSaarthi will be the most trusted companion in every individual&apos;s professional and academic journey.&rdquo;</p>
                <p className="mt-4 text-accent font-semibold text-sm">— Adv. Saloni Kumari, Founder</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 lg:p-10">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-navy mb-4 font-heading">Mission</h3>
                <p className="text-slate-600 leading-relaxed">&ldquo;To empower 10 million students and 1 million businesses by 2030 through collaborative learning and affordable professional services. We don&apos;t just complete projects — we build capabilities, transform lives, and create lasting partnerships.&rdquo;</p>
                <p className="mt-4 text-accent font-semibold text-sm">— Adv. Saloni Kumari, Founder</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-4 font-heading">Meet Our Team</h2>
            <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">The passionate people behind KaryaSaarthi — click a card to know more!</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((m, i) => (
                <motion.div
                  key={m.name}
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
                        <Image src={m.image} alt={m.name} fill className="object-contain p-4" sizes="(max-width: 768px) 100vw, 33vw" />
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
                        <div>
                          <span className="text-accent font-semibold text-xs">VISION</span>
                          <p className="text-white/70 text-xs leading-relaxed mt-1">{m.vision}</p>
                        </div>
                        <div>
                          <span className="text-accent font-semibold text-xs">MISSION</span>
                          <p className="text-white/70 text-xs leading-relaxed mt-1">{m.mission}</p>
                        </div>
                        <div>
                          <span className="text-accent font-semibold text-xs">STATEMENT</span>
                          <p className="text-white/60 text-xs italic leading-relaxed mt-1">&ldquo;{m.statement}&rdquo;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-16 lg:py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-4xl font-bold text-navy text-center mb-14 font-heading">Our Achievements</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map(a => (
                <motion.div
                  key={a.label}
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
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}
