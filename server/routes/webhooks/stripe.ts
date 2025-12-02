import { Router, Request, Response } from "express";
import { AppError } from "../../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../../lib/error-responses";

const router = Router();

/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 */

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing Stripe signature", HTTP_STATUS.BAD_REQUEST, "warning");
    }

    // Verify webhook signature (replace with actual Stripe verification)
    // const event = stripe.webhooks.constructEvent(
    //   req.body,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET
    // );

    const event: StripeWebhookEvent = req.body;

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Route to appropriate handler
    switch (event.type) {
      case "invoice.payment_failed":
        await handlePaymentFailed(event);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;

      case "invoice.upcoming":
        await handleUpcomingInvoice(event);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    res.status(400).json({
      error: "Webhook handler failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(event: StripeWebhookEvent) {
  const invoice = event.data.object;
  const customerId = invoice.customer;
  const attemptCount = invoice.attempt_count || 1;

  console.log(
    `[Payment Failed] Customer: ${customerId}, Attempt: ${attemptCount}`,
  );

  // Get user from database by Stripe customer ID
  // const user = await db.from('users').where('stripe_customer_id', customerId).first();

  // Mock user for now
  const userId = "mock-user-id";

  // Record payment attempt
  // await db.from('payment_attempts').insert({
  //   user_id: userId,
  //   attempt_number: attemptCount,
  //   status: 'failed',
  //   amount: invoice.amount_due / 100,
  //   stripe_invoice_id: invoice.id,
  //   error_code: invoice.last_payment_error?.code,
  //   error_message: invoice.last_payment_error?.message,
  // });

  // Update user status
  if (attemptCount === 1) {
    // First failure - Day 1
    // await db.from('users').where('id', userId).update({
    //   payment_failed_at: new Date(),
    //   payment_retry_count: 1,
    //   last_payment_attempt: new Date(),
    //   next_retry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
    // });

    await sendPaymentFailedEmail(userId, "soft_reminder");
  } else if (attemptCount === 2) {
    // Second failure - Day 3
    // await db.from('users').where('id', userId).update({
    //   payment_retry_count: 2,
    //   last_payment_attempt: new Date(),
    //   next_retry_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // +4 days
    // });

    await sendPaymentFailedEmail(userId, "second_attempt");
  } else if (attemptCount >= 3) {
    // Final failure - Day 7
    // await db.from('users').where('id', userId).update({
    //   payment_retry_count: 3,
    //   last_payment_attempt: new Date(),
    // });

    await sendPaymentFailedEmail(userId, "final_warning");
  }

  // Check if we should move to past_due status (Day 10)
  // const user = await db.from('users').where('id', userId).first();
  // if (user.payment_failed_at && daysSince(user.payment_failed_at) >= 10) {
  //   await db.from('users').where('id', userId).update({
  //     plan_status: 'past_due',
  //     past_due_since: new Date(),
  //   });
  //   await sendPaymentFailedEmail(userId, 'grace_period_end');
  // }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(event: StripeWebhookEvent) {
  const invoice = event.data.object;
  const customerId = invoice.customer;

  console.log(`[Payment Succeeded] Customer: ${customerId}`);

  // Get user from database
  // const user = await db.from('users').where('stripe_customer_id', customerId).first();
  const userId = "mock-user-id";

  // Record successful payment
  // await db.from('payment_attempts').insert({
  //   user_id: userId,
  //   attempt_number: invoice.attempt_count || 1,
  //   status: 'succeeded',
  //   amount: invoice.amount_paid / 100,
  //   stripe_invoice_id: invoice.id,
  //   stripe_payment_intent_id: invoice.payment_intent,
  // });

  // Restore account to active status
  // await db.from('users').where('id', userId).update({
  //   plan_status: 'active',
  //   payment_failed_at: null,
  //   payment_retry_count: 0,
  //   past_due_since: null,
  //   last_payment_attempt: new Date(),
  //   next_retry_date: null,
  // });

  // Send confirmation email
  await sendPaymentSuccessEmail(userId);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(event: StripeWebhookEvent) {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  console.log(`[Subscription Deleted] Customer: ${customerId}`);

  // const user = await db.from('users').where('stripe_customer_id', customerId).first();
  const userId = "mock-user-id";

  // Move to archived status
  // await db.from('users').where('id', userId).update({
  //   plan_status: 'archived',
  //   archived_at: new Date(),
  // });

  // Trigger data archival
  await triggerDataArchive(userId);

  // Send cancellation email
  await sendSubscriptionCanceledEmail(userId);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(event: StripeWebhookEvent) {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  console.log(`[Subscription Updated] Customer: ${customerId}`);

  // Update user subscription details in database
  // await db.from('users').where('stripe_customer_id', customerId).update({
  //   plan: subscription.items.data[0].price.id,
  //   subscription_status: subscription.status,
  // });
}

/**
 * Handle invoice.upcoming event (7 days before billing)
 */
async function handleUpcomingInvoice(event: StripeWebhookEvent) {
  const invoice = event.data.object;
  const customerId = invoice.customer;

  console.log(`[Upcoming Invoice] Customer: ${customerId}`);

  // Send reminder email about upcoming charge
  // const user = await db.from('users').where('stripe_customer_id', customerId).first();
  const userId = "mock-user-id";

  await sendUpcomingChargeEmail(userId, invoice.amount_due / 100);
}

/**
 * Email notification functions
 */
async function sendPaymentFailedEmail(
  userId: string,
  type:
    | "soft_reminder"
    | "second_attempt"
    | "final_warning"
    | "grace_period_end",
) {
  const templates = {
    soft_reminder: {
      subject: "Heads up — your payment didn't go through 💳",
      body: "We'll try again automatically in 24 hours. To avoid interruptions, please update your payment method now.",
    },
    second_attempt: {
      subject: "Payment reminder — update needed 💳",
      body: "We're trying again to process your payment. Please update your billing info to avoid service interruption.",
    },
    final_warning: {
      subject: "Action required to keep your content live ⚠️",
      body: "Your account will pause in 3 days if we can't process your payment. Click below to update your card.",
    },
    grace_period_end: {
      subject: "Your publishing has been paused",
      body: "We've paused publishing and approvals while we wait for payment. You can reactivate instantly by updating your billing info.",
    },
  };

  const template = templates[type];

  // Record notification
  // await db.from('payment_notifications').insert({
  //   user_id: userId,
  //   notification_type: type,
  //   email_subject: template.subject,
  //   email_body: template.body,
  // });

  // Send actual email via SendGrid/Postmark
  console.log(`[Email] Sending ${type} to user ${userId}`);
  console.log(`Subject: ${template.subject}`);
  console.log(`Body: ${template.body}`);
}

async function sendPaymentSuccessEmail(userId: string) {
  console.log(`[Email] Sending payment success to user ${userId}`);
  // Send via email service
}

async function sendSubscriptionCanceledEmail(userId: string) {
  console.log(`[Email] Sending subscription canceled to user ${userId}`);
  // Send via email service
}

async function sendUpcomingChargeEmail(userId: string, amount: number) {
  console.log(`[Email] Sending upcoming charge ($${amount}) to user ${userId}`);
  // Send via email service
}

async function triggerDataArchive(userId: string) {
  console.log(`[Archive] Triggering data archive for user ${userId}`);
  // Archive user data to archived_data table
  // Set delete_after = NOW() + INTERVAL '90 days'
}

export default router;
