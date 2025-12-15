// ===========================================
// Email Service (SMTP via SMTP2GO)
// ===========================================

import * as nodemailer from 'nodemailer'
import { APP_NAME, DEFAULT_SETTINGS } from '@/lib/constants'

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'mail.smtp2go.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'
const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@gettelaw.com'
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Gette Law Invoicing'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    })
  }
  return transporter
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

// Primary brand color
const PRIMARY_COLOR = '#5896F3'
const PRIMARY_HOVER = '#4a7fd4'

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
    .header { background-color: ${PRIMARY_COLOR}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button:hover { background-color: ${PRIMARY_HOVER}; }
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
        <strong>Note:</strong> Please log in to the app to review and approve your entries.
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${data.viewLink}" class="button">Review & Approve</a>
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
    .header { background-color: ${PRIMARY_COLOR}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; background-color: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .button:hover { background-color: ${PRIMARY_HOVER}; }
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

      <div style="text-align: center; margin: 20px 0;">
        <a href="${data.viewLink}" class="button">Review & Approve</a>
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
      <h1>REMINDER: Invoice Approval Pending</h1>
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
        <a href="${data.viewLink}" class="button">Review Now</a>
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

/**
 * Generate invoice sent to client email HTML
 */
function generateInvoiceSentEmailHtml(data: EmailTemplateData & { pdfAttached?: boolean }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from Gette Law PLLC</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${PRIMARY_COLOR}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .total { font-size: 1.5em; color: ${PRIMARY_COLOR}; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Gette Law PLLC</h1>
      <p>Invoice</p>
    </div>
    <div class="content">
      <p>Dear ${data.recipientName},</p>
      <p>Please find attached your invoice for legal services rendered.</p>

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
            <td>Total Due:</td>
            <td class="total">${data.totalAmount}</td>
          </tr>
        </table>
      </div>

      <p>Please review the attached PDF for a detailed breakdown of services and expenses.</p>

      <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>

      <p>Thank you for your business.</p>
    </div>
    <div class="footer">
      <p>Gette Law PLLC</p>
      <p>This invoice was generated by ${APP_NAME}.</p>
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
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * Send an email using SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email not sent.')
    console.log('Would send email to:', options.to)
    console.log('Subject:', options.subject)
    return false
  }

  try {
    const transport = getTransporter()

    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || 'Please view this email in an HTML-capable email client.',
      attachments: options.attachments,
    })

    console.log('Email sent successfully to:', options.to)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured.')
    return false
  }

  try {
    const transport = getTransporter()
    await transport.verify()
    console.log('SMTP connection verified successfully')
    return true
  } catch (error) {
    console.error('SMTP connection verification failed:', error)
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
  billId: string
): Promise<boolean> {
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
  billId: string
): Promise<boolean> {
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
  billId: string
): Promise<boolean> {
  const viewLink = `${APP_URL}/bills/${billId}`

  return sendEmail({
    to: recipientEmail,
    subject: `REMINDER: Invoice Approval Pending - ${billNumber}`,
    html: generateReminderEmailHtml({
      recipientName,
      billNumber,
      matterNumber,
      clientName,
      totalAmount,
      viewLink,
    }),
  })
}

/**
 * Send invoice to client with PDF attachment
 */
export async function sendInvoiceToClient(
  recipientEmail: string,
  recipientName: string,
  billNumber: string,
  matterNumber: string,
  totalAmount: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: `Invoice ${billNumber} from Gette Law PLLC`,
    html: generateInvoiceSentEmailHtml({
      recipientName,
      billNumber,
      matterNumber,
      clientName: recipientName,
      totalAmount,
      pdfAttached: true,
    }),
    attachments: [
      {
        filename: `Invoice_${billNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

export default {
  sendEmail,
  verifySmtpConnection,
  sendFirstRoundEmail,
  sendSecondRoundEmail,
  sendReminderEmail,
  sendInvoiceToClient,
}
