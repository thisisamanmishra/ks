import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://karyasaarthi.vercel.app'

export const revalidate = 3600 // regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const supabase = await createClient()

    // Fetch published blogs
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, updated_at, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(200)

    const blogPages: MetadataRoute.Sitemap = (blogs || []).map(blog => ({
      url: `${BASE_URL}/blogs/${blog.slug}`,
      lastModified: new Date(blog.updated_at || blog.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    // Fetch active services
    const { data: services } = await supabase
      .from('services')
      .select('slug, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(200)

    const servicePages: MetadataRoute.Sitemap = (services || []).map(svc => ({
      url: `${BASE_URL}/services/${svc.slug}`,
      lastModified: new Date(svc.updated_at || svc.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // Fetch active events
    const { data: events } = await supabase
      .from('events')
      .select('slug, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100)

    const eventPages: MetadataRoute.Sitemap = (events || []).map(ev => ({
      url: `${BASE_URL}/events/${ev.slug}`,
      lastModified: new Date(ev.updated_at || ev.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...blogPages, ...servicePages, ...eventPages]
  } catch {
    // If DB is unreachable, return just the static pages
    return staticPages
  }
}
