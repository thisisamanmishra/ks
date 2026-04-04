'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const allProducts = [
  { title: 'Thesis & Dissertation', category: 'Academic', desc: 'Complete research writing with guidance' },
  { title: 'MBA Project Report', category: 'Academic', desc: 'Industry-standard project reports' },
  { title: 'Assignment Help', category: 'Academic', desc: 'All subjects, all levels' },
  { title: 'Resume Writing', category: 'Writing', desc: 'ATS-friendly professional resumes' },
  { title: 'Cover Letter', category: 'Writing', desc: 'Tailored to your dream job' },
  { title: 'Blog Writing', category: 'Writing', desc: 'SEO-optimized articles' },
  { title: 'Website Development', category: 'Tech', desc: 'Modern responsive websites' },
  { title: 'Mobile App', category: 'Tech', desc: 'iOS & Android apps' },
  { title: 'E-commerce Store', category: 'Tech', desc: 'Full-featured online stores' },
  { title: 'Logo Design', category: 'Design', desc: 'Unique brand identity' },
  { title: 'Social Media Graphics', category: 'Design', desc: 'Eye-catching visuals' },
  { title: 'Video Editing', category: 'Design', desc: 'Professional video production' },
  { title: 'SEO Optimization', category: 'Marketing', desc: 'Rank higher on Google' },
  { title: 'Social Media Marketing', category: 'Marketing', desc: 'Grow your audience' },
  { title: 'Google Ads', category: 'Marketing', desc: 'Targeted ad campaigns' },
  { title: 'Data Analysis', category: 'Business', desc: 'Insights & visualization' },
  { title: 'Financial Modeling', category: 'Business', desc: 'Excel & projection models' },
  { title: 'Presentation Design', category: 'Business', desc: 'Stunning PPTs & pitch decks' },
]

const productCategories = ['All', 'Academic', 'Writing', 'Tech', 'Design', 'Marketing', 'Business']

export default function ProductsSection() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = allProducts.filter(p => {
    const matchesCat = category === 'All' || p.category === category
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <section id="products" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">Explore</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Browse All Services</h2>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Scalable solutions for every need — search from our growing library of 1000+ services.</p>
        </motion.div>

        {/* Search + Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {productCategories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  category === c ? 'bg-navy text-white' : 'bg-surface text-slate-600 hover:bg-navy/5'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">{p.category}</span>
              <h3 className="font-bold text-navy text-lg mt-2 mb-2 font-heading">{p.title}</h3>
              <p className="text-slate-500 text-sm mb-5">{p.desc}</p>
              <button className="px-5 py-2.5 rounded-xl bg-accent/10 text-accent font-semibold text-sm hover:bg-accent hover:text-white transition-all duration-300 cursor-pointer">
                Get Quote
              </button>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No services found. Try a different search.</p>
          </div>
        )}
      </div>
    </section>
  )
}
