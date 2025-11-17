export type WorkflowStage = 'draft' | 'internal_review' | 'client_review' | 'approved' | 'rejected' | 'published';
export type UserRole = 'creator' | 'internal_reviewer' | 'client' | 'admin';

export interface WorkflowStep {
  id: string;
  stage: WorkflowStage;
  name: string;
  description: string;
  requiredRole: UserRole;
  isRequired: boolean;
  allowParallel: boolean;
  autoAdvance: boolean;
  timeoutHours?: number;
  order: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  brandId: string;
  isDefault: boolean;
  steps: WorkflowStep[];
  notifications: {
    emailOnStageChange: boolean;
    slackIntegration?: string;
    reminderAfterHours?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstance {
  id: string;
  contentId: string;
  templateId: string;
  currentStage: WorkflowStage;
  currentStepId: string;
  status: 'active' | 'completed' | 'cancelled';
  steps: WorkflowStepInstance[];
  assignedUsers: Record<string, string>; // stepId -> userId
  startedAt: string;
  completedAt?: string;
  metadata: {
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    tags: string[];
  };
}

export interface WorkflowStepInstance {
  id: string;
  stepId: string;
  stage: WorkflowStage;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rejected';
  assignedTo?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  comments: WorkflowComment[];
  decision?: 'approve' | 'reject' | 'request_changes';
  decisionReason?: string;
  timeoutAt?: string;
}

export interface WorkflowComment {
  id: string;
  stepInstanceId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface WorkflowAction {
  type: 'approve' | 'reject' | 'request_changes' | 'reassign' | 'skip' | 'escalate';
  stepInstanceId: string;
  comment?: string;
  reassignTo?: string;
  escalateTo?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowNotification {
  id: string;
  workflowInstanceId: string;
  userId: string;
  type: 'assignment' | 'reminder' | 'escalation' | 'completion' | 'timeout';
  title: string;
  message: string;
  actionRequired: boolean;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}
