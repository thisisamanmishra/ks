'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Google SVG Icons
const GoogleG = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fbbc04"/>
  </svg>
)

interface GoogleReview {
  author_name: string
  profile_photo_url: string
  rating: number
  relative_time_description: string
  text: string
}

export default function TestimonialsSection() {
  const [data, setData] = useState<{ reviews: GoogleReview[], rating: number, total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/google-reviews')
        if (res.ok) {
          const d = await res.json()
          setData({
            reviews: d.reviews || [],
            rating: d.rating || 5,
            total: d.user_ratings_total || 0
          })
        }
      } catch (err) {
        console.error('Failed to load reviews', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <section className="py-20 lg:py-28 bg-slate-50 relative overflow-hidden flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </section>
    )
  }

  if (!data || data.reviews.length === 0) return null

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-slate-50 relative overflow-hidden border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
               <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 font-heading">Excellent</h2>
               <div className="flex gap-0.5 mt-1">
                 {Array.from({ length: Math.round(data.rating) }).map((_, i) => <StarIcon key={i} />)}
               </div>
             </div>
             <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600 font-medium">
               <span>Based on {data.total} reviews</span>
               <span>on</span>
               <div className="flex items-center"><GoogleG /></div>
             </div>
          </div>
          
          <a href="https://search.google.com/local/writereview?placeid=PLACEHOLDER" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-full text-sm font-semibold text-slate-700 hover:shadow-md hover:border-slate-300 transition-all">
            <GoogleG />
            Review us on Google
          </a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.reviews.slice(0, 3).map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 relative hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute top-6 right-6">
                <GoogleG />
              </div>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center font-bold text-xl text-slate-500 border border-slate-200">
                  {r.profile_photo_url ? (
                    <Image src={r.profile_photo_url} alt={r.author_name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    r.author_name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-[15px] leading-tight pr-6">{r.author_name}</h4>
                  <p className="text-slate-500 text-[13px] mt-1">{r.relative_time_description}</p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <StarIcon key={j} />
                ))}
              </div>
              <p className="text-slate-700 text-[15px] leading-relaxed line-clamp-4">"{r.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
