import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { WorkflowStepInstance, WorkflowAction } from "@shared/workflow";

// WorkflowTrackerProps uses a subset of WorkflowInstance for flexibility with partially loaded workflows
interface WorkflowTrackerProps {
  workflow: {
    steps?: WorkflowStepInstance[];
    status?: string;
    startedAt?: string;
    metadata?: {
      priority?: string;
      deadline?: string;
      tags?: string[];
    };
  };
  canTakeAction: boolean;
  onAction: (action: WorkflowAction) => void;
  className?: string;
}

export function WorkflowTracker({
  workflow,
  canTakeAction,
  onAction,
  className,
}: WorkflowTrackerProps) {
  // Workflow steps with proper typing - uses WorkflowStepInstance from @shared/workflow
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  const completedSteps = steps.filter(
    (step) => step.status === "completed",
  ).length;
  const totalSteps = steps.length || 1;
  const progress = (completedSteps / totalSteps) * 100;

  const _getStepStatusIcon = (status: WorkflowStepInstance["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatusColor = (status: WorkflowStepInstance["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Workflow Progress
            <Badge
              variant="outline"
              className={cn(
                workflow.status === "completed"
                  ? "bg-green-50 text-green-700"
                  : workflow.status === "cancelled"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700",
              )}
            >
              {workflow.status}
            </Badge>
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {completedSteps} of {totalSteps} steps
            </p>
            <Progress value={progress} className="w-24 h-2 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workflow Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs font-medium text-gray-600">Priority</p>
            <Badge
              variant={
                workflow.metadata.priority === "high"
                  ? "destructive"
                  : workflow.metadata.priority === "medium"
                    ? "default"
                    : "secondary"
              }
            >
              {workflow.metadata.priority}
            </Badge>
          </div>
          {workflow.metadata.deadline && (
            <div>
              <p className="text-xs font-medium text-gray-600">Deadline</p>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                {new Date(workflow.metadata.deadline).toLocaleDateString()}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-600">Started</p>
            <p className="text-sm">
              {workflow.startedAt ? new Date(workflow.startedAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-3">
          {workflow.steps.map((step: WorkflowStepInstance, index) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              index={index}
              isLast={index === workflow.steps.length - 1}
              canTakeAction={canTakeAction && step.status === "in_progress"}
              onAction={onAction}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface WorkflowStepCardProps {
  step: WorkflowStepInstance;
  index: number;
  isLast: boolean;
  canTakeAction: boolean;
  onAction: (action: WorkflowAction) => void;
}

function WorkflowStepCard({
  step,
  index,
  isLast,
  canTakeAction,
  onAction,
}: WorkflowStepCardProps) {
  const _getStepStatusIcon = (status: WorkflowStepInstance["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatusColor = (status: WorkflowStepInstance["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-4 p-4 rounded-lg border transition-all",
          step.status === "in_progress" && "border-blue-200 bg-blue-50",
          step.status === "completed" && "border-green-200 bg-green-50",
        )}
      >
        {/* Step Number & Status */}
        <div className="flex flex-col items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
            {step.status === "completed" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              index + 1
            )}
          </div>
          {!isLast && <div className="w-0.5 h-8 bg-gray-300 mt-2" />}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h4 className="font-medium">{step.stage.replace("_", " ")}</h4>
              <Badge className={getStepStatusColor(step.status)}>
                {step.status.replace("_", " ")}
              </Badge>
            </div>
            {step.timeoutAt && step.status === "in_progress" && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Clock className="h-3 w-3" />
                Due {new Date(step.timeoutAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Assignee */}
          {step.assignedTo && (
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Assigned to {step.assignedTo}
              </span>
              {step.assignedAt && (
                <span className="text-xs text-gray-500">
                  on {new Date(step.assignedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Comments */}
          {step.comments.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  Comments ({step.comments.length})
                </span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {step.comments.slice(-2).map((comment) => (
                  <div
                    key={comment.id}
                    className="text-sm bg-white p-2 rounded border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{comment.userName}</span>
                      <Badge variant="outline" className="text-xs">
                        {comment.userRole}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canTakeAction && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  onAction({
                    type: "approve",
                    stepInstanceId: step.id,
                  })
                }
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onAction({
                    type: "request_changes",
                    stepInstanceId: step.id,
                  })
                }
              >
                Request Changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onAction({
                    type: "reject",
                    stepInstanceId: step.id,
                  })
                }
              >
                Reject
              </Button>
            </div>
          )}

          {/* Completion Info */}
          {step.status === "completed" && step.completedAt && (
            <div className="mt-2 text-xs text-green-600">
              Completed on {new Date(step.completedAt).toLocaleDateString()}
              {step.decision && ` - ${step.decision.replace("_", " ")}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
