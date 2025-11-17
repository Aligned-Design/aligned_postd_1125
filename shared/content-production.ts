export type ContentStatus = 'draft' | 'generating' | 'queued' | 'completed' | 'error' | 'approved' | 'published';

export interface ContentItem {
  id: string;
  brandId: string;
  title: string;
  content: string;
  platform: string;
  status: ContentStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string;
  generationJob?: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    error?: string;
    retryCount: number;
    estimatedCompletion?: string;
  };
  metadata: {
    prompt?: string;
    generationType: 'ai' | 'template' | 'manual';
    wordCount: number;
    imageCount: number;
    hashtags: string[];
  };
  preview?: {
    thumbnail: string;
    fullContent: string;
    variations: string[];
  };
}

export interface ProductionDashboardData {
  summary: {
    total: number;
    completed: number;
    inQueue: number;
    errored: number;
    generating: number;
  };
  recentActivity: ContentItem[];
  upcomingDeadlines: ContentItem[];
  erroredItems: ContentItem[];
  queuedItems: ContentItem[];
}

export interface BatchOperation {
  action: 'retry' | 'approve' | 'delete' | 'reschedule';
  contentIds: string[];
  metadata?: Record<string, unknown>;
}
