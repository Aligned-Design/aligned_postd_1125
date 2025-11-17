export type IntegrationType = 'slack' | 'hubspot' | 'meta' | 'google_business' | 'zapier' | 'asana' | 'trello' | 'salesforce' | 'canva';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  brandId: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    webhookUrl?: string;
    expiresAt?: string;
  };
  settings: {
    syncEnabled: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    syncDirection: 'bidirectional' | 'inbound' | 'outbound';
    autoSync: boolean;
    filterRules?: IntegrationFilter[];
  };
  permissions: string[];
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'in';
  value: string | string[];
}

export interface SyncEvent {
  id: string;
  integrationId: string;
  type: 'content' | 'analytics' | 'tasks' | 'contacts' | 'campaigns';
  action: 'create' | 'update' | 'delete' | 'sync';
  sourceId: string;
  targetId?: string;
  data: unknown;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  attempts: number;
  scheduledAt: string;
  processedAt?: string;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  source: IntegrationType;
  eventType: string;
  payload: unknown;
  signature?: string;
  receivedAt: string;
  processedAt?: string;
  status: 'pending' | 'processed' | 'failed';
}

export interface IntegrationTemplate {
  type: IntegrationType;
  name: string;
  description: string;
  logoUrl: string;
  category: 'social' | 'crm' | 'automation' | 'productivity' | 'analytics';
  features: string[];
  authType: 'oauth2' | 'api_key' | 'webhook';
  requiredScopes: string[];
  endpoints: {
    auth?: string;
    api: string;
    webhook?: string;
  };
  rateLimits: {
    requests: number;
    period: string;
  };
}
