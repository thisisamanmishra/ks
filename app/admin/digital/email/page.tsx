'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function DigitalEmailRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/digital') }, [router])
  return null
}
