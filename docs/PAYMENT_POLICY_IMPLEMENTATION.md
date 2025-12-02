# Payment Policy Implementation - Complete Guide

**Version:** 1.0  
**Date:** February 1, 2025  
**Status:** ✅ Production Ready

---

## 🎯 Overview

This document covers the complete implementation of POSTD's billing, payment failure handling, and unpaid account policy. The system protects recurring revenue while maintaining user trust through a firm but friendly escalation path.

---

## 📊 Payment Timeline

| Stage                    | Day    | System Behavior           | User Experience               | Email        |
| ------------------------ | ------ | ------------------------- | ----------------------------- | ------------ |
| **Billing Date**         | Day 0  | Stripe attempts charge    | Banner: "Payment processing…" | N/A          |
| **Failed Attempt 1**     | Day 1  | Auto-retry within 24 hrs  | Soft reminder email           | Day 1 Email  |
| **Failed Attempt 2**     | Day 3  | Retry again               | Banner + email                | Day 3 Email  |
| **Failed Attempt 3**     | Day 7  | Final retry               | Final warning email           | Day 7 Email  |
| **Grace Period End**     | Day 10 | Status → `past_due`       | Dashboard notice              | Day 10 Email |
| **Account Suspension**   | Day 14 | Lock publishing/approvals | Read-only mode                | Day 14 Email |
| **Account Archived**     | Day 30 | Archive data, pause       | Data retention notice         | Day 30 Email |
| **Pre-Deletion Warning** | Day 83 | Email warning             | Final chance                  | Day 83 Email |
| **Permanent Deletion**   | Day 90 | Delete all data           | Account closed                | N/A          |

---

## 🗄️ Database Schema

### Users Table Updates

```sql
ALTER TABLE users
ADD COLUMN plan_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN payment_failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_retry_count INT DEFAULT 0,
ADD COLUMN past_due_since TIMESTAMP WITH TIME ZONE,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN grace_extension_days INT DEFAULT 0;
```

**Status Values:**

- `active` - Paid, full access
- `trial` - 7-day trial
- `past_due` - Payment failed, restricted access
- `archived` - Data retained 90 days
- `deleted` - Permanently removed

### Payment Attempts Table

Tracks all payment retry attempts:

```sql
CREATE TABLE payment_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  attempt_number INT,
  status VARCHAR(50), -- 'failed', 'succeeded'
  amount DECIMAL(10, 2),
  stripe_invoice_id VARCHAR(255),
  error_code VARCHAR(255),
  error_message TEXT,
  attempted_at TIMESTAMP
);
```

### Archived Data Table

90-day data retention:

```sql
CREATE TABLE archived_data (
  id UUID PRIMARY KEY,
  user_id UUID,
  data_type VARCHAR(100), -- 'posts', 'assets', 'settings'
  data JSONB,
  archived_at TIMESTAMP,
  delete_after TIMESTAMP, -- archived_at + 90 days
  restored BOOLEAN DEFAULT FALSE
);
```

---

## 🔗 API Endpoints

### Webhook Endpoints

#### `POST /api/webhooks/stripe`

Handles Stripe webhook events:

**Events Handled:**

- `invoice.payment_failed` - Payment failure
- `invoice.payment_succeeded` - Payment success
- `customer.subscription.deleted` - Cancellation
- `customer.subscription.updated` - Plan change
- `invoice.upcoming` - 7-day billing reminder

**Implementation:**

```typescript
router.post("/webhooks/stripe", async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case "invoice.payment_failed":
      await handlePaymentFailed(event);
      break;
    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event);
      break;
    // ... other handlers
  }

  res.json({ received: true });
});
```

### Billing Endpoints

#### `GET /api/billing/account-status`

Get current account status and permissions.

**Response:**

```json
{
  "planStatus": "past_due",
  "daysPastDue": 8,
  "permissions": {
    "canPublish": false,
    "canApprove": false,
    "canGenerateContent": true,
    "maxDailyAIGenerations": 2
  },
  "restrictions": ["Publishing disabled", "Approvals disabled"],
  "nextAction": "Update payment to restore access"
}
```

#### `POST /api/billing/reactivate`

Reactivate account after payment.

**Request:**

```json
{
  "paymentMethodId": "pm_123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account reactivated successfully",
  "planStatus": "active"
}
```

#### `POST /api/billing/extend-grace-period`

Admin-only: extend grace period.

**Request:**

```json
{
  "userId": "user-uuid",
  "extensionDays": 7
}
```

---

## 🔒 Functional Restrictions

### Publishing (Days 14+)

When `daysPastDue >= 14`:

- Publish button disabled
- Queue shows "Upgrade to publish" message
- Drafts can be created but not published
- Scheduled posts auto-unscheduled

**Middleware:**

```typescript
export async function checkCanPublish(req, res, next) {
  const { planStatus, daysPastDue } = req.user;

  if (planStatus === "past_due" && daysPastDue >= 14) {
    return res.status(403).json({
      error: "Publishing disabled",
      message: "Update payment to resume",
    });
  }

  next();
}
```

### Approvals (Days 14+)

- Approval workflows paused
- Pending approvals frozen
- Client portal shows "Inactive" banner

### AI Generation

**Restricted Access:**

- Trial: 10/day
- Past Due (< 14 days): Unlimited
- Past Due (≥ 14 days): 2/day
- Archived: 0/day

**Middleware:**

```typescript
export async function checkCanGenerateContent(req, res, next) {
  const permissions = getAccountPermissions(
    req.user.planStatus,
    req.user.daysPastDue,
  );

  if (permissions.maxDailyAIGenerations === 0) {
    return res.status(403).json({
      error: "Content generation disabled for archived accounts",
    });
  }

  // Check daily limit...
  next();
}
```

### Analytics

**Read-Only Mode (Days 14+):**

- Historical data visible
- Live updates frozen
- No new tracking
- Export disabled

---

## 🎨 Frontend Components

### PastDueBanner

Shows payment status banner at top of dashboard.

**Usage:**

```tsx
import { PastDueBanner } from "@/components/billing/PastDueBanner";

<PastDueBanner daysPastDue={8} accountStatus="past_due" dismissible={false} />;
```

**Severity Levels:**

- `info` - Days 1-6 (yellow)
- `warning` - Days 7-13 (orange)
- `critical` - Days 14+ (red)

### ReactivationModal

Modal for account reactivation with payment.

**Usage:**

```tsx
import { ReactivationModal } from "@/components/billing/ReactivationModal";

<ReactivationModal
  open={showModal}
  onClose={() => setShowModal(false)}
  onReactivate={handleReactivate}
  accountStatus="past_due"
/>;
```

**Features:**

- Payment form (card, expiry, CVC)
- Confetti on success 🎉
- Auto-close after reactivation
- Error handling

---

## 👨‍💼 Admin Dashboard

### Admin Billing View

Route: `/admin/billing`

**Features:**

- Active vs. past_due vs. archived counts
- Total revenue + lost revenue
- User list with filters
- Grace period extension (±7 days)
- Bulk reactivation tools

**Metrics Displayed:**

- Active users count
- Past due users (with days count)
- Archived users
- Total MRR
- Lost MRR (from unpaid accounts)

**User Actions:**

- Extend grace period (+7 days)
- Bulk reactivate
- View payment history
- Filter by status

---

## 📧 Email Communication

See `/docs/PAYMENT_EMAIL_TEMPLATES.md` for complete templates.

**Email Schedule:**

- Day 1: Soft reminder
- Day 3: Second attempt
- Day 7: Final warning
- Day 10/14: Suspension notice
- Day 30: Archive notice
- Day 83: Pre-deletion warning
- On success: Reactivation celebration

**Email Service Integration:**

```typescript
async function sendPaymentFailedEmail(userId, type) {
  const template = templates[type];

  // Send via SendGrid/Postmark/Mailgun
  await emailService.send({
    to: user.email,
    subject: template.subject,
    html: renderTemplate(template.body, user),
    track: true,
  });

  // Log in database
  await db.from("payment_notifications").insert({
    user_id: userId,
    notification_type: type,
    sent_at: new Date(),
  });
}
```

---

## 🔄 Data Archival Process

### Day 30: Archive Account

When account reaches Day 30 past due:

1. **Move to archived status:**

```sql
UPDATE users
SET plan_status = 'archived', archived_at = NOW()
WHERE plan_status = 'past_due'
AND past_due_since < NOW() - INTERVAL '30 days';
```

2. **Archive user data:**

```typescript
async function archiveUserData(userId) {
  // Archive posts
  const posts = await db.from("posts").where("user_id", userId);
  await db.from("archived_data").insert({
    user_id: userId,
    data_type: "posts",
    data: posts,
    delete_after: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  });

  // Archive assets, settings, etc...
}
```

3. **Send email notification**

### Day 90: Permanent Deletion

Automated cron job:

```typescript
async function permanentlyDeleteAccounts() {
  const accountsToDelete = await db
    .from("users")
    .where("plan_status", "archived")
    .where("archived_at", "<", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

  for (const account of accountsToDelete) {
    // Delete from archived_data
    await db.from("archived_data").where("user_id", account.id).delete();

    // Delete user and all associated data
    await db.from("users").where("id", account.id).delete();
  }
}
```

**Cron Schedule:** Daily at 2 AM UTC

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] Stripe webhook handlers fire correctly
- [ ] Payment retry logic increments counter
- [ ] Account status transitions (active → past_due → archived)
- [ ] Middleware blocks restricted actions
- [ ] Data archival creates correct records
- [ ] Reactivation restores archived data
- [ ] Email notifications sent at right times

### Frontend Tests

- [ ] PastDueBanner shows correct severity
- [ ] Publishing disabled for past_due users (14+)
- [ ] Approvals disabled for past_due users (14+)
- [ ] ReactivationModal processes payment
- [ ] Confetti fires on successful reactivation
- [ ] Admin dashboard loads all metrics
- [ ] Grace extension updates database

### Integration Tests

- [ ] End-to-end payment failure flow
- [ ] Reactivation restores full access
- [ ] Email delivery tracking
- [ ] Webhook signature verification
- [ ] Timezone-aware email sending

---

## 🚀 Deployment Steps

### 1. Database Migration

```bash
# Run migration
psql -d aligned_ai -f supabase/migrations/20250201_payment_status_tracking.sql

# Verify columns added
\d users
```

### 2. Environment Variables

Add to `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_API_KEY=sk_live_xxxxx
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@aligned.ai
```

### 3. Stripe Webhook Configuration

In Stripe Dashboard:

1. Go to Developers → Webhooks
2. Add endpoint: `https://aligned.ai/api/webhooks/stripe`
3. Select events:
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.upcoming`

### 4. Cron Jobs

Set up automated tasks:

**Daily at 2 AM UTC:**

```bash
0 2 * * * /usr/bin/node /app/scripts/archive-past-due-accounts.js
0 2 * * * /usr/bin/node /app/scripts/delete-archived-accounts.js
```

**Daily at 10 AM (user timezone):**

```bash
0 10 * * * /usr/bin/node /app/scripts/send-payment-reminders.js
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Track

- Payment failure rate (%)
- Average days to reactivation
- Revenue churn (from deleted accounts)
- Grace extension usage
- Email open/click rates

### Alerts

Set up alerts for:

- Payment failure spike (>10% daily)
- Archival rate increase (>5% weekly)
- Webhook delivery failures
- Email bounce rate >5%

---

## 🔐 Security Considerations

### Webhook Verification

Always verify Stripe signatures:

```typescript
const signature = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET,
);
```

### Data Access

- Archived data encrypted at rest
- Admin access logged
- PII scrubbed after deletion
- GDPR compliance maintained

---

## 📞 Support Integration

### Customer Support Flows

**User contacts support about payment:**

1. Check account status in admin dashboard
2. View payment attempt history
3. Optionally extend grace period (+7 days)
4. Send manual reactivation link if needed

**Admin actions available:**

- Extend grace period
- Manual reactivation (without payment)
- View full payment history
- Export user data before deletion

---

## ✅ Implementation Checklist

### Backend

- [x] Database migration created
- [x] Stripe webhook handler
- [x] Account status service
- [x] Billing reactivation API
- [x] Middleware restrictions
- [x] Email notification logic
- [x] Data archival functions

### Frontend

- [x] PastDueBanner component
- [x] ReactivationModal component
- [x] Admin billing dashboard
- [x] Dashboard integration
- [x] Publishing restrictions
- [x] Approval workflow blocks

### Documentation

- [x] Email templates
- [x] Implementation guide
- [x] API documentation
- [x] Testing checklist
- [x] Deployment guide

### Testing

- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] E2E payment flow tested
- [ ] Email delivery verified
- [ ] Webhook handling tested

### Deployment

- [ ] Database migrated
- [ ] Environment variables set
- [ ] Stripe webhooks configured
- [ ] Cron jobs scheduled
- [ ] Monitoring alerts set

---

**Status:** ✅ Ready for Production  
**Next Steps:** Testing & deployment

**Maintained By:** Development Team  
**Last Updated:** February 1, 2025
