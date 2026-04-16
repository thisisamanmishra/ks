import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

// POST /api/payments/webhook — Razorpay webhook
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  if (signature !== expectedSig) {
    console.error('Razorpay webhook signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const supabase = await createClient()

  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id

      // Update payment record
      await supabase
        .from('payments')
        .update({
          razorpay_payment_id: payment.id,
          status: 'captured',
          captured_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', orderId)

      // Get payment details to update invoice if linked
      const { data: paymentRecord } = await supabase
        .from('payments')
        .select('invoice_id')
        .eq('razorpay_order_id', orderId)
        .single()

      if (paymentRecord?.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            razorpay_payment_id: payment.id,
          })
          .eq('id', paymentRecord.invoice_id)
      }

      console.info(`[webhook] payment.captured: ${payment.id} order: ${orderId}`)
      break
    }

    case 'payment.failed': {
      const payment = event.payload.payment.entity
      await supabase
        .from('payments')
        .update({ status: 'failed', failed_at: new Date().toISOString() })
        .eq('razorpay_order_id', payment.order_id)

      console.info(`[webhook] payment.failed: ${payment.id}`)
      break
    }

    case 'order.paid': {
      const order = event.payload.order.entity
      await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('razorpay_order_id', order.id)
      break
    }

    default:
      // Silently ignore unhandled events
  }

  return NextResponse.json({ received: true })
}
