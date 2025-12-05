// ===========================================
// Email Service
// ===========================================

import sgMail from '@sendgrid/mail'
import { APP_NAME, DEFAULT_SETTINGS } from '@/lib/constants'

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@gettelaw.com'
const FROM_NAME = process.env.FROM_NAME || 'Gette Law Invoice System'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

// ===========================================
// Email Templates
// ===========================================

interface EmailTemplateData {
  recipientName: string
  billNumber: string
  matterNumber: string
  clientName: string
  totalAmount: string
  approvalLink?: string
  viewLink?: string
}

/**
 * Generate first round review email HTML
 */
function generateFirstRoundEmailHtml(data: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Review Required</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button:hover { background-color: #0d635c; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      <h2>Invoice Review Required</h2>
      <p>Hello ${data.recipientName},</p>
      <p>You have an invoice that requires your review and approval as the timekeeper.</p>

      <div class="details">
        <table>
          <tr>
            <td>Invoice Number:</td>
            <td>${data.billNumber}</td>
          </tr>
          <tr>
            <td>Matter:</td>
            <td>${data.matterNumber}</td>
          </tr>
          <tr>
            <td>Client:</td>
            <td>${data.clientName}</td>
          </tr>
          <tr>
            <td>Total Amount:</td>
            <td>${data.totalAmount}</td>
          </tr>
        </table>
      </div>

      <p>Please review your time entries and expenses, then approve or make necessary edits.</p>

      <div class="warning">
        <strong>Note:</strong> This approval link will expire in ${DEFAULT_SETTINGS.APPROVAL_TOKEN_EXPIRY_HOURS} hours.
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${data.approvalLink}" class="button">Review & Approve</a>
        <a href="${data.viewLink}" class="button" style="background-color: #6b7280;">View in Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from ${APP_NAME}.</p>
      <p>Gette Law PLLC</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate second round review email HTML
 */
function generateSecondRoundEmailHtml(data: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Invoice Approval Required</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button:hover { background-color: #0d635c; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 5px; margin: 15px 0; }
    .badge { display: inline-block; background-color: #059669; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      <h2>Final Invoice Approval Required</h2>
      <p>Hello ${data.recipientName},</p>
      <p>An invoice is ready for your final approval as the responsible attorney. <span class="badge">All timekeepers have approved</span></p>

      <div class="details">
        <table>
          <tr>
            <td>Invoice Number:</td>
            <td>${data.billNumber}</td>
          </tr>
          <tr>
            <td>Matter:</td>
            <td>${data.matterNumber}</td>
          </tr>
          <tr>
            <td>Client:</td>
            <td>${data.clientName}</td>
          </tr>
          <tr>
            <td>Total Amount:</td>
            <td>${data.totalAmount}</td>
          </tr>
        </table>
      </div>

      <p>Please review the invoice and approve to send to the client, or make any final adjustments.</p>

      <div class="warning">
        <strong>Note:</strong> This approval link will expire in ${DEFAULT_SETTINGS.APPROVAL_TOKEN_EXPIRY_HOURS} hours.
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${data.approvalLink}" class="button">Review & Approve</a>
        <a href="${data.viewLink}" class="button" style="background-color: #6b7280;">View in Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from ${APP_NAME}.</p>
      <p>Gette Law PLLC</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Generate reminder email HTML
 */
function generateReminderEmailHtml(data: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Approval Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .urgent { background-color: #fee2e2; border: 1px solid #dc2626; padding: 10px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ REMINDER: Invoice Approval Pending</h1>
    </div>
    <div class="content">
      <p>Hello ${data.recipientName},</p>
      <p>This is a reminder that you have an invoice awaiting your approval.</p>

      <div class="details">
        <table>
          <tr>
            <td>Invoice Number:</td>
            <td>${data.billNumber}</td>
          </tr>
          <tr>
            <td>Matter:</td>
            <td>${data.matterNumber}</td>
          </tr>
          <tr>
            <td>Client:</td>
            <td>${data.clientName}</td>
          </tr>
          <tr>
            <td>Total Amount:</td>
            <td>${data.totalAmount}</td>
          </tr>
        </table>
      </div>

      <div class="urgent">
        <strong>Action Required:</strong> Please review and approve this invoice at your earliest convenience.
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${data.approvalLink}" class="button">Review Now</a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated reminder from ${APP_NAME}.</p>
      <p>Gette Law PLLC</p>
    </div>
  </div>
</body>
</html>
  `
}

// ===========================================
// Email Service Functions
// ===========================================

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.')
    console.log('Would send email to:', options.to)
    console.log('Subject:', options.subject)
    return false
  }

  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || 'Please view this email in an HTML-capable email client.',
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Send first round review notification
 */
export async function sendFirstRoundEmail(
  recipientEmail: string,
  recipientName: string,
  billNumber: string,
  matterNumber: string,
  clientName: string,
  totalAmount: string,
  approvalToken: string,
  billId: string
): Promise<boolean> {
  const approvalLink = `${APP_URL}/approve/${approvalToken}`
  const viewLink = `${APP_URL}/bills/${billId}`

  return sendEmail({
    to: recipientEmail,
    subject: `Invoice Review Required - ${billNumber}`,
    html: generateFirstRoundEmailHtml({
      recipientName,
      billNumber,
      matterNumber,
      clientName,
      totalAmount,
      approvalLink,
      viewLink,
    }),
  })
}

/**
 * Send second round review notification
 */
export async function sendSecondRoundEmail(
  recipientEmail: string,
  recipientName: string,
  billNumber: string,
  matterNumber: string,
  clientName: string,
  totalAmount: string,
  approvalToken: string,
  billId: string
): Promise<boolean> {
  const approvalLink = `${APP_URL}/approve/${approvalToken}`
  const viewLink = `${APP_URL}/bills/${billId}`

  return sendEmail({
    to: recipientEmail,
    subject: `Final Invoice Approval Required - ${billNumber}`,
    html: generateSecondRoundEmailHtml({
      recipientName,
      billNumber,
      matterNumber,
      clientName,
      totalAmount,
      approvalLink,
      viewLink,
    }),
  })
}

/**
 * Send reminder email
 */
export async function sendReminderEmail(
  recipientEmail: string,
  recipientName: string,
  billNumber: string,
  matterNumber: string,
  clientName: string,
  totalAmount: string,
  approvalToken: string
): Promise<boolean> {
  const approvalLink = `${APP_URL}/approve/${approvalToken}`

  return sendEmail({
    to: recipientEmail,
    subject: `REMINDER: Invoice Approval Pending - ${billNumber}`,
    html: generateReminderEmailHtml({
      recipientName,
      billNumber,
      matterNumber,
      clientName,
      totalAmount,
      approvalLink,
    }),
  })
}

export default {
  sendEmail,
  sendFirstRoundEmail,
  sendSecondRoundEmail,
  sendReminderEmail,
}
