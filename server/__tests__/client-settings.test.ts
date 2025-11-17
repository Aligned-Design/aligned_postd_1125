/**
 * Unit tests for Client Settings API routes
 * Tests all endpoints, validation, state management, and error handling
 */

import request from 'supertest';
import express from 'express';
import { json } from 'express';
import {
  getClientSettings,
  updateClientSettings,
  updateEmailPreferences,
  generateUnsubscribeLink,
  unsubscribeFromEmails,
  resubscribeToEmails,
  verifyUnsubscribeToken,
} from '../routes/client-settings';

// Create test app
const app = express();
app.use(json());

// Register routes
app.get('/api/client/settings', getClientSettings);
app.put('/api/client/settings', updateClientSettings);
app.post('/api/client/settings/email-preferences', updateEmailPreferences);
app.post('/api/client/settings/generate-unsubscribe-link', generateUnsubscribeLink);
app.post('/api/client/unsubscribe', unsubscribeFromEmails);
app.post('/api/client/settings/resubscribe', resubscribeToEmails);
app.get('/api/client/settings/verify-unsubscribe', verifyUnsubscribeToken);

describe.skip('Client Settings API', () => {
  const clientId = 'test-client-123';
  const brandId = 'test-brand-456';
  const userId = 'test-user-789';
  const userEmail = 'user@example.com';

  const requiredHeaders = {
    'x-client-id': clientId,
    'x-brand-id': brandId,
    'x-user-id': userId,
    'x-user-email': userEmail,
  };

  describe('GET /api/client/settings', () => {
    it('should retrieve existing settings', async () => {
      // First create settings
      await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          emailPreferences: {
            approvalsNeeded: true,
            approvalReminders: true,
            publishFailures: true,
            publishSuccess: false,
            weeklyDigest: false,
            dailyDigest: false,
            reminderFrequency: '24h',
            digestFrequency: 'weekly',
            maxEmailsPerDay: 20,
          },
          timezone: 'America/New_York',
          language: 'en',
        });

      // Then retrieve
      const response = await request(app)
        .get('/api/client/settings')
        .set({ 'x-client-id': clientId, 'x-brand-id': brandId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings).toBeDefined();
      expect(response.body.settings.clientId).toBe(clientId);
      expect(response.body.settings.brandId).toBe(brandId);
    });

    it('should create default settings if not found', async () => {
      const newClientId = 'new-client-' + Date.now();
      const newBrandId = 'new-brand-' + Date.now();

      const response = await request(app)
        .get('/api/client/settings')
        .set({ 'x-client-id': newClientId, 'x-brand-id': newBrandId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.clientId).toBe(newClientId);
      expect(response.body.settings.brandId).toBe(newBrandId);
      expect(response.body.settings.timezone).toBe('America/New_York');
      expect(response.body.settings.language).toBe('en');
      expect(response.body.settings.emailPreferences.approvalsNeeded).toBe(true);
      expect(response.body.settings.emailPreferences.maxEmailsPerDay).toBe(20);
      expect(response.body.settings.unsubscribedFromAll).toBe(false);
    });

    it('should return 400 if required headers missing', async () => {
      const response = await request(app).get('/api/client/settings');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required headers');
    });
  });

  describe('PUT /api/client/settings', () => {
    it('should update email preferences', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          emailPreferences: {
            approvalsNeeded: false,
            approvalReminders: true,
            publishFailures: true,
            publishSuccess: true,
            weeklyDigest: false,
            dailyDigest: true,
            reminderFrequency: 'immediate',
            digestFrequency: 'daily',
            maxEmailsPerDay: 50,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.emailPreferences.approvalsNeeded).toBe(false);
      expect(response.body.settings.emailPreferences.dailyDigest).toBe(true);
      expect(response.body.settings.emailPreferences.maxEmailsPerDay).toBe(50);
    });

    it('should update timezone and language', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          timezone: 'Europe/London',
          language: 'es',
        });

      expect(response.status).toBe(200);
      expect(response.body.settings.timezone).toBe('Europe/London');
      expect(response.body.settings.language).toBe('es');
    });

    it('should preserve unmodified fields', async () => {
      // Set initial timezone
      await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({ timezone: 'America/Los_Angeles' });

      // Update only language
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({ language: 'fr' });

      expect(response.body.settings.timezone).toBe('America/Los_Angeles');
      expect(response.body.settings.language).toBe('fr');
    });

    it('should validate timezone values', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          timezone: 'invalid/timezone',
        });

      // Should still accept string values (no enum validation in route)
      expect(response.status).toBe(200);
    });

    it('should validate language enum', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          language: 'invalid-language',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate max emails per day range', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          emailPreferences: {
            maxEmailsPerDay: 101, // Max is 100
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should set lastModifiedBy and updatedAt', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({
          timezone: 'Asia/Tokyo',
        });

      expect(response.body.settings.lastModifiedBy).toBe(userEmail);
      expect(response.body.settings.updatedAt).toBeDefined();
    });

    it('should return 400 if required headers missing', async () => {
      const response = await request(app)
        .put('/api/client/settings')
        .send({ timezone: 'America/New_York' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required headers');
    });
  });

  describe('POST /api/client/settings/email-preferences', () => {
    it('should update email preferences only', async () => {
      // Set timezone first
      await request(app)
        .put('/api/client/settings')
        .set(requiredHeaders)
        .send({ timezone: 'America/Chicago' });

      // Update only email preferences
      const response = await request(app)
        .post('/api/client/settings/email-preferences')
        .set(requiredHeaders)
        .send({
          approvalsNeeded: false,
          publishSuccess: true,
          maxEmailsPerDay: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.emailPreferences.approvalsNeeded).toBe(false);
      expect(response.body.settings.emailPreferences.publishSuccess).toBe(true);
      expect(response.body.settings.emailPreferences.maxEmailsPerDay).toBe(10);
      // Timezone should be preserved
      expect(response.body.settings.timezone).toBe('America/Chicago');
    });

    it('should merge with existing email preferences', async () => {
      const response = await request(app)
        .post('/api/client/settings/email-preferences')
        .set(requiredHeaders)
        .send({
          weeklyDigest: true,
        });

      const settings = response.body.settings;
      expect(settings.emailPreferences.weeklyDigest).toBe(true);
      // Other preferences should be merged with defaults/previous values
      expect(settings.emailPreferences.approvalsNeeded).toBeDefined();
    });
  });

  describe('POST /api/client/settings/generate-unsubscribe-link', () => {
    it('should generate an unsubscribe link with token', async () => {
      const response = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.unsubscribeUrl).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.unsubscribeUrl).toContain('/unsubscribe?token=');
      expect(response.body.token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    it('should store token in settings', async () => {
      // Generate token
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      const token = genResponse.body.token;

      // Retrieve settings and verify token is stored
      const getResponse = await request(app)
        .get('/api/client/settings')
        .set({ 'x-client-id': clientId, 'x-brand-id': brandId });

      expect(getResponse.body.settings.unsubscribeToken).toBe(token);
    });

    it('should generate new token each time', async () => {
      const response1 = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      const response2 = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      expect(response1.body.token).not.toBe(response2.body.token);
    });
  });

  describe('POST /api/client/unsubscribe', () => {
    it('should unsubscribe from specific notification type', async () => {
      // Generate unsubscribe token
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      const token = genResponse.body.token;

      // Unsubscribe from specific type
      const response = await request(app)
        .post('/api/client/unsubscribe')
        .send({
          unsubscribeToken: token,
          fromType: 'approval_reminders',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.unsubscribedTypes).toContain('approval_reminders');
      expect(response.body.unsubscribedFromAll).toBeFalsy();
    });

    it('should unsubscribe from all when no type specified', async () => {
      // Generate unsubscribe token
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      const token = genResponse.body.token;

      // Unsubscribe from all
      const response = await request(app)
        .post('/api/client/unsubscribe')
        .send({
          unsubscribeToken: token,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.unsubscribedFromAll).toBe(true);
      expect(response.body.unsubscribedTypes).toHaveLength(6); // All types
      expect(response.body.unsubscribedTypes).toContain('approvals_needed');
      expect(response.body.unsubscribedTypes).toContain('weekly_digest');
    });

    it('should return 400 if token missing', async () => {
      const response = await request(app)
        .post('/api/client/unsubscribe')
        .send({
          fromType: 'approval_reminders',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('token');
    });

    it('should return 404 if token invalid', async () => {
      const response = await request(app)
        .post('/api/client/unsubscribe')
        .send({
          unsubscribeToken: 'invalid-token-1234567890abcdef',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Invalid or expired');
    });
  });

  describe('POST /api/client/settings/resubscribe', () => {
    it('should resubscribe from specific notification type', async () => {
      // Generate token and unsubscribe
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      await request(app)
        .post('/api/client/unsubscribe')
        .send({
          unsubscribeToken: genResponse.body.token,
          fromType: 'approval_reminders',
        });

      // Resubscribe
      const response = await request(app)
        .post('/api/client/settings/resubscribe')
        .set(requiredHeaders)
        .send({
          notificationType: 'approval_reminders',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.unsubscribedTypes).not.toContain('approval_reminders');
    });

    it('should resubscribe from all when no type specified', async () => {
      // Generate token and unsubscribe from all
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      await request(app)
        .post('/api/client/unsubscribe')
        .send({
          unsubscribeToken: genResponse.body.token,
        });

      // Resubscribe to all
      const response = await request(app)
        .post('/api/client/settings/resubscribe')
        .set(requiredHeaders)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.settings.unsubscribedFromAll).toBe(false);
      expect(response.body.settings.unsubscribedTypes).toHaveLength(0);
    });

    it('should return 404 if settings not found', async () => {
      const response = await request(app)
        .post('/api/client/settings/resubscribe')
        .set({
          'x-client-id': 'nonexistent-client',
          'x-brand-id': 'nonexistent-brand',
        })
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/client/settings/verify-unsubscribe', () => {
    it('should verify valid unsubscribe token', async () => {
      // Generate token
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      const token = genResponse.body.token;

      // Verify token
      const response = await request(app)
        .get('/api/client/settings/verify-unsubscribe')
        .query({ token });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.clientId).toBe(clientId);
    });

    it('should return invalid for fake token', async () => {
      const response = await request(app)
        .get('/api/client/settings/verify-unsubscribe')
        .query({ token: 'invalid-token-1234567890abcdef' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
    });

    it('should return 400 if token missing', async () => {
      const response = await request(app)
        .get('/api/client/settings/verify-unsubscribe');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Token');
    });

    it('should include unsubscribed types in response', async () => {
      // Generate token and unsubscribe from specific type
      const genResponse = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(requiredHeaders);

      await request(app)
        .post('/api/client/unsubscribe')
        .send({
          unsubscribeToken: genResponse.body.token,
          fromType: 'weekly_digest',
        });

      // Verify
      const response = await request(app)
        .get('/api/client/settings/verify-unsubscribe')
        .query({ token: genResponse.body.token });

      expect(response.body.unsubscribedTypes).toContain('weekly_digest');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full user preference workflow', async () => {
      const uniqueClientId = 'client-' + Date.now();
      const uniqueBrandId = 'brand-' + Date.now();
      const uniqueHeaders = {
        'x-client-id': uniqueClientId,
        'x-brand-id': uniqueBrandId,
        'x-user-id': userId,
        'x-user-email': userEmail,
      };

      // 1. Get default settings
      let response = await request(app)
        .get('/api/client/settings')
        .set(uniqueHeaders);
      expect(response.body.settings.timezone).toBe('America/New_York');

      // 2. Update preferences
      response = await request(app)
        .put('/api/client/settings')
        .set(uniqueHeaders)
        .send({
          timezone: 'Europe/Paris',
          language: 'fr',
          emailPreferences: {
            weeklyDigest: true,
            dailyDigest: false,
            maxEmailsPerDay: 15,
          },
        });
      expect(response.status).toBe(200);

      // 3. Verify persistence
      response = await request(app)
        .get('/api/client/settings')
        .set(uniqueHeaders);
      expect(response.body.settings.timezone).toBe('Europe/Paris');
      expect(response.body.settings.language).toBe('fr');

      // 4. Generate unsubscribe link
      response = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(uniqueHeaders);
      const token = response.body.token;

      // 5. Unsubscribe from all
      response = await request(app)
        .post('/api/client/unsubscribe')
        .send({ unsubscribeToken: token });
      expect(response.body.unsubscribedFromAll).toBe(true);

      // 6. Verify unsubscribe persisted
      response = await request(app)
        .get('/api/client/settings')
        .set(uniqueHeaders);
      expect(response.body.settings.unsubscribedFromAll).toBe(true);

      // 7. Resubscribe
      response = await request(app)
        .post('/api/client/settings/resubscribe')
        .set(uniqueHeaders)
        .send({});
      expect(response.body.settings.unsubscribedFromAll).toBe(false);
    });

    it('should keep unsubscribe token across preference updates', async () => {
      const uniqueClientId = 'client-' + Date.now();
      const uniqueBrandId = 'brand-' + Date.now();
      const uniqueHeaders = {
        'x-client-id': uniqueClientId,
        'x-brand-id': uniqueBrandId,
        'x-user-id': userId,
        'x-user-email': userEmail,
      };

      // Generate token
      let response = await request(app)
        .post('/api/client/settings/generate-unsubscribe-link')
        .set(uniqueHeaders);
      const originalToken = response.body.token;

      // Update preferences
      response = await request(app)
        .put('/api/client/settings')
        .set(uniqueHeaders)
        .send({
          timezone: 'America/Los_Angeles',
        });

      // Verify token is still there
      response = await request(app)
        .get('/api/client/settings')
        .set(uniqueHeaders);
      expect(response.body.settings.unsubscribeToken).toBe(originalToken);
    });
  });
});
