# Payment Email Templates

Comprehensive email templates for the billing and payment notification system.

---

## 📧 Email Template Structure

All emails follow this structure:

- **Subject Line:** Clear, action-oriented
- **Header:** POSTD branding
- **Body:** Friendly but firm tone
- **CTA Button:** Direct link to billing page
- **Footer:** Support contact + unsubscribe

---

## 1. Day 1 – Soft Reminder

**Trigger:** First payment failure  
**Status:** `payment_failed` (attempt 1)

### Subject

```
Heads up — your payment didn't go through 💳
```

### Body

```html
Hi [User Name], We tried to process your payment for POSTD today, but it
didn't go through. No worries — we'll automatically try again in 24 hours. To
avoid any interruptions to your content publishing, please update your payment
method now. [Update Payment Method Button] Details: • Amount: $[amount] • Next
retry: [date] • Brands affected: [count] Need help? Reply to this email or
contact support at support@aligned.ai. Thanks, The POSTD Team
```

---

## 2. Day 3 – Second Attempt

**Trigger:** Second payment failure  
**Status:** `payment_failed` (attempt 2)

### Subject

```
Payment reminder — update needed 💳
```

### Body

```html
Hi [User Name], We're still having trouble processing your payment for POSTD
AI. We've tried twice now, and we'll make one more automatic attempt in 4 days.
To keep your content flowing without interruption, please update your billing
info today. [Update Payment Method Button] Your account details: • Plan: [Base
Plan / Agency Tier] • Monthly total: $[amount] • Brands: [count] • Next retry:
[date] Questions? We're here to help: support@aligned.ai Best, The POSTD Team
Team
```

---

## 3. Day 7 – Final Warning

**Trigger:** Third payment failure  
**Status:** `payment_failed` (attempt 3)

### Subject

```
⚠️ Action required to keep your content live
```

### Body

```html
Hi [User Name], This is important: we haven't been able to process your payment
for POSTD after three attempts. Your account will pause in 3 days if we
can't complete payment. This means: • Publishing will be disabled • Approval
workflows will pause • Your scheduled content will stop [Update Payment Now
Button] We don't want you to lose momentum. Update your card now to keep
everything running smoothly. Account Summary: • Plan: [tier] • Amount due:
$[amount] • Grace period ends: [date] Need assistance? Contact us:
support@aligned.ai The POSTD Team
```

---

## 4. Day 10/14 – Grace Period End / Suspension

**Trigger:** Account moves to `past_due` status  
**Status:** `past_due` (publishing disabled)

### Subject

```
Your POSTD account is now paused
```

### Body

```html
Hi [User Name], We've paused publishing and approvals on your POSTD account
while we wait for payment. What this means: ✓ Your dashboard and analytics are
still viewable ✓ You can still generate content (up to 2/day) ✗ Publishing is
disabled ✗ Approval workflows are paused Your scheduled posts have been
unscheduled, but they're safely saved as drafts. [Reactivate Account Button] You
can restore full access instantly by updating your payment method. All your
content and settings are preserved. Amount due: $[amount] Brands on hold:
[count] Questions? We're here: support@aligned.ai The POSTD Team
```

---

## 5. Day 30 – Archive Notice

**Trigger:** Account moves to `archived` status  
**Status:** `archived`

### Subject

```
Your account has been archived (reactivate anytime)
```

### Body

```html
Hi [User Name], Your POSTD account has been archived due to non-payment.
Here's what happened: • Your data is safely stored for the next 90 days • All
brands, posts, and settings are preserved • You can reactivate anytime with zero
data loss [Reactivate Account Button] What's stored: ✓ Brand settings and voice
profiles ✓ Content drafts and scheduled posts ✓ Assets and media library ✓
Analytics history Reactivation is instant. Just update your payment method and
you're back online. Amount to reactivate: $[amount] Data retention expires:
[date + 90 days] We'd love to have you back. Questions? support@aligned.ai The
POSTD Team
```

---

## 6. Day 83 – Pre-Deletion Warning (7 days before permanent deletion)

**Trigger:** 83 days after archival (7 days before Day 90)  
**Status:** `archived` (approaching deletion)

### Subject

```
⚠️ Final reminder: Your account will be deleted in 7 days
```

### Body

```html
Hi [User Name], This is your final reminder: we'll permanently delete your
POSTD account and all associated data on [deletion date]. After that date:
✗ All brand settings will be deleted ✗ Content drafts will be removed ✗ Media
library will be cleared ✗ Analytics history will be erased This is irreversible.
[Reactivate Now to Prevent Deletion Button] You can still save everything by
reactivating your account before [deletion date]. It takes less than 2 minutes.
Amount to reactivate: $[amount] Need help? Contact us immediately:
support@aligned.ai The POSTD Team
```

---

## 7. Payment Success / Reactivation

**Trigger:** Payment succeeds after past_due/archived status  
**Status:** `active`

### Subject

```
Welcome back! Your account is active 🎉
```

### Body

```html
Hi [User Name], Great news — your payment went through! Your POSTD account
is now fully active. What's been restored: ✓ Publishing and approval workflows ✓
Unlimited AI content generation ✓ All scheduled posts reinstated ✓ Analytics
updates resumed Your next steps: • Review your content queue: [link] • Update
any paused campaigns: [link] • Check your analytics dashboard: [link] Your plan
details: • Plan: [tier] • Amount charged: $[amount] • Next billing date: [date]
Thanks for being part of POSTD. Let's keep your content flowing! Questions?
support@aligned.ai The POSTD Team
```

---

## 8. Upcoming Charge Reminder (7 days before billing)

**Trigger:** Invoice upcoming webhook from Stripe  
**Status:** `active`

### Subject

```
Your POSTD renewal is coming up
```

### Body

```html
Hi [User Name], Just a heads up: we'll charge your card for POSTD on
[billing date]. Renewal details: • Plan: [tier] • Amount: $[amount] • Brands:
[count] • Payment method: •••• [last4] [Update Payment Method Button] Everything
looks good? No action needed — we'll process this automatically. Want to make
changes? Update your plan or billing info anytime: [billing link] The POSTD
Team
```

---

## 📋 Email Sending Rules

### Frequency Caps

- Max 1 email per day per user
- Skip email if user logged in within 2 hours
- Pause emails if user opens billing page

### Delivery Times

- Send between 9 AM - 5 PM user's timezone
- Avoid weekends for non-critical emails
- Send final warnings any day/time

### Tracking

Log all emails in `payment_notifications` table:

- `sent_at` - Timestamp
- `delivered` - Boolean
- `opened` - Boolean (via pixel tracking)
- `clicked` - Boolean (via link tracking)

---

## 🎨 Email Design Specs

### Colors

- Primary: `#3D0FD6` (Purple)
- Success: `#22C55E` (Green)
- Warning: `#F59E0B` (Orange)
- Critical: `#EF4444` (Red)

### Typography

- Heading: Inter Bold, 24px
- Body: Inter Regular, 16px
- Button: Inter Semibold, 16px

### Button Styles

```css
background: linear-gradient(135deg, #3d0fd6 0%, #7c3aed 100%);
border-radius: 8px;
padding: 12px 24px;
color: white;
text-decoration: none;
```

---

## 🔗 CTA Links

All CTAs should deep-link to relevant pages:

- **Update Payment:** `/billing?action=update-payment`
- **Reactivate Account:** `/billing?action=reactivate`
- **View Dashboard:** `/dashboard`
- **Review Queue:** `/content-queue`

Include UTM parameters for tracking:

```
?utm_source=email&utm_medium=payment&utm_campaign=[email_type]
```

---

## 🧪 Testing Checklist

Before deploying email templates:

- [ ] Test all personalization variables
- [ ] Verify CTA links in all templates
- [ ] Check mobile responsive design
- [ ] Test spam score (aim for < 5.0)
- [ ] Validate HTML rendering in major clients
- [ ] Confirm unsubscribe link works
- [ ] Test timezone-aware sending
- [ ] Verify tracking pixels fire correctly

---

**Template Version:** 1.0  
**Last Updated:** February 1, 2025  
**Maintained By:** Development Team
