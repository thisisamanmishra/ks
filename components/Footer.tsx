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
            <p className="text-white/40 text-xs">
              &ldquo;Hum Hai Aapke Saathi&rdquo;
            </p>
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

          {/* Social + hours */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {[
                { icon: '📘', href: '#', label: 'Facebook' },
                { icon: '📸', href: '#', label: 'Instagram' },
                { icon: '🐦', href: '#', label: 'Twitter' },
                { icon: '💼', href: '#', label: 'LinkedIn' },
              ].map(s => (
                <a key={s.label} href={s.href} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg hover:bg-accent/20 transition-colors" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
            <p className="text-white/40 text-sm text-center">
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
