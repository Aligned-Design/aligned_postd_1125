import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BrandIntakeFormData } from "@/types/brand-intake";
import { AutosaveIndicator } from "@/components/ui/autosave-indicator";
import { useAutosave } from "@/hooks/use-autosave";
import { uploadBrandFiles } from "@/lib/fileUpload";
import { logWarning } from "@/lib/logger";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";

import Section1BrandBasics from "@/components/brand-intake/Section1BrandBasics";
import Section2VoiceMessaging from "@/components/brand-intake/Section2VoiceMessaging";
import Section3VisualIdentity from "@/components/brand-intake/Section3VisualIdentity";
import Section4ContentPreferences from "@/components/brand-intake/Section4ContentPreferences";
import Section5Operational from "@/components/brand-intake/Section5Operational";
import Section6AITraining from "@/components/brand-intake/Section6AITraining";

const SECTIONS = [
  { number: 1, title: "Brand Basics", component: Section1BrandBasics },
  { number: 2, title: "Voice & Messaging", component: Section2VoiceMessaging },
  { number: 3, title: "Visual Identity", component: Section3VisualIdentity },
  {
    number: 4,
    title: "Content Preferences",
    component: Section4ContentPreferences,
  },
  { number: 5, title: "Operational", component: Section5Operational },
  { number: 6, title: "AI Training", component: Section6AITraining },
];

export default function BrandIntake() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brandId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<BrandIntakeFormData>>({
    primaryColor: "#8B5CF6",
    secondaryColor: "#F0F7F7",
    accentColor: "#EC4899",
    fontFamily: "Nourd",
    brandPersonality: [],
    toneKeywords: [],
    fontWeights: [],
    logoFiles: [],
    brandImageryFiles: [],
    referenceMaterialLinks: [],
    platformsUsed: [],
    preferredContentTypes: [],
    hashtagsToInclude: [],
    competitorsOrInspiration: [],
    socialHandles: [],
    textReferenceFiles: [],
    visualReferenceFiles: [],
    previousContentFiles: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  // Auto-save functionality
  const {
    saving,
    lastSaved,
    error: autosaveError,
  } = useAutosave({
    data: formData,
    onSave: async (data) => {
      if (!brandId) return;

      // Save non-file fields to brand_kit JSON
      const {
        logoFiles,
        brandImageryFiles,
        textReferenceFiles,
        visualReferenceFiles,
        previousContentFiles,
        ...dataToSave
      } = data;

      await supabase
        .from("brands")
        .update({ brand_kit: dataToSave })
        .eq("id", brandId);
    },
    interval: 5000,
    enabled: !!brandId,
  });

  useEffect(() => {
    if (!brandId) {
      toast({
        title: "No brand selected",
        description: "Please create or select a brand first.",
        variant: "destructive",
      });
      navigate("/brands");
    }
  }, [brandId, navigate, toast]);

  const handleFieldChange = (
    field: keyof BrandIntakeFormData,
    value: unknown,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.brandName?.trim())
        newErrors.brandName = "Brand name is required";
      if (!formData.shortDescription?.trim())
        newErrors.shortDescription = "Description is required";
      if (!formData.industry) newErrors.industry = "Please select an industry";
      if (formData.websiteUrl && !formData.websiteUrl.match(/^https?:\/\/.+/)) {
        newErrors.websiteUrl = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < SECTIONS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleImportFromWebsite = async () => {
    if (!brandId || !formData.websiteUrl) {
      toast({
        title: "Website URL required",
        description: "Please enter a website URL in Brand Basics",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportProgress("Analyzing website...");

    try {
      // ✅ Use real crawler API instead of Edge Function fallback
      // Get workspaceId/tenantId from user context for image persistence
      const workspaceId = (user as any)?.workspaceId || (user as any)?.tenantId || localStorage.getItem("aligned_workspace_id");

      // Use apiPost for authenticated requests
      const { apiPost } = await import("@/lib/api");

      setImportProgress("Crawling website...");

      // Call real crawler API with sync mode
      const result = await apiPost<{
        success: boolean;
        brandKit: any;
        status: string;
      }>("/api/crawl/start?sync=true", {
        brand_id: brandId,
        url: formData.websiteUrl,
        websiteUrl: formData.websiteUrl,
        sync: true,
        workspaceId: workspaceId,
      });

      if (!result.success) {
        throw new Error("Failed to crawl website. Please try again.");
      }

      setImportProgress("Processing images and colors...");

      // Wait a moment for images to be persisted
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setImportProgress("Processing complete!");

      const brandKit = result.brandKit || {};

      // Update form data with imported values from real scraped data
      setFormData((prev) => ({
        ...prev,
        primaryColor: brandKit.colors?.primary || brandKit.colors?.allColors?.[0] || prev.primaryColor,
        secondaryColor: brandKit.colors?.secondary || brandKit.colors?.allColors?.[1] || prev.secondaryColor,
        accentColor: brandKit.colors?.accent || brandKit.colors?.allColors?.[2] || prev.accentColor,
        toneKeywords: brandKit.voice_summary?.tone || prev.toneKeywords,
        brandPersonality: brandKit.voice_summary?.personality || prev.brandPersonality,
        shortDescription: brandKit.about_blurb || prev.shortDescription,
      }));

      toast({
        title: "Import successful!",
        description: `Found ${brandKit.images?.length || 0} images and ${brandKit.colors?.allColors?.length || 0} colors. Review and adjust as needed.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      
      // ✅ Better error messages - no silent fallback
      let userMessage = "Failed to analyze website. ";
      if (message.includes("timeout") || message.includes("Crawl timeout")) {
        userMessage += "The website took too long to load. Please try again or check if the website is accessible.";
      } else if (message.includes("browser") || message.includes("launch")) {
        userMessage += "Unable to access the website. Please verify the URL is correct and try again.";
      } else if (message.includes("network") || message.includes("connection")) {
        userMessage += "Unable to connect to the website. Please check the URL and try again.";
      } else if (message.includes("401") || message.includes("403") || message.includes("Unauthorized")) {
        userMessage += "Authentication error. Please refresh the page and try again.";
      } else {
        userMessage += message || "Please try again or contact support if the issue persists.";
      }

      toast({
        title: "Import failed",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setImportProgress("");
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep() || !brandId || !user) return;

    // Check for duplicate brand by website URL
    if (formData.websiteUrl) {
      try {
        const normalizedUrl = new URL(formData.websiteUrl).hostname;
        const { data: allBrands } = await supabase
          .from("brands")
          .select("id, brand_name, brand_kit")
          .neq("id", brandId); // Exclude current brand

        if (allBrands && allBrands.length > 0) {
          for (const brand of allBrands) {
            if (brand.brand_kit?.website_url) {
              try {
                const existingUrl = new URL(brand.brand_kit.website_url)
                  .hostname;
                if (existingUrl === normalizedUrl) {
                  toast({
                    title: "Duplicate Brand",
                    description: `A brand with website "${normalizedUrl}" already exists (${brand.brand_name}). Please use a different website or contact support to merge brands.`,
                    variant: "destructive",
                  });
                  return;
                }
              } catch {
                // Invalid URL in existing brand, skip
              }
            }
          }
        }
      } catch (error) {
        // If URL parsing fails, allow submission (user will see validation error)
        logWarning("Error checking for duplicate brands", { error });
      }
    }

    setSubmitting(true);
    try {
      // Upload all files with progress tracking
      const uploadPromises: Promise<unknown>[] = [];
      let totalUploadItems = 0;
      let completedUploadItems = 0;

      // Count total upload items
      if (formData.logoFiles?.length) totalUploadItems += 1;
      if (formData.brandImageryFiles?.length) totalUploadItems += 1;
      if (formData.textReferenceFiles?.length) totalUploadItems += 1;
      if (formData.visualReferenceFiles?.length) totalUploadItems += 1;
      if (formData.previousContentFiles?.length) totalUploadItems += 1;

      const handleUploadProgress = (
        categoryName: string,
        progress: { currentFile: number; totalFiles: number; progress: number },
      ) => {
        setUploadStatus(
          `Uploading ${categoryName}: ${progress.currentFile}/${progress.totalFiles} (${progress.progress}%)`,
        );
        setUploadProgress(
          Math.round(
            ((completedUploadItems + progress.progress / 100) /
              totalUploadItems) *
              100,
          ),
        );
      };

      if (formData.logoFiles?.length) {
        uploadPromises.push(
          uploadBrandFiles(
            formData.logoFiles,
            brandId,
            "logos",
            "logo",
            (progress) => handleUploadProgress("Logo", progress),
          ).then((result) => {
            completedUploadItems += 1;
            return result;
          }),
        );
      }

      if (formData.brandImageryFiles?.length) {
        uploadPromises.push(
          uploadBrandFiles(
            formData.brandImageryFiles,
            brandId,
            "imagery",
            "imagery",
            (progress) => handleUploadProgress("Imagery", progress),
          ).then((result) => {
            completedUploadItems += 1;
            return result;
          }),
        );
      }

      if (formData.textReferenceFiles?.length) {
        uploadPromises.push(
          uploadBrandFiles(
            formData.textReferenceFiles,
            brandId,
            "references",
            "text_reference",
            (progress) => handleUploadProgress("Text References", progress),
          ).then((result) => {
            completedUploadItems += 1;
            return result;
          }),
        );
      }

      if (formData.visualReferenceFiles?.length) {
        uploadPromises.push(
          uploadBrandFiles(
            formData.visualReferenceFiles,
            brandId,
            "references",
            "visual_reference",
            (progress) => handleUploadProgress("Visual References", progress),
          ).then((result) => {
            completedUploadItems += 1;
            return result;
          }),
        );
      }

      if (formData.previousContentFiles?.length) {
        uploadPromises.push(
          uploadBrandFiles(
            formData.previousContentFiles,
            brandId,
            "content",
            "previous_content",
            (progress) => handleUploadProgress("Previous Content", progress),
          ).then((result) => {
            completedUploadItems += 1;
            return result;
          }),
        );
      }

      await Promise.all(uploadPromises);
      setUploadProgress(0);
      setUploadStatus("");

      // Save final form data
      const {
        logoFiles,
        brandImageryFiles,
        textReferenceFiles,
        visualReferenceFiles,
        previousContentFiles,
        ...dataToSave
      } = formData;

      await supabase
        .from("brands")
        .update({
          brand_kit: dataToSave,
          intake_completed: true,
          intake_completed_at: new Date().toISOString(),
        })
        .eq("id", brandId);

      toast({
        title: "Brand intake completed!",
        description:
          "Your brand profile has been saved. Redirecting to summary...",
      });

      navigate(`/brand-snapshot?brandId=${brandId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Error saving brand intake",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentSection = SECTIONS[currentStep - 1].component;
  const progress = (currentStep / SECTIONS.length) * 100;

  return (
    <PageShell>
      <PageHeader
        title="Brand Intake Form"
        subtitle={`Step ${currentStep} of ${SECTIONS.length}: ${SECTIONS[currentStep - 1]?.title || ""}`}
      />

      {/* Progress Header */}
      <div className="border-b bg-white sticky top-0 z-10 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 px-4 sm:px-6 md:px-8 lg:px-10 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-600">
              Step {currentStep} of {SECTIONS.length}: {SECTIONS[currentStep - 1].title}
            </p>
          </div>
          {brandId && (
            <AutosaveIndicator
              saving={saving}
              lastSaved={lastSaved}
              error={autosaveError}
            />
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentStep === 1 && formData.websiteUrl && (
          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1 text-slate-900">
                  Import from Website
                </h3>
                <p className="text-sm text-slate-600">
                  Automatically extract brand colors, voice, and keywords from
                  your website.
                </p>
              </div>
              <Button
                onClick={handleImportFromWebsite}
                disabled={importing || !formData.websiteUrl}
                variant="outline"
                className="shrink-0"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {importProgress}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import from Website
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        <div className="mb-8 flex justify-between">
          {SECTIONS.map((section) => (
            <div
              key={section.number}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <button
                onClick={() => setCurrentStep(section.number)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  currentStep > section.number
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === section.number
                      ? "border-primary bg-background text-primary"
                      : "border-muted bg-background text-muted-foreground"
                }`}
                aria-label={`Go to ${section.title}`}
              >
                {currentStep > section.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  section.number
                )}
              </button>
              <span className="hidden sm:block text-xs text-center text-muted-foreground">
                {section.title}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-xl p-6 md:p-8">
          <CurrentSection
            data={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        </div>

        {uploadProgress > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium mb-2">{uploadStatus}</p>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {uploadProgress}% complete
            </p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
            className="min-h-[44px]"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < SECTIONS.length ? (
            <Button onClick={handleNext} className="min-h-[44px]">
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-h-[44px]"
              variant="default"
            >
              {submitting ? "Processing..." : "Complete Brand Intake"}
            </Button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          You can skip optional fields and return later. All progress is
          auto-saved.
        </div>
      </div>
    </PageShell>
  );
}
