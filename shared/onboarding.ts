export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  route: string;
  isRequired: boolean;
  isCompleted: boolean;
  order: number;
  estimatedTime: number; // minutes
  prerequisites?: string[];
  helpContent?: {
    videoUrl?: string;
    documentUrl?: string;
    tooltips: Array<{
      selector: string;
      content: string;
      position: 'top' | 'bottom' | 'left' | 'right';
    }>;
  };
}

export interface OnboardingProgress {
  userId: string;
  brandId?: string;
  currentStep: string | null;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: string;
  completedAt?: string;
  totalSteps: number;
  progressPercentage: number;
}

export interface UserExperienceLevel {
  level: 'beginner' | 'intermediate' | 'advanced';
  showAdvancedFeatures: boolean;
  preferredComplexity: 'simple' | 'detailed' | 'expert';
  completedOnboarding: boolean;
  lastActiveAt: string;
}
