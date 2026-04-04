'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const TestimonialBubble = dynamic(() => import('./ThreeElements').then(m => m.TestimonialBubble), { ssr: false })

const testimonials = [
  { text: 'My mentor accepted my thesis and everything is perfect! KaryaSaarthi made it so easy.', name: 'Ashish', role: 'MBA Student', rating: 5 },
  { text: 'Thanks for helping with my master\'s thesis! Great job — everything was well-organized.', name: 'Anshika', role: 'Research Scholar', rating: 5 },
  { text: 'I really liked your work and would recommend to my friends for sure!', name: 'Shakshi', role: 'Business Owner', rating: 5 },
  { text: 'Best website development service I\'ve ever used. Clean code, modern design, great communication.', name: 'Rahul', role: 'Startup Founder', rating: 5 },
  { text: 'The logo design exceeded my expectations. Professional, creative, and delivered on time.', name: 'Priya', role: 'Small Business', rating: 5 },
  { text: 'Outstanding resume writing service — got 3 interview calls within a week!', name: 'Amit', role: 'Job Seeker', rating: 5 },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Background 3D pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-navy" />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-accent" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-navy-light" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">Reviews</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">What Our Clients Say</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-surface rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-slate-100 relative group hover:-translate-y-1"
            >
              {/* 3D Speech Bubble */}
              <div className="absolute -top-3 -right-3 opacity-70 group-hover:opacity-100 transition-opacity">
                <TestimonialBubble variant={i} />
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-amber-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-slate-600 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-accent flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-navy text-sm">{t.name}</h4>
                  <p className="text-slate-400 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
