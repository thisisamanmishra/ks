'use client'

import { useCallback, useState } from 'react'

interface RazorpayOptions {
  amount: number
  invoiceId?: number
  serviceId?: number
  description?: string
  onSuccess?: (paymentId: string, orderId: string) => void
  onFailure?: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiatePayment = useCallback(async (options: RazorpayOptions) => {
    setLoading(true)
    setError(null)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay SDK')

      // Create order
      const res = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: options.amount,
          invoice_id: options.invoiceId,
          service_id: options.serviceId,
          description: options.description,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      const rz = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: 'KaryaSaarthi',
        description: options.description || 'Payment to KaryaSaarthi',
        image: '/images/karyasaarthi.jpeg',
        prefill: data.prefill,
        theme: { color: '#FF6B35' },
        modal: { backdropclose: false, escape: false },
        handler: function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          setLoading(false)
          options.onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id)
        },
      })

      rz.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed'
      setError(msg)
      options.onFailure?.(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { initiatePayment, loading, error }
}
