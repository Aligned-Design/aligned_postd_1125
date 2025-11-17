/**
 * Workflow Database Service
 * Handles workflow templates, instances, and actions
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Workflow template record
 */
export interface WorkflowTemplateRecord {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  is_default: boolean;
  steps: Array<{
    id: string;
    stage: string;
    name: string;
    description?: string;
    required_role: string;
    is_required: boolean;
    allow_parallel: boolean;
    auto_advance: boolean;
    timeout_hours?: number;
    order: number;
  }>;
  notifications: {
    email_on_stage_change: boolean;
    reminder_after_hours?: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Workflow instance record
 */
export interface WorkflowInstanceRecord {
  id: string;
  brand_id: string;
  content_id: string;
  template_id: string;
  current_stage: string;
  current_step_id: string;
  status: "active" | "completed" | "cancelled";
  steps: Array<{
    id: string;
    step_id: string;
    stage: string;
    status: "pending" | "in_progress" | "completed" | "skipped";
    assigned_to?: string;
    assigned_at?: string;
    started_at?: string;
    completed_at?: string;
    comments: string[];
    timeout_at?: string;
  }>;
  assigned_users: Record<string, string>;
  started_at: string;
  completed_at?: string;
  metadata: {
    priority?: "low" | "medium" | "high";
    deadline?: string;
    tags?: string[];
  };
  created_at: string;
  updated_at: string;
}

/**
 * Workflow notification record
 */
export interface WorkflowNotificationRecord {
  id: string;
  user_id: string;
  workflow_id: string;
  type: "stage_change" | "timeout" | "reminder" | "completion";
  message: string;
  read_at?: string;
  created_at: string;
}

/**
 * Workflow Database Service Class
 */
export class WorkflowDBService {
  /**
   * Create a workflow template
   */
  async createWorkflowTemplate(
    brandId: string,
    template: Omit<WorkflowTemplateRecord, "id" | "created_at" | "updated_at">
  ): Promise<WorkflowTemplateRecord> {
    const { data, error } = await supabase
      .from("workflow_templates")
      .insert({
        brand_id: brandId,
        name: template.name,
        description: template.description,
        is_default: template.is_default || false,
        steps: template.steps,
        notifications: template.notifications,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create workflow template",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowTemplateRecord;
  }

  /**
   * Locate workflow instance containing a given step instance ID
   */
  async getWorkflowInstanceByStep(
    stepInstanceId: string,
    brandFilter?: string[],
  ): Promise<WorkflowInstanceRecord | null> {
    let query = supabase
      .from("workflow_instances")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (brandFilter && brandFilter.length > 0) {
      query = query.in("brand_id", brandFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch workflow instances",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message },
      );
    }

    const instances = (data || []) as WorkflowInstanceRecord[];
    for (const instance of instances) {
      if (Array.isArray(instance.steps)) {
        const match = instance.steps.find((step) => step.id === stepInstanceId);
        if (match) {
          return instance;
        }
      }
    }

    return null;
  }

  /**
   * Get workflow templates for a brand
   */
  async getWorkflowTemplates(brandId: string): Promise<WorkflowTemplateRecord[]> {
    const { data, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("brand_id", brandId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch workflow templates",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as WorkflowTemplateRecord[];
  }

  /**
   * Get a specific workflow template
   */
  async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplateRecord | null> {
    const { data, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch workflow template",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowTemplateRecord | null;
  }

  /**
   * Update workflow template
   */
  async updateWorkflowTemplate(
    templateId: string,
    updates: Partial<Omit<WorkflowTemplateRecord, "id" | "created_at" | "updated_at">>
  ): Promise<WorkflowTemplateRecord> {
    const { data, error } = await supabase
      .from("workflow_templates")
      .update(updates)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update workflow template",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowTemplateRecord;
  }

  /**
   * Create a workflow instance (start workflow)
   */
  async startWorkflow(
    brandId: string,
    contentId: string,
    templateId: string,
    assignedUsers: Record<string, string>,
    priority?: "low" | "medium" | "high",
    deadline?: string
  ): Promise<WorkflowInstanceRecord> {
    const template = await this.getWorkflowTemplate(templateId);
    if (!template) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Workflow template not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    const firstStep = template.steps[0];
    const workflowInstance = {
      brand_id: brandId,
      content_id: contentId,
      template_id: templateId,
      current_stage: firstStep.stage,
      current_step_id: firstStep.id,
      status: "active",
      steps: template.steps.map((step) => ({
        id: `instance_${step.id}_${Date.now()}`,
        step_id: step.id,
        stage: step.stage,
        status: step.order === 1 ? "in_progress" : "pending",
        assigned_to: assignedUsers[step.id],
        assigned_at: step.order === 1 ? new Date().toISOString() : undefined,
        started_at: step.order === 1 ? new Date().toISOString() : undefined,
        comments: [],
        timeout_at: step.timeout_hours
          ? new Date(Date.now() + step.timeout_hours * 60 * 60 * 1000).toISOString()
          : undefined,
      })),
      assigned_users: assignedUsers,
      metadata: {
        priority: priority || "medium",
        deadline,
        tags: [],
      },
    };

    const { data, error } = await supabase
      .from("workflow_instances")
      .insert(workflowInstance)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to start workflow",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowInstanceRecord;
  }

  /**
   * Get workflow instances for content
   */
  async getWorkflowInstancesForContent(contentId: string): Promise<WorkflowInstanceRecord[]> {
    const { data, error } = await supabase
      .from("workflow_instances")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch workflow instances",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as WorkflowInstanceRecord[];
  }

  /**
   * Get a specific workflow instance
   */
  async getWorkflowInstance(workflowId: string): Promise<WorkflowInstanceRecord | null> {
    const { data, error } = await supabase
      .from("workflow_instances")
      .select("*")
      .eq("id", workflowId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch workflow instance",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowInstanceRecord | null;
  }

  /**
   * Process workflow action (advance to next step, add comments, etc)
   */
  async processWorkflowAction(
    workflowId: string,
    stepId: string,
    action: "approve" | "reject" | "comment" | "reassign",
    details: Record<string, unknown>
  ): Promise<WorkflowInstanceRecord> {
    const workflow = await this.getWorkflowInstance(workflowId);
    if (!workflow) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Workflow not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Find the current step
    const currentStepIndex = workflow.steps.findIndex((s) => s.id === stepId);
    if (currentStepIndex === -1) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Step not found in workflow",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Update step based on action
    const updatedSteps = [...workflow.steps];
    const currentStep = updatedSteps[currentStepIndex];

    switch (action) {
      case "approve":
        currentStep.status = "completed";
        currentStep.completed_at = new Date().toISOString();

        // Auto-advance to next step if configured
        if (currentStepIndex < updatedSteps.length - 1) {
          const nextStep = updatedSteps[currentStepIndex + 1];
          const template = await this.getWorkflowTemplate(workflow.template_id);
          const nextTemplate = template?.steps[currentStepIndex + 1];

          if (nextTemplate?.auto_advance || nextTemplate?.order === currentStepIndex + 2) {
            nextStep.status = "in_progress";
            nextStep.started_at = new Date().toISOString();
          } else {
            nextStep.status = "pending";
          }
        }
        break;

      case "reject":
        currentStep.status = "pending";
        if (details.reason) {
          currentStep.comments.push(`Rejected: ${details.reason}`);
        }
        break;

      case "comment":
        if (details.comment) {
          currentStep.comments.push(details.comment as string);
        }
        break;

      case "reassign":
        if (details.assignTo) {
          currentStep.assigned_to = details.assignTo as string;
        }
        break;
    }

    // Update workflow instance
    const { data, error } = await supabase
      .from("workflow_instances")
      .update({
        steps: updatedSteps,
        current_stage: updatedSteps[currentStepIndex].stage,
        status: currentStepIndex === updatedSteps.length - 1 ? "completed" : "active",
        completed_at:
          currentStepIndex === updatedSteps.length - 1 ? new Date().toISOString() : undefined,
      })
      .eq("id", workflowId)
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to process workflow action",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowInstanceRecord;
  }

  /**
   * Create workflow notification
   */
  async createNotification(
    userId: string,
    workflowId: string,
    type: "stage_change" | "timeout" | "reminder" | "completion",
    message: string
  ): Promise<WorkflowNotificationRecord> {
    const { data, error } = await supabase
      .from("workflow_notifications")
      .insert({
        user_id: userId,
        workflow_id: workflowId,
        type,
        message,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create notification",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WorkflowNotificationRecord;
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId: string): Promise<WorkflowNotificationRecord[]> {
    const { data, error } = await supabase
      .from("workflow_notifications")
      .select("*")
      .eq("user_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch notifications",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return (data || []) as WorkflowNotificationRecord[];
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("workflow_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to mark notification as read",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from("workflow_instances")
      .update({
        status: "cancelled",
        metadata: { cancellation_reason: reason },
      })
      .eq("id", workflowId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to cancel workflow",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }
  }
}

/**
 * Singleton instance
 */
export const workflowDB = new WorkflowDBService();
