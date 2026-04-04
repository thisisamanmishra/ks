'use client'

import { motion } from 'framer-motion'

const featuredPosts = [
  { title: 'How to Write a Winning Thesis in 2025', category: 'Academic', date: 'Mar 15, 2025', readTime: '8 min', excerpt: 'Master the art of thesis writing with expert tips on research, structure, and presentation.' },
  { title: 'Top 10 Website Design Trends', category: 'Tech', date: 'Mar 12, 2025', readTime: '6 min', excerpt: 'Explore the latest web design trends that will dominate in 2025 and beyond.' },
  { title: 'SEO Strategies That Actually Work', category: 'Marketing', date: 'Mar 10, 2025', readTime: '10 min', excerpt: 'Proven SEO techniques to boost your website ranking and drive organic traffic.' },
  { title: 'Building a Personal Brand Online', category: 'Career', date: 'Mar 8, 2025', readTime: '5 min', excerpt: 'A step-by-step guide to creating a powerful personal brand that gets you noticed.' },
  { title: 'Resume Writing: Do\'s and Don\'ts', category: 'Career', date: 'Mar 5, 2025', readTime: '7 min', excerpt: 'Common resume mistakes and how to craft a resume that lands interviews.' },
  { title: 'Freelancing in India: A Complete Guide', category: 'Business', date: 'Mar 1, 2025', readTime: '12 min', excerpt: 'Everything you need to know about starting your freelancing journey in India.' },
]

export default function BlogSection() {
  return (
    <section id="blog" className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-navy/5 text-navy text-sm font-semibold mb-4">Blog</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy font-heading">Insights & Resources</h2>
          <p className="mt-4 text-slate-500">Expert tips, tutorials, and industry insights to help you succeed.</p>
        </motion.div>

        {/* Featured + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured article */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 lg:row-span-2 bg-navy rounded-2xl p-8 lg:p-10 text-white flex flex-col justify-end relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy/80 to-transparent" />
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-accent text-white text-xs font-bold mb-4">{featuredPosts[0].category}</span>
              <h3 className="text-2xl lg:text-3xl font-bold mb-3 font-heading group-hover:text-accent transition-colors">{featuredPosts[0].title}</h3>
              <p className="text-white/70 mb-4">{featuredPosts[0].excerpt}</p>
              <div className="flex items-center gap-4 text-white/50 text-sm">
                <span>{featuredPosts[0].date}</span>
                <span>•</span>
                <span>{featuredPosts[0].readTime} read</span>
              </div>
            </div>
          </motion.article>

          {/* Cards */}
          {featuredPosts.slice(1, 5).map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-6 hover:shadow-lg border border-slate-100 transition-all duration-300 cursor-pointer group"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">{post.category}</span>
              <h3 className="font-bold text-navy mt-2 mb-2 font-heading group-hover:text-accent transition-colors">{post.title}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime} read</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
