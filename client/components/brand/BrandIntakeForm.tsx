import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system";
import type { BrandIntakeRequest } from "@shared/api";

interface BrandIntakeFormProps {
  onSubmit: (data: BrandIntakeRequest) => Promise<void>;
  onSave?: (data: Partial<BrandIntakeRequest>) => Promise<void>;
  initialData?: Partial<BrandIntakeRequest>;
}

const FORM_STEPS = [
  { id: "basic", title: "Basic Info", fields: 4 },
  { id: "voice", title: "Brand Voice", fields: 6 },
  { id: "visual", title: "Visual Identity", fields: 5 },
  { id: "content", title: "Content Guidelines", fields: 4 },
  { id: "compliance", title: "Guidelines", fields: 3 },
];

export function BrandIntakeForm({
  onSubmit,
  onSave,
  initialData,
}: BrandIntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<BrandIntakeRequest>>(
    initialData || {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSave && Object.keys(formData).length > 0) {
        onSave(formData);
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, onSave]);

  const totalFields = FORM_STEPS.reduce((sum, step) => sum + step.fields, 0);
  const completedFields = Object.keys(formData).length;
  const progress = Math.round((completedFields / totalFields) * 100);

  const updateField = (field: keyof BrandIntakeRequest, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData as BrandIntakeRequest);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const required = [
      "brandName",
      "industry",
      "missionStatement",
      "targetAudience",
    ];
    return required.every(
      (field) => formData[field as keyof BrandIntakeRequest],
    );
  };

  const renderStep = () => {
    const step = FORM_STEPS[currentStep];

    switch (step.id) {
      case "basic":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={formData.brandName || ""}
                onChange={(e) => updateField("brandName", e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter your brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Industry *
              </label>
              <select
                value={formData.industry || ""}
                onChange={(e) => updateField("industry", e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="retail">Retail</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Company Size
              </label>
              <select
                value={formData.companySize || ""}
                onChange={(e) => updateField("companySize", e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Select size</option>
                <option value="startup">Startup (1-10)</option>
                <option value="small">Small (11-50)</option>
                <option value="medium">Medium (51-200)</option>
                <option value="large">Large (201-1000)</option>
                <option value="enterprise">Enterprise (1000+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={formData.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        );

      case "voice":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Brand Voice & Messaging</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mission Statement *
              </label>
              <textarea
                value={formData.missionStatement || ""}
                onChange={(e) =>
                  updateField("missionStatement", e.target.value)
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary h-24"
                placeholder="What is your brand's mission?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Value Proposition
              </label>
              <textarea
                value={formData.valueProposition || ""}
                onChange={(e) =>
                  updateField("valueProposition", e.target.value)
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary h-24"
                placeholder="What unique value do you provide?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target Audience *
              </label>
              <textarea
                value={formData.targetAudience || ""}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary h-24"
                placeholder="Describe your ideal customer"
              />
            </div>
          </div>
        );

      // Add other steps...
      default:
        return <div>Step {currentStep + 1} content</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {progress}% complete</span>
          {lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between mb-8">
        {FORM_STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            className={cn(
              "flex-1 p-2 text-sm font-medium border-b-2 transition-colors",
              index === currentStep
                ? "border-primary text-primary"
                : "border-gray-200 text-gray-500 hover:text-gray-700",
            )}
          >
            {step.title}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="mb-8">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="flex gap-4">
          {currentStep === FORM_STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? "Creating Brand Kit..." : "Create Brand Kit"}
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}
