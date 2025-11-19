/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Play,
  BookOpen,
  Lightbulb,
  Rocket,
  User,
  Building2,
  Palette,
  Share2,
  X,
} from "lucide-react";
import { OnboardingStep, OnboardingProgress } from "@shared/onboarding";

interface OnboardingWizardProps {
  userType: "agency" | "client";
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({
  userType,
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    loadOnboardingSteps();
  }, [userType]);

  const loadOnboardingSteps = async () => {
    // Define steps based on user type
    const agencySteps: OnboardingStep[] = [
      {
        id: "welcome",
        title: "Welcome to Aligned AI",
        description: "Let's get you set up in just a few minutes",
        component: "WelcomeStep",
        route: "/onboarding/welcome",
        isRequired: true,
        isCompleted: false,
        order: 1,
        estimatedTime: 1,
      },
      {
        id: "agency-setup",
        title: "Set Up Your Agency",
        description: "Configure your agency profile and branding",
        component: "AgencySetupStep",
        route: "/onboarding/agency",
        isRequired: true,
        isCompleted: false,
        order: 2,
        estimatedTime: 3,
        helpContent: {
          tooltips: [
            {
              selector: "#agency-name",
              content: "This name will appear on all client-facing materials",
              position: "bottom",
            },
            {
              selector: "#brand-colors",
              content: "Choose colors that match your agency's brand identity",
              position: "right",
            },
          ],
        },
      },
      {
        id: "first-brand",
        title: "Add Your First Brand",
        description: "Set up a client brand to start creating content",
        component: "BrandSetupStep",
        route: "/onboarding/brand",
        isRequired: true,
        isCompleted: false,
        order: 3,
        estimatedTime: 5,
        prerequisites: ["agency-setup"],
      },
      {
        id: "integrations",
        title: "Connect Social Platforms",
        description: "Link Instagram, Facebook, and other social accounts",
        component: "IntegrationsStep",
        route: "/onboarding/integrations",
        isRequired: false,
        isCompleted: false,
        order: 4,
        estimatedTime: 4,
        prerequisites: ["first-brand"],
      },
      {
        id: "first-post",
        title: "Create Your First Post",
        description: "Learn how to create and schedule content with AI",
        component: "FirstPostStep",
        route: "/onboarding/first-post",
        isRequired: true,
        isCompleted: false,
        order: 5,
        estimatedTime: 3,
        prerequisites: ["first-brand"],
      },
      {
        id: "invite-team",
        title: "Invite Your Team",
        description: "Add team members and set up collaboration",
        component: "TeamInviteStep",
        route: "/onboarding/team",
        isRequired: false,
        isCompleted: false,
        order: 6,
        estimatedTime: 2,
      },
    ];

    const clientSteps: OnboardingStep[] = [
      {
        id: "welcome",
        title: "Welcome to Your Brand Portal",
        description: "Your agency has set up this portal just for you",
        component: "ClientWelcomeStep",
        route: "/onboarding/welcome",
        isRequired: true,
        isCompleted: false,
        order: 1,
        estimatedTime: 1,
      },
      {
        id: "dashboard-tour",
        title: "Dashboard Overview",
        description: "Learn how to navigate your analytics and content",
        component: "DashboardTourStep",
        route: "/onboarding/dashboard",
        isRequired: true,
        isCompleted: false,
        order: 2,
        estimatedTime: 3,
      },
      {
        id: "approval-process",
        title: "Content Approval Process",
        description: "How to review and approve social media posts",
        component: "ApprovalProcessStep",
        route: "/onboarding/approvals",
        isRequired: true,
        isCompleted: false,
        order: 3,
        estimatedTime: 4,
      },
      {
        id: "analytics-basics",
        title: "Understanding Your Analytics",
        description: "Key metrics and insights about your social media",
        component: "AnalyticsBasicsStep",
        route: "/onboarding/analytics",
        isRequired: false,
        isCompleted: false,
        order: 4,
        estimatedTime: 3,
      },
    ];

    const selectedSteps = userType === "agency" ? agencySteps : clientSteps;
    setSteps(selectedSteps);

    setProgress({
      userId: "current-user",
      currentStep: selectedSteps[0]?.id || null,
      completedSteps: [],
      skippedSteps: [],
      startedAt: new Date().toISOString(),
      totalSteps: selectedSteps.length,
      progressPercentage: 0,
    });
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const currentStep = steps[currentStepIndex];

      setProgress((prev) =>
        prev
          ? {
              ...prev,
              completedSteps: [...prev.completedSteps, currentStep.id],
              currentStep: steps[currentStepIndex + 1]?.id || null,
              progressPercentage: ((currentStepIndex + 1) / steps.length) * 100,
            }
          : null,
      );

      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Complete onboarding
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);

      setProgress((prev) =>
        prev
          ? {
              ...prev,
              currentStep: steps[currentStepIndex - 1].id,
              progressPercentage: (currentStepIndex / steps.length) * 100,
            }
          : null,
      );
    }
  };

  const handleSkipStep = () => {
    const currentStep = steps[currentStepIndex];

    if (!currentStep.isRequired) {
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              skippedSteps: [...prev.skippedSteps, currentStep.id],
            }
          : null,
      );

      handleNext();
    }
  };

  const handleComplete = () => {
    setProgress((prev) =>
      prev
        ? {
            ...prev,
            completedAt: new Date().toISOString(),
            progressPercentage: 100,
          }
        : null,
    );

    onComplete();
  };

  const currentStep = steps[currentStepIndex];
  const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
  const completedTime = steps
    .slice(0, currentStepIndex)
    .reduce((sum, step) => sum + step.estimatedTime, 0);

  if (!currentStep || !progress) {
    return <div>Loading onboarding...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Getting Started
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime - completedTime} min remaining</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>
                {currentStepIndex} of {steps.length} completed
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span>{Math.round(progress.progressPercentage)}% complete</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getStepIcon(currentStep.id)}
            </div>
            <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
            <p className="text-gray-600 text-lg">{currentStep.description}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {currentStep.estimatedTime} minutes
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Step Content */}
            <OnboardingStepContent step={currentStep} userType={userType} />

            {/* Help Content */}
            {currentStep.helpContent && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Pro Tips</span>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  {currentStep.helpContent.tooltips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{tip.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {!currentStep.isRequired && (
              <Button variant="ghost" onClick={handleSkipStep}>
                Skip for now
              </Button>
            )}

            <Button variant="ghost" onClick={onSkip} className="gap-2">
              <X className="h-4 w-4" />
              Exit Setup
            </Button>

            <Button onClick={handleNext} className="gap-2">
              {currentStepIndex === steps.length - 1
                ? "Complete Setup"
                : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStepIcon(stepId: string) {
  const icons = {
    welcome: <Rocket className="h-8 w-8 text-blue-600" />,
    "agency-setup": <Building2 className="h-8 w-8 text-blue-600" />,
    "first-brand": <Palette className="h-8 w-8 text-blue-600" />,
    integrations: <Share2 className="h-8 w-8 text-blue-600" />,
    "first-post": <Play className="h-8 w-8 text-blue-600" />,
    "invite-team": <User className="h-8 w-8 text-blue-600" />,
    "dashboard-tour": <BookOpen className="h-8 w-8 text-blue-600" />,
    "approval-process": <CheckCircle className="h-8 w-8 text-blue-600" />,
    "analytics-basics": <BookOpen className="h-8 w-8 text-blue-600" />,
  };

  return (
    icons[stepId as keyof typeof icons] || (
      <Rocket className="h-8 w-8 text-blue-600" />
    )
  );
}

interface OnboardingStepContentProps {
  step: OnboardingStep;
  userType: "agency" | "client";
}

function OnboardingStepContent({ step, userType }: OnboardingStepContentProps) {
  switch (step.id) {
    case "welcome":
      return <WelcomeStepContent userType={userType} />;
    case "agency-setup":
      return <AgencySetupStepContent />;
    case "first-brand":
      return <BrandSetupStepContent />;
    case "integrations":
      return <IntegrationsStepContent />;
    case "first-post":
      return <FirstPostStepContent />;
    case "invite-team":
      return <TeamInviteStepContent />;
    case "dashboard-tour":
      return <DashboardTourStepContent />;
    case "approval-process":
      return <ApprovalProcessStepContent />;
    case "analytics-basics":
      return <AnalyticsBasicsStepContent />;
    default:
      return <div>Step content not found</div>;
  }
}

function WelcomeStepContent({ userType }: { userType: "agency" | "client" }) {
  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {userType === "agency"
            ? "Transform your social media agency with AI"
            : "Welcome to your brand's social media portal"}
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {userType === "agency"
            ? "Aligned AI helps you create better content faster, streamline client approvals, and prove ROI with powerful analytics."
            : "Your agency has created this portal to keep you informed about your social media performance and involved in the content approval process."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {userType === "agency" ? (
          <>
            <FeatureCard
              icon="🤖"
              title="AI Content Creation"
              description="Generate posts in your brand voice"
            />
            <FeatureCard
              icon="👥"
              title="Team Collaboration"
              description="Streamlined approval workflows"
            />
            <FeatureCard
              icon="📊"
              title="Powerful Analytics"
              description="Prove ROI to your clients"
            />
          </>
        ) : (
          <>
            <FeatureCard
              icon="📈"
              title="Performance Insights"
              description="See how your content performs"
            />
            <FeatureCard
              icon="✅"
              title="Easy Approvals"
              description="Review and approve posts quickly"
            />
            <FeatureCard
              icon="💬"
              title="Direct Communication"
              description="Collaborate with your agency"
            />
          </>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Placeholder components for other steps
function AgencySetupStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Set up your agency profile to get started with client management.
      </p>
      {/* Agency setup form would go here */}
    </div>
  );
}

function BrandSetupStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Add your first client brand to start creating content.
      </p>
      {/* Brand setup form would go here */}
    </div>
  );
}

function IntegrationsStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Connect social media accounts to publish and analyze content.
      </p>
      {/* Integrations setup would go here */}
    </div>
  );
}

function FirstPostStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Let's create your first AI-generated social media post.
      </p>
      {/* First post creation would go here */}
    </div>
  );
}

function TeamInviteStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Invite team members to collaborate on content creation.
      </p>
      {/* Team invitation form would go here */}
    </div>
  );
}

function DashboardTourStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Take a quick tour of your dashboard features.
      </p>
      {/* Interactive dashboard tour would go here */}
    </div>
  );
}

function ApprovalProcessStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Learn how to review and approve content from your agency.
      </p>
      {/* Approval process demo would go here */}
    </div>
  );
}

function AnalyticsBasicsStepContent() {
  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600">
        Understand your social media analytics and key metrics.
      </p>
      {/* Analytics overview would go here */}
    </div>
  );
}
