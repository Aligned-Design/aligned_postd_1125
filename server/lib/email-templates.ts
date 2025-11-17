/**
 * Email template generators with brand customization
 * Generates HTML emails with client branding, colors, and logos
 */

import {
  ApprovalEmailData,
  ReminderEmailData,
  PublishFailureEmailData,
  WeeklyDigestEmailData,
} from "@shared/approvals";

/**
 * Generate approval request email
 */
export function generateApprovalEmail(data: ApprovalEmailData): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const brandColor = data.brandColor || "#8B5CF6";
  const subject = `${data.brandName}: Approval needed — "${data.postTitle}"`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${brandColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .logo { height: 40px; margin-bottom: 15px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .post-preview { background: white; border-left: 4px solid ${brandColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .post-title { font-weight: bold; color: ${brandColor}; font-size: 16px; margin-bottom: 10px; }
    .post-content { color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 10px; }
    .platforms { font-size: 12px; color: #999; }
    .cta-button { display: inline-block; background: ${brandColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
    .cta-button:hover { opacity: 0.9; }
    .deadline { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .footer a { color: ${brandColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${data.agencyLogo ? `<img src="${data.agencyLogo}" alt="${data.agencyName}" class="logo">` : ""}
      <h1 style="font-size: 24px; margin-bottom: 5px;">${data.brandName}</h1>
      <p style="font-size: 14px; opacity: 0.9;">Content Review Needed</p>
    </div>

    <div class="content">
      <p>Hi ${data.clientName},</p>

      <p style="margin: 15px 0;">The ${data.agencyName} team has prepared content for your review and approval.</p>

      <div class="post-preview">
        <div class="post-title">${data.postTitle}</div>
        <div class="post-content">${escapeHtml(data.postContent).substring(0, 150)}...</div>
        <div class="platforms">📱 ${data.postPlatforms.join(", ")}</div>
      </div>

      ${
        data.deadline
          ? `<div class="deadline">
          ⏰ <strong>Please review by:</strong> ${new Date(
            data.deadline,
          ).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>`
          : ""
      }

      <p style="margin: 20px 0; text-align: center;">
        <a href="${data.approvalUrl}" class="cta-button">Review & Approve</a>
      </p>

      <p style="margin: 20px 0; color: #666;">
        You can approve, request changes, or leave feedback directly in your approval portal.
        If you have questions, please reach out to <strong>${data.requestedBy || "the team"}</strong>.
      </p>

      <div class="footer">
        <p>This is an automated message from ${data.agencyName}.
           <a href="#unsubscribe">Manage preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
${data.brandName} - Content Review Needed

Hi ${data.clientName},

The ${data.agencyName} team has prepared content for your review and approval.

POST: ${data.postTitle}
"${data.postContent.substring(0, 150)}..."
PLATFORMS: ${data.postPlatforms.join(", ")}

${data.deadline ? `DEADLINE: ${new Date(data.deadline).toLocaleDateString()}` : ""}

Review & Approve: ${data.approvalUrl}

You can approve, request changes, or leave feedback directly in your approval portal.

---
${data.agencyName}
`;

  return { subject, htmlBody, textBody };
}

/**
 * Generate approval reminder email
 */
export function generateReminderEmail(data: ReminderEmailData): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const brandColor = data.brandColor || "#8B5CF6";
  const subject = `Reminder: ${data.pendingCount} post(s) awaiting approval for ${data.brandName}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${brandColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .pending-count { background: white; border: 2px solid ${brandColor}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .count { font-size: 32px; font-weight: bold; color: ${brandColor}; margin: 10px 0; }
    .age { font-size: 14px; color: #666; }
    .cta-button { display: inline-block; background: ${brandColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${data.agencyLogo ? `<img src="${data.agencyLogo}" alt="${data.agencyName}" style="height: 40px; margin-bottom: 15px;">` : ""}
      <h1 style="font-size: 24px;">${data.brandName}</h1>
      <p style="font-size: 14px; opacity: 0.9;">Approval Reminder</p>
    </div>

    <div class="content">
      <p>Hi ${data.clientName},</p>

      <p style="margin: 15px 0;">You have content waiting for your approval. The oldest item has been pending for <strong>${data.oldestPendingAge}</strong>.</p>

      <div class="pending-count">
        <div style="font-size: 14px; color: #666;">Posts pending approval</div>
        <div class="count">${data.pendingCount}</div>
        <div class="age">Oldest: ${data.oldestPendingAge}</div>
      </div>

      <p style="text-align: center;">
        <a href="${data.approvalUrl}" class="cta-button">Review Now</a>
      </p>

      <p style="margin: 20px 0; color: #666;">
        Please review and approve or request changes for these posts to keep your content schedule on track.
      </p>

      <div class="footer">
        <p>This is a reminder from ${data.agencyName}. <a href="#unsubscribe" style="color: ${brandColor}; text-decoration: none;">Manage preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
${data.brandName} - Approval Reminder

Hi ${data.clientName},

You have ${data.pendingCount} post(s) waiting for your approval.
The oldest has been pending for ${data.oldestPendingAge}.

Review Now: ${data.approvalUrl}

Please review and approve or request changes to keep your content schedule on track.

---
${data.agencyName}
`;

  return { subject, htmlBody, textBody };
}

/**
 * Generate publish failure email
 */
export function generatePublishFailureEmail(data: PublishFailureEmailData): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const __brandColor = data.brandColor || "#DC2626";
  const subject = `⚠️ Publishing failed for "${data.postTitle}"`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .error-details { background: white; border: 1px solid #EEE; padding: 15px; margin: 15px 0; border-radius: 4px; font-family: monospace; font-size: 12px; color: #666; }
    .support-link { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-size: 24px;">⚠️ Publishing Error</h1>
      <p style="font-size: 14px; opacity: 0.9;">Action needed for ${data.brandName}</p>
    </div>

    <div class="content">
      <p>Hi ${data.clientName},</p>

      <p style="margin: 15px 0;">We encountered an error while publishing your content to the platforms.</p>

      <div class="alert">
        <strong>Post:</strong> ${data.postTitle}<br>
        <strong>Error:</strong> ${data.failureReason}<br>
        <strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}
      </div>

      <p style="margin: 15px 0;"><strong>What happens next?</strong></p>
      <ul style="margin-left: 20px;">
        <li>The ${data.agencyName} team has been notified and is investigating</li>
        <li>Your post remains safely stored and scheduled for retry</li>
        <li>We'll notify you once the issue is resolved</li>
      </ul>

      ${
        data.supportUrl
          ? `<p style="text-align: center;">
        <a href="${data.supportUrl}" class="support-link">View More Details</a>
      </p>`
          : ""
      }

      <div class="footer">
        <p>This is an automated notification from ${data.agencyName}.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
⚠️ Publishing Error - ${data.brandName}

Hi ${data.clientName},

We encountered an error while publishing your content:

POST: ${data.postTitle}
ERROR: ${data.failureReason}
TIME: ${new Date(data.timestamp).toLocaleString()}

WHAT HAPPENS NEXT:
- The team has been notified and is investigating
- Your post remains safely stored and scheduled for retry
- We'll notify you once the issue is resolved

${data.supportUrl ? `More details: ${data.supportUrl}` : ""}

---
${data.agencyName}
`;

  return { subject, htmlBody, textBody };
}

/**
 * Generate weekly digest email
 */
export function generateWeeklyDigestEmail(data: WeeklyDigestEmailData): {
  subject: string;
  htmlBody: string;
  textBody: string;
} {
  const brandColor = data.brandColor || "#8B5CF6";
  const subject = `${data.brandName} Weekly Report - ${data.weekStart} to ${data.weekEnd}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${brandColor}, ${brandColor}dd); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .stat-card { background: white; border-left: 4px solid ${brandColor}; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .stat-number { font-size: 24px; font-weight: bold; color: ${brandColor}; }
    .stat-label { font-size: 12px; color: #999; margin-top: 5px; }
    .top-post { background: white; border: 1px solid #EEE; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .dashboard-link { display: inline-block; background: ${brandColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${data.agencyLogo ? `<img src="${data.agencyLogo}" alt="${data.agencyName}" style="height: 40px; margin-bottom: 15px;">` : ""}
      <h1 style="font-size: 24px; margin-bottom: 5px;">${data.brandName}</h1>
      <p style="font-size: 14px; opacity: 0.9;">Weekly Performance Report</p>
      <p style="font-size: 12px; opacity: 0.8; margin-top: 10px;">${data.weekStart} to ${data.weekEnd}</p>
    </div>

    <div class="content">
      <p>Hi ${data.clientName},</p>

      <p style="margin: 15px 0;">Here's a snapshot of your content performance this week:</p>

      <div class="stat-card">
        <div class="stat-number">${data.postsPublished}</div>
        <div class="stat-label">Posts Published</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${data.postsScheduled}</div>
        <div class="stat-label">Posts Scheduled</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">${data.totalEngagement.toLocaleString()}</div>
        <div class="stat-label">Total Engagement</div>
      </div>

      ${
        data.topPost
          ? `<div style="margin-top: 25px; padding-top: 25px; border-top: 2px solid #EEE;">
        <p style="font-weight: bold; margin-bottom: 10px;">🏆 Top Performing Post</p>
        <div class="top-post">
          <strong>${data.topPost.title}</strong><br>
          📱 ${data.topPost.platform}<br>
          <span style="color: ${brandColor}; font-weight: bold;">${data.topPost.engagement.toLocaleString()} engagements</span>
        </div>
      </div>`
          : ""
      }

      ${
        data.pendingApprovals > 0
          ? `<div style="background: #FEF3C7; border-left: 4px solid #FCD34D; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>⏳ Action needed:</strong> You have ${data.pendingApprovals} post(s) waiting for approval.
      </div>`
          : ""
      }

      <p style="text-align: center;">
        <a href="${data.dashboardUrl}" class="dashboard-link">View Full Dashboard</a>
      </p>

      <p style="margin: 20px 0; color: #666;">
        Have questions about your performance? Reply to this email or contact the ${data.agencyName} team.
      </p>

      <div class="footer">
        <p>This is an automated weekly report from ${data.agencyName}. <a href="#unsubscribe" style="color: ${brandColor}; text-decoration: none;">Manage preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
${data.brandName} - Weekly Performance Report
${data.weekStart} to ${data.weekEnd}

Hi ${data.clientName},

Here's your content performance this week:

Posts Published: ${data.postsPublished}
Posts Scheduled: ${data.postsScheduled}
Total Engagement: ${data.totalEngagement.toLocaleString()}

${
  data.topPost
    ? `TOP POST: ${data.topPost.title}
Platform: ${data.topPost.platform}
Engagement: ${data.topPost.engagement.toLocaleString()}`
    : ""
}

${data.pendingApprovals > 0 ? `ACTION NEEDED: ${data.pendingApprovals} post(s) awaiting approval` : ""}

View Full Dashboard: ${data.dashboardUrl}

---
${data.agencyName}
`;

  return { subject, htmlBody, textBody };
}

/**
 * Utility to escape HTML characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
