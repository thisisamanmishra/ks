'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function MarketingReferralsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/marketing') }, [router])
  return null
}
