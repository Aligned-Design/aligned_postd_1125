export interface PricingTier {
  id: string;
  name: string;
  description: string;
  pricePerBrand: number;
  minBrands: number;
  maxBrands: number | null;
  features: string[];
  isPopular?: boolean;
  savings?: string;
}

export interface TrialInfo {
  duration: number; // days
  features: string[];
  included: {
    contentGeneration: boolean;
    channelPosting: boolean;
    analytics: boolean;
    approvalWorkflow: boolean;
  };
}

export interface PricingCalculation {
  selectedTier: PricingTier;
  brandCount: number;
  monthlyTotal: number;
  yearlyTotal: number;
  yearlySavings: number;
  pricePerBrand: number;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for growing agencies',
    pricePerBrand: 199,
    minBrands: 1,
    maxBrands: 9,
    features: [
      'AI-powered content generation',
      'Multi-platform publishing',
      'Basic analytics & reporting',
      'Client approval workflows',
      'Team collaboration tools',
      'Email support'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Best value for scaling agencies',
    pricePerBrand: 149,
    minBrands: 10,
    maxBrands: 19,
    features: [
      'Everything in Starter',
      'Advanced analytics & insights',
      'White-label client portals',
      'Custom workflow automation',
      'Priority support',
      'Team training sessions'
    ],
    isPopular: true,
    savings: 'Save $50/brand'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large agencies and enterprises',
    pricePerBrand: 99,
    minBrands: 20,
    maxBrands: null,
    features: [
      'Everything in Growth',
      'Enterprise integrations',
      'Custom AI training',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom onboarding'
    ],
    savings: 'Save $100/brand'
  }
];

export const TRIAL_INFO: TrialInfo = {
  duration: 7,
  features: [
    'Full access to AI content generation',
    'Post to all connected social channels',
    'Complete analytics dashboard',
    'Client approval workflows',
    'Team collaboration features'
  ],
  included: {
    contentGeneration: true,
    channelPosting: true,
    analytics: true,
    approvalWorkflow: true
  }
};
