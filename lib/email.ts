import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"Karya Saarthi" <${process.env.SMTP_USER || 'noreply@karyasaarthi.com'}>`,
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

const emailWrapper = (content: string) => `
  <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1B3A6B, #0f2545); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Karya Saarthi</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
      ${content}
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      This is an automated email from Karya Saarthi. Do not reply to this email.
    </p>
  </div>
`

export function otpEmail(otp: string, purpose: string, name?: string) {
  const greeting = name ? `Hi <strong>${name}</strong>,` : 'Hi,'

  if (purpose === 'forgot_password') {
    return {
      subject: 'Password Reset OTP - Karya Saarthi',
      html: emailWrapper(`
        <h2 style="color: #1B3A6B; margin-top: 0;">🔐 Password Reset Request</h2>
        <p style="color: #64748b;">${greeting}</p>
        <p style="color: #64748b;">You requested to reset your password. Use the OTP below to proceed:</p>
        <div style="background: linear-gradient(135deg, #1B3A6B, #0f2545); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">Your OTP Code</p>
          <h1 style="color: white; margin: 0; font-size: 36px; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
        </div>
        <p style="color: #64748b; font-size: 14px;">⏰ This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">⚠️ Never share this OTP with anyone. Karya Saarthi will never ask for your OTP via phone or message.</p>
      `),
    }
  }

  return {
    subject: 'Email Verification OTP - Karya Saarthi',
    html: emailWrapper(`
      <h2 style="color: #1B3A6B; margin-top: 0;">✉️ Verify Your Email</h2>
      <p style="color: #64748b;">${greeting}</p>
      <p style="color: #64748b;">Welcome to Karya Saarthi! Please verify your email address using the OTP below:</p>
      <div style="background: linear-gradient(135deg, #FF6B35, #e55a2b); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="color: rgba(255,255,255,0.8); margin: 0 0 8px; font-size: 14px;">Your Verification Code</p>
        <h1 style="color: white; margin: 0; font-size: 36px; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
      </div>
      <p style="color: #64748b; font-size: 14px;">⏰ This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #64748b; font-size: 14px;">Once verified, your account will be created and you can start using our services.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">⚠️ Never share this OTP with anyone. Karya Saarthi will never ask for your OTP via phone or message.</p>
    `),
  }
}

export function adminApprovalEmail(adminName: string) {
  return {
    subject: 'Admin Registration Request - Karya Saarthi',
    html: emailWrapper(`
      <h2 style="color: #1B3A6B; margin-top: 0;">New Admin Registration Request</h2>
      <p style="color: #64748b;"><strong>${adminName}</strong> has requested admin access. Please review and approve/reject from the admin panel.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/requests" 
         style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Review Request
      </a>
    `),
  }
}

export function approvedEmail(name: string, department: string) {
  return {
    subject: 'Admin Access Approved - Karya Saarthi',
    html: emailWrapper(`
      <h2 style="color: #1B3A6B; margin-top: 0;">🎉 You're Approved!</h2>
      <p style="color: #64748b;">Hi <strong>${name}</strong>, your admin access has been approved for the <strong>${department}</strong> department.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" 
         style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Go to Admin Panel
      </a>
    `),
  }
}

export function rejectedEmail(name: string) {
  return {
    subject: 'Admin Registration Update - Karya Saarthi',
    html: emailWrapper(`
      <h2 style="color: #1B3A6B; margin-top: 0;">Registration Update</h2>
      <p style="color: #64748b;">Hi <strong>${name}</strong>, unfortunately your admin registration request was not approved at this time. Please contact us for more information.</p>
    `),
  }
}

/** Sent to customer, vendor, and ops team when project progress or status changes */
export function projectProgressEmail({
  recipientName,
  projectName,
  newStatus,
  newProgress,
  updatedBy,
  projectUrl,
}: {
  recipientName: string
  projectName: string
  newStatus?: string
  newProgress?: number
  updatedBy: string
  projectUrl: string
}) {
  const statusLine = newStatus
    ? `<p style="color:#64748b;">📋 <strong>Status:</strong> ${newStatus.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}</p>`
    : ''
  const progressLine = newProgress !== undefined
    ? `<p style="color:#64748b;">📊 <strong>Progress:</strong> ${newProgress}%</p>`
    : ''

  return {
    subject: `Project Update: "${projectName}" — Karya Saarthi`,
    html: emailWrapper(`
      <h2 style="color:#1B3A6B;margin-top:0;">🔄 Project Update</h2>
      <p style="color:#64748b;">Hi <strong>${recipientName}</strong>,</p>
      <p style="color:#64748b;">Your project <strong>"${projectName}"</strong> has been updated by <strong>${updatedBy}</strong>.</p>
      <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:20px 0;">
        ${statusLine}${progressLine}
      </div>
      <a href="${projectUrl}" style="display:inline-block;background:#FF6B35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Project</a>
    `),
  }
}

/** Sent to project participants when a new message is posted in the project chat */
export function newProjectMessageEmail({
  recipientName,
  senderName,
  projectName,
  messagePreview,
  projectUrl,
}: {
  recipientName: string
  senderName: string
  projectName: string
  messagePreview: string
  projectUrl: string
}) {
  return {
    subject: `New Message in "${projectName}" — Karya Saarthi`,
    html: emailWrapper(`
      <h2 style="color:#1B3A6B;margin-top:0;">💬 New Message</h2>
      <p style="color:#64748b;">Hi <strong>${recipientName}</strong>,</p>
      <p style="color:#64748b;"><strong>${senderName}</strong> sent a message in your project <strong>"${projectName}"</strong>:</p>
      <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:20px 0;border-left:4px solid #1B3A6B;">
        <p style="color:#334155;margin:0;font-style:italic;">"${messagePreview.length > 200 ? messagePreview.slice(0, 200) + '…' : messagePreview}"</p>
      </div>
      <a href="${projectUrl}" style="display:inline-block;background:#FF6B35;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply Now</a>
    `),
  }
}
