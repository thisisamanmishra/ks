'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BoardKPIRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/board?tab=kpi') }, [router])
  return null
}
