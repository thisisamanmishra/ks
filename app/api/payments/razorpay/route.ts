import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/middleware'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// POST /api/payments/razorpay — create order
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { amount, currency = 'INR', invoice_id, service_id, description } = await request.json()

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Amount must be in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      notes: {
        user_id: String(user.userId),
        invoice_id: invoice_id ? String(invoice_id) : '',
        service_id: service_id ? String(service_id) : '',
        description: description || '',
      },
    })

    // Store payment intent in DB
    const supabase = await createClient()
    await supabase.from('payments').insert({
      user_id: user.userId,
      razorpay_order_id: order.id,
      amount,
      currency,
      status: 'created',
      invoice_id: invoice_id || null,
      service_id: service_id || null,
      description,
    })

    return NextResponse.json({
      orderId: order.id,
      amount: amountInPaise,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: user.email,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('Razorpay order error:', err)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
