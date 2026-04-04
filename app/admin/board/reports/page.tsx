'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function BoardReportsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/board?tab=reports') }, [router])
  return null
}
