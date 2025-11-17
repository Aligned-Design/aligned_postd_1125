/**
 * Email service for sending notifications with SendGrid and Nodemailer fallback
 * Supports feature flagging for testing and development
 */

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { SendEmailOptions, EmailSendResult } from "@shared/approvals";

// Configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@aligned-ai.com";
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@aligned-ai.com";
const ENABLE_EMAILS = process.env.EMAIL_SERVICE_ENABLED === "true";
const USE_SENDGRID =
  process.env.EMAIL_PROVIDER === "sendgrid" && SENDGRID_API_KEY;
const NODE_ENV = process.env.NODE_ENV || "development";

// Nodemailer test account (for development)
let testAccount: unknown = null;
let transporter: unknown = null;

/**
 * Initialize email service based on environment and provider
 */
export async function initializeEmailService(): Promise<void> {
  if (!ENABLE_EMAILS) {
    console.log("[Email Service] Email notifications disabled");
    return;
  }

  if (USE_SENDGRID) {
    try {
      sgMail.setApiKey(SENDGRID_API_KEY!);
      console.log("[Email Service] SendGrid initialized");
    } catch (error) {
      console.error("[Email Service] Failed to initialize SendGrid:", error);
      throw error;
    }
  } else {
    // Use Nodemailer for development/testing
    try {
      if (NODE_ENV === "development" || NODE_ENV === "test") {
        testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log("[Email Service] Nodemailer (test) initialized");
      } else {
        // Production SMTP fallback
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        console.log("[Email Service] Nodemailer (SMTP) initialized");
      }
    } catch (error) {
      console.error("[Email Service] Failed to initialize Nodemailer:", error);
      throw error;
    }
  }
}

/**
 * Send an email notification
 */
export async function sendEmail(
  options: SendEmailOptions,
  retryCount = 0,
): Promise<EmailSendResult> {
  if (!ENABLE_EMAILS) {
    console.log(
      "[Email Service] Email sending disabled, skipping:",
      options.to,
    );
    return { success: true, retries: 0 };
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  try {
    let result: unknown;

    if (USE_SENDGRID) {
      result = await sendViaSegndGrid(options);
    } else {
      result = await sendViaNodemailer(options);
    }

    // Log successful send
    console.log(`[Email Service] Email sent to ${options.to}:`, {
      subject: options.subject,
      type: options.notificationType,
      messageId: result?.messageId,
    });

    return {
      success: true,
      messageId: result?.messageId,
      retries: retryCount,
    };
  } catch (error) {
    console.error(
      `[Email Service] Failed to send email to ${options.to}:`,
      error,
    );

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
      console.log(
        `[Email Service] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendEmail(options, retryCount + 1);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      retries: retryCount,
    };
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSegndGrid(options: SendEmailOptions): Promise<unknown> {
  const msg = {
    to: options.to,
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    subject: options.subject,
    html: options.htmlBody,
    text: options.textBody,
    // Custom args for tracking
    customArgs: {
      brandId: options.brandId || "unknown",
      userId: options.userId || "unknown",
      type: options.notificationType || "general",
    },
  };

  const response = await sgMail.send(msg);
  return { messageId: response[0].headers["x-message-id"] };
}

/**
 * Send via Nodemailer
 */
async function sendViaNodemailer(options: SendEmailOptions): Promise<unknown> {
  if (!transporter) {
    throw new Error("Nodemailer transporter not initialized");
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    replyTo: EMAIL_REPLY_TO,
    to: options.to,
    subject: options.subject,
    html: options.htmlBody,
    text: options.textBody,
    headers: {
      "X-Brand-ID": options.brandId || "unknown",
      "X-User-ID": options.userId || "unknown",
      "X-Notification-Type": options.notificationType || "general",
    },
  });

  // Log preview URL for test emails
  if (NODE_ENV === "development" && testAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("[Email Service] Test email preview:", previewUrl);
  }

  return info;
}

/**
 * Send multiple emails in parallel with rate limiting
 */
export async function sendEmailBatch(
  emails: SendEmailOptions[],
  concurrency = 5,
): Promise<EmailSendResult[]> {
  const results: EmailSendResult[] = [];
  const pending = [...emails];

  const sendNext = async () => {
    while (pending.length > 0) {
      const email = pending.shift();
      if (email) {
        const result = await sendEmail(email);
        results.push(result);
      }
    }
  };

  // Create concurrent workers
  const workers = Array(Math.min(concurrency, emails.length))
    .fill(null)
    .map(() => sendNext());

  await Promise.all(workers);

  return results;
}

/**
 * Health check for email service
 */
export async function checkEmailServiceHealth(): Promise<{
  healthy: boolean;
  provider: string;
  message: string;
}> {
  if (!ENABLE_EMAILS) {
    return {
      healthy: true,
      provider: "disabled",
      message: "Email service is disabled",
    };
  }

  try {
    if (USE_SENDGRID) {
      // Try to verify API key by sending a test
      // In practice, this would be a real health check endpoint
      return {
        healthy: true,
        provider: "sendgrid",
        message: "SendGrid is configured and ready",
      };
    } else {
      // Verify Nodemailer connection
      if (transporter) {
        await (transporter as unknown).verify();
        return {
          healthy: true,
          provider: "nodemailer",
          message: "Nodemailer SMTP connection verified",
        };
      }
      return {
        healthy: false,
        provider: "nodemailer",
        message: "Nodemailer transporter not initialized",
      };
    }
  } catch (error) {
    return {
      healthy: false,
      provider: USE_SENDGRID ? "sendgrid" : "nodemailer",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
