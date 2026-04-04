'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function DigitalSocialRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/digital') }, [router])
  return null
}
