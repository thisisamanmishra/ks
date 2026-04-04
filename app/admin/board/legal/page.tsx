'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function BoardLegalRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/board?tab=mou') }, [router])
  return null
}
