'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

const teamMembers = [
  { name: 'Adv. Saloni Kumari', role: 'Founder & Director', img: '/images/team/Saloni.jpeg', email: 'karyasaarthi@gmail.com', vision: 'Leading KaryaSaarthi with vision and dedication to help students and businesses achieve their goals through collaborative learning.' },
  { name: 'Anish', role: 'Co-Founder & Management Head', img: '/images/team/Anish.jpeg', email: 'info.karyasaarthi@gmail.com', vision: 'Overseeing operations and strategic management to ensure excellence in service delivery and client satisfaction.' },
  { name: 'Bhawna', role: 'HR Executive', img: '/images/team/Bhawna.jpeg', email: 'hr.karyasaarthi@gmail.com', vision: 'Managing talent acquisition and ensuring our team delivers exceptional service.' },
  { name: 'Pawandeep Kaur', role: 'Project Manager', img: '/images/team/Pawandeep.jpeg', email: 'pm.karyasarthi@gmail.com', vision: 'Ensuring timely delivery of all client projects with quality and precision.' },
  { name: 'Rakhi Bhatt', role: 'Operations Assistant', img: '/images/team/Rakhi.jpeg', email: 'opt.karyasarthi@gmail.com', vision: 'Supporting smooth workflows across all departments for optimal delivery.' },
  { name: 'Annu Priya', role: 'Digital Marketing Executive', img: '/images/team/Annu.jpeg', email: 'digitalmarketingkaryasaarthi@gmail.com', vision: 'Driving digital presence and marketing strategies across all platforms.' },
]

function TeamCard({ member }: { member: typeof teamMembers[0] }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`relative w-full h-80 transition-transform duration-700 transform-3d ${flipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl border border-slate-100 transition-shadow" style={{ backfaceVisibility: 'hidden' }}>
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-navy/10 shadow-lg">
              <Image src={member.img} alt={member.name} width={96} height={96} className="w-full h-full object-cover object-top" />
            </div>
            <h3 className="font-bold text-navy text-lg font-heading">{member.name}</h3>
            <p className="text-accent font-semibold text-sm mt-1">{member.role}</p>
            <p className="text-slate-400 text-xs mt-3">Click to see vision →</p>
          </div>
        </div>
        {/* Back */}
        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden bg-navy text-white shadow-xl rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <h3 className="font-bold text-lg mb-3 font-heading">{member.name}</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">{member.vision}</p>
            <a href={`mailto:${member.email}`} className="text-accent text-sm font-medium hover:underline">
              ✉ {member.email}
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function TeamSection() {
  return (
    <section id="team" className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/5 text-navy text-sm font-semibold mb-4">Our Team</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Meet Our Leadership</h2>
          <p className="mt-4 text-slate-500">The passionate people behind your success</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map(m => <TeamCard key={m.name} member={m} />)}
        </div>
      </div>
    </section>
  )
}
