import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Save,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import {
  WorkflowTemplate,
  WorkflowStep,
  UserRole,
  WorkflowStage,
} from "@shared/workflow";

interface WorkflowBuilderProps {
  brandId: string;
  template?: WorkflowTemplate;
  onSave: (template: WorkflowTemplate) => void;
  onCancel: () => void;
}

export function WorkflowBuilder({
  brandId,
  template,
  onSave,
  onCancel,
}: WorkflowBuilderProps) {
  const [workflowTemplate, setWorkflowTemplate] = useState<
    Partial<WorkflowTemplate>
  >(
    template || {
      name: "",
      description: "",
      brandId,
      isDefault: false,
      steps: [],
      notifications: {
        emailOnStageChange: true,
        reminderAfterHours: 24,
      },
    },
  );

  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      stage: "internal_review",
      name: "New Review Step",
      description: "",
      requiredRole: "internal_reviewer",
      isRequired: true,
      allowParallel: false,
      autoAdvance: false,
      order: (workflowTemplate.steps?.length || 0) + 1,
    };

    setWorkflowTemplate((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }));
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowTemplate((prev) => ({
      ...prev,
      steps:
        prev.steps?.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step,
        ) || [],
    }));
  };

  const removeStep = (stepId: string) => {
    setWorkflowTemplate((prev) => ({
      ...prev,
      steps: prev.steps?.filter((step) => step.id !== stepId) || [],
    }));
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    if (!workflowTemplate.steps) return;

    const steps = [...workflowTemplate.steps];
    const index = steps.findIndex((step) => step.id === stepId);

    if (direction === "up" && index > 0) {
      [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
    } else if (direction === "down" && index < steps.length - 1) {
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
    }

    // Update order
    steps.forEach((step, idx) => {
      step.order = idx + 1;
    });

    setWorkflowTemplate((prev) => ({ ...prev, steps }));
  };

  const handleSave = () => {
    if (!workflowTemplate.name || !workflowTemplate.steps?.length) {
      alert("Please provide a name and at least one step");
      return;
    }

    const template: WorkflowTemplate = {
      id: workflowTemplate.id || `template_${Date.now()}`,
      name: workflowTemplate.name,
      description: workflowTemplate.description || "",
      brandId,
      isDefault: workflowTemplate.isDefault || false,
      steps: workflowTemplate.steps,
      notifications: workflowTemplate.notifications || {
        emailOnStageChange: true,
        reminderAfterHours: 24,
      },
      createdAt: workflowTemplate.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(template);
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Template Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={workflowTemplate.name || ""}
                onChange={(e) =>
                  setWorkflowTemplate((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g., Standard Approval Process"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={workflowTemplate.isDefault || false}
                onCheckedChange={(checked) =>
                  setWorkflowTemplate((prev) => ({
                    ...prev,
                    isDefault: checked,
                  }))
                }
              />
              <Label>Set as default template</Label>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={workflowTemplate.description || ""}
              onChange={(e) =>
                setWorkflowTemplate((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe when to use this workflow..."
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <h4 className="font-medium">Notification Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={
                    workflowTemplate.notifications?.emailOnStageChange || false
                  }
                  onCheckedChange={(checked) =>
                    setWorkflowTemplate((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        emailOnStageChange: checked,
                      },
                    }))
                  }
                />
                <Label>Email on stage changes</Label>
              </div>
              <div>
                <Label>Reminder after (hours)</Label>
                <Input
                  type="number"
                  value={
                    workflowTemplate.notifications?.reminderAfterHours || 24
                  }
                  onChange={(e) =>
                    setWorkflowTemplate((prev) => {
                      const notifications = prev.notifications || {
                        emailOnStageChange: false,
                      };
                      return {
                        ...prev,
                        notifications: {
                          emailOnStageChange:
                            notifications.emailOnStageChange ?? false,
                          slackIntegration: notifications.slackIntegration,
                          reminderAfterHours: parseInt(e.target.value),
                        },
                      };
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Workflow Steps</CardTitle>
          <Button onClick={addStep} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowTemplate.steps?.map((step, index) => (
              <WorkflowStepCard
                key={step.id}
                step={step}
                index={index}
                isSelected={selectedStep === step.id}
                onSelect={() => setSelectedStep(step.id)}
                onUpdate={(updates) => updateStep(step.id, updates)}
                onRemove={() => removeStep(step.id)}
                onMove={(direction) => moveStep(step.id, direction)}
                canMoveUp={index > 0}
                canMoveDown={index < (workflowTemplate.steps?.length || 0) - 1}
              />
            )) || (
              <div className="text-center py-8 text-gray-500">
                No steps defined. Add a step to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Template
        </Button>
      </div>
    </div>
  );
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  _onSelect?: () => void;
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function WorkflowStepCard({
  step,
  index,
  isSelected,
  _onSelect: onSelect,
  onUpdate,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: WorkflowStepCardProps) {
  const stageOptions: { value: WorkflowStage; label: string }[] = [
    { value: "draft", label: "Draft" },
    { value: "internal_review", label: "Internal Review" },
    { value: "client_review", label: "Client Review" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
  ];

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: "creator", label: "Content Creator" },
    { value: "internal_reviewer", label: "Internal Reviewer" },
    { value: "client", label: "Client" },
    { value: "admin", label: "Administrator" },
  ];

  return (
    <Card className={cn("transition-all", isSelected && "ring-2 ring-primary")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Step Number */}
          <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </div>

          {/* Step Details */}
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Step Name</Label>
                <Input
                  value={step.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Stage</Label>
                <Select
                  value={step.stage}
                  onValueChange={(value: WorkflowStage) =>
                    onUpdate({ stage: value })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Required Role</Label>
                <Select
                  value={step.requiredRole}
                  onValueChange={(value: UserRole) =>
                    onUpdate({ requiredRole: value })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Timeout (hours)</Label>
                <Input
                  type="number"
                  value={step.timeoutHours || ""}
                  onChange={(e) =>
                    onUpdate({
                      timeoutHours: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Optional"
                  className="h-8"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <Switch
                  checked={step.isRequired}
                  onCheckedChange={(checked) =>
                    onUpdate({ isRequired: checked })
                  }
                />
                <span>Required</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={step.allowParallel}
                  onCheckedChange={(checked) =>
                    onUpdate({ allowParallel: checked })
                  }
                />
                <span>Allow parallel</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={step.autoAdvance}
                  onCheckedChange={(checked) =>
                    onUpdate({ autoAdvance: checked })
                  }
                />
                <span>Auto-advance</span>
              </label>
            </div>

            {step.description !== undefined && (
              <Textarea
                value={step.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Step description..."
                className="h-16"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove("up")}
              disabled={!canMoveUp}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove("down")}
              disabled={!canMoveDown}
            >
              ↓
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Arrow to next step */}
        {index < (step.order || 0) && (
          <div className="flex justify-center mt-3">
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
