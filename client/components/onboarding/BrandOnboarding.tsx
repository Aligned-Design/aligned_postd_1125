import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { InlineError } from "@/components/ui/error-state";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BrandOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export default function BrandOnboarding({
  open,
  onComplete,
}: BrandOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    website_url: "",
    industry: "",
    description: "",
    tone_keywords: [] as string[],
    primary_color: "#8B5CF6",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Brand name is required";
      if (
        formData.website_url &&
        !formData.website_url.match(/^https?:\/\/.+/)
      ) {
        newErrors.website_url = "Please enter a valid URL";
      }
    }

    if (currentStep === 2) {
      if (!formData.industry.trim())
        newErrors.industry = "Industry helps us customize content for you";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(step) || !user) return;

    setLoading(true);
    try {
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .insert([
          {
            ...formData,
            slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
          },
        ])
        .select()
        .single();

      if (brandError) throw brandError;

      await supabase.from("brand_members").insert([
        {
          brand_id: brandData.id,
          user_id: user.id,
          role: "owner",
        },
      ]);

      toast({
        title: "Brand created!",
        description: `${formData.name} is ready. Let's start creating content.`,
      });

      onComplete();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error creating brand",
        description: message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", description: "Name and website" },
    { number: 2, title: "Brand Details", description: "Industry and voice" },
    { number: 3, title: "Customize", description: "Colors and preferences" },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[600px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Create Your First Brand
          </DialogTitle>
          <DialogDescription>
            Follow these 3 quick steps to set up your brand. Takes less than 2
            minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between mb-6">
          {steps.map((s) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  step >= s.number
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-background text-muted-foreground"
                }`}
              >
                {step > s.number ? <Check className="h-5 w-5" /> : s.number}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="brand-name">
                  Brand Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand-name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  placeholder="Acme Corp"
                  className="min-h-[44px]"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <InlineError message={errors.name} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => {
                    setFormData({ ...formData, website_url: e.target.value });
                    if (errors.website_url)
                      setErrors({ ...errors, website_url: "" });
                  }}
                  placeholder="https://acme.com"
                  className="min-h-[44px]"
                  aria-invalid={!!errors.website_url}
                />
                {errors.website_url && (
                  <InlineError message={errors.website_url} />
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => {
                    setFormData({ ...formData, industry: e.target.value });
                    if (errors.industry) setErrors({ ...errors, industry: "" });
                  }}
                  placeholder="e.g., Technology, Healthcare, Retail"
                  className="min-h-[44px]"
                  aria-invalid={!!errors.industry}
                />
                {errors.industry && <InlineError message={errors.industry} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Brand Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What does your brand do? What makes it unique?"
                  rows={3}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="color">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    className="w-20 h-12"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    placeholder="#8B5CF6"
                    className="min-h-[44px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This color will help identify your brand across the platform
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="min-h-[44px]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} className="min-h-[44px]">
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="min-h-[44px]"
            >
              {loading ? "Creating..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
