'use client'

import Link from 'next/link'

const footerLinks = [
  {
    title: 'Services',
    links: [
      { label: 'Programming & Tech', href: '/services' },
      { label: 'Graphics & Design', href: '/services' },
      { label: 'Digital Marketing', href: '/services' },
      { label: 'Writing & Translation', href: '/services' },
      { label: 'Video & Animation', href: '/services' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Team', href: '/about' },
      { label: 'Blog', href: '/blogs' },
      { label: 'Contact', href: '/contact' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Get Free Quote', href: '/contact' },
      { label: 'Track Project', href: '/dashboard' },
      { label: 'WhatsApp Support', href: 'https://wa.me/918595025753' },
      { label: 'Email Us', href: 'mailto:support@karyasaarthi.com' },
    ],
  },
]

const socialLinks = [
  { icon: '📸', label: 'Instagram', href: 'https://www.instagram.com/karyasaarthi/', hoverBg: 'hover:bg-gradient-to-br hover:from-pink-500/20 hover:to-orange-500/20' },
  { icon: '📘', label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61576877739779', hoverBg: 'hover:bg-blue-600/20' },
  { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com/in/karya-saarthi🤝-693a01369', hoverBg: 'hover:bg-blue-500/20' },
  { icon: '🐦', label: 'X (Twitter)', href: 'https://x.com/karyasaarthi', hoverBg: 'hover:bg-slate-300/20' },
  { icon: '🧵', label: 'Threads', href: 'https://www.threads.com/@karyasaarthi', hoverBg: 'hover:bg-slate-300/20' },
  { icon: '▶️', label: 'YouTube', href: 'https://www.youtube.com/@KaryaSaarthi', hoverBg: 'hover:bg-red-500/20' },
  { icon: '✈️', label: 'Telegram', href: 'https://t.me/karyasaarthi', hoverBg: 'hover:bg-sky-500/20' },
  { icon: '💬', label: 'WhatsApp', href: 'https://whatsapp.com/channel/0029Vb66k5vADTO79QKvGx0L', hoverBg: 'hover:bg-green-500/20' },
  { icon: '👻', label: 'Snapchat', href: 'https://www.snapchat.com/add/karya_saarthi?share_id=JTWyldpGLC8&locale=en-IN', hoverBg: 'hover:bg-yellow-400/20' },
  { icon: '📌', label: 'Pinterest', href: 'https://pin.it/1GwGBkfOk', hoverBg: 'hover:bg-red-600/20' },
  { icon: '🤖', label: 'Reddit', href: 'https://www.reddit.com/u/karyasaarthi/s/VtEUQQe570', hoverBg: 'hover:bg-orange-600/20' },
  { icon: '❓', label: 'Quora', href: 'https://www.quora.com/profile/Karya-Saarthi?ch=10&oid=3096712882&share=e75200b1&srid=5T7uhZ&target_type=user', hoverBg: 'hover:bg-red-700/20' },
  { icon: '📝', label: 'Tumblr', href: 'https://www.tumblr.com/karyasaarthi?source=share', hoverBg: 'hover:bg-indigo-500/20' },
  { icon: '🎮', label: 'Twitch', href: 'https://www.twitch.tv/karyasaarthi?sr=a', hoverBg: 'hover:bg-purple-500/20' },
  { icon: '🦋', label: 'Bluesky', href: 'https://bsky.app/profile/karyasaarthi.bsky.social', hoverBg: 'hover:bg-sky-400/20' },
]

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold font-heading mb-4">
              Karya <span className="text-accent">Saarthi</span>
            </h3>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Your trusted work companion. We guide, teach, and empower you to succeed in academics and business.
            </p>
            <p className="text-white/40 text-xs mb-4">
              &ldquo;Hum Hai Aapke Saathi&rdquo;
            </p>
            <a
              href="https://www.karyasaarthi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent text-sm font-semibold hover:text-accent-light transition-colors"
            >
              🌐 www.karyasaarthi.com
            </a>
          </div>

          {/* Links columns */}
          {footerLinks.map(col => (
            <div key={col.title}>
              <h4 className="font-bold text-white mb-4 font-heading">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/60 text-sm hover:text-accent transition-colors"
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <h5 className="font-semibold text-sm">Address</h5>
                <p className="text-white/50 text-sm">Gali No 1, Block A, Uttarakhand Enclave, Nathupura, Burari, North Delhi, Delhi 110084</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📱</span>
              <div>
                <h5 className="font-semibold text-sm">Phone</h5>
                <p className="text-white/50 text-sm">+91 8595025753 / +91 6238521530</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">✉️</span>
              <div>
                <h5 className="font-semibold text-sm">Email</h5>
                <p className="text-white/50 text-sm">support@karyasaarthi.com</p>
              </div>
            </div>
          </div>

          {/* Social Links — Full Grid */}
          <div className="mb-8">
            <h5 className="font-bold text-sm text-white/60 mb-4 text-center sm:text-left">Connect With Us</h5>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {socialLinks.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg transition-all duration-200 ${s.hoverBg} hover:scale-110`}
                  aria-label={s.label}
                  title={s.label}
                >
                  {s.icon}
                  {/* Tooltip */}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-white text-navy text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    {s.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="text-center sm:text-left">
            <p className="text-white/40 text-sm">
              🕐 Open 24/7 (Closed only on major festivals)
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Karya Saarthi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
