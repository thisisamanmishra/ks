'use client'

import { useState } from 'react'
import { useRazorpay } from '@/hooks/useRazorpay'

interface PaymentButtonProps {
  amount: number
  label?: string
  invoiceId?: number
  serviceId?: number
  description?: string
  className?: string
  style?: React.CSSProperties
  onSuccess?: (paymentId: string) => void
}

export default function PaymentButton({
  amount,
  label,
  invoiceId,
  serviceId,
  description,
  className,
  style,
  onSuccess,
}: PaymentButtonProps) {
  const { initiatePayment, loading, error } = useRazorpay()
  const [paid, setPaid] = useState(false)

  const handlePay = () => {
    initiatePayment({
      amount,
      invoiceId,
      serviceId,
      description,
      onSuccess: (paymentId) => {
        setPaid(true)
        onSuccess?.(paymentId)
      },
      onFailure: (err) => {
        console.error('Payment failed:', err)
      },
    })
  }

  if (paid) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold">
        ✅ Payment Successful
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60 transition-all ${className || ''}`}
        style={style || { background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.3)' }}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            💳 {label || `Pay ₹${amount.toLocaleString('en-IN')}`}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1.5">⚠️ {error}</p>}
    </div>
  )
}
