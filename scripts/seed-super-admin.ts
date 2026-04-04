/**
 * Seed Super Admin Script
 * Run: npx tsx scripts/seed-super-admin.ts
 *
 * Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Load .env.local since tsx doesn't auto-load Next.js env files
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) return
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  })
} catch {
  console.warn('⚠️  Could not load .env.local — using existing environment variables')
}

const SUPER_ADMIN = {
  fullname: 'Super Admin',
  email: 'admin@karyasaarthi.com',
  phone: '8595025753',
  password: 'KaryaSaarthi@2025',
}

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  // Check if super admin already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', SUPER_ADMIN.email)
    .single()

  if (existing) {
    console.log('⚠️  Super admin already exists. Updating role...')
    await supabase
      .from('users')
      .update({ role: 'super_admin', is_approved: true })
      .eq('email', SUPER_ADMIN.email)
    console.log('✅ Super admin role updated.')
    return
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10)

  const { error } = await supabase.from('users').insert({
    fullname: SUPER_ADMIN.fullname,
    email: SUPER_ADMIN.email,
    phone: SUPER_ADMIN.phone,
    password: hashedPassword,
    role: 'super_admin',
    is_approved: true,
    status: 'active',
    email_verified: true,
  })

  if (error) {
    console.error('❌ Failed to create super admin:', error.message)
    process.exit(1)
  }

  console.log('✅ Super admin created successfully!')
  console.log(`   Email: ${SUPER_ADMIN.email}`)
  console.log(`   Password: ${SUPER_ADMIN.password}`)
  console.log('   ⚠️  Change this password immediately after first login!')
}

seed().catch(console.error)
