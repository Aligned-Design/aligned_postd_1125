import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { InlineError } from "@/components/ui/error-state";
import { BrandIntakeFormData, INDUSTRIES } from "@/types/brand-intake";

interface Section1Props {
  data: Partial<BrandIntakeFormData>;
  onChange: (field: keyof BrandIntakeFormData, value: unknown) => void;
  errors: Record<string, string>;
}

export default function Section1BrandBasics({
  data,
  onChange,
  errors,
}: Section1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Brand Basics</h2>
        <p className="text-muted-foreground">
          Let's start with the fundamentals of your brand identity
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="brandName">
              Brand Name <span className="text-destructive">*</span>
            </Label>
            <HelpTooltip content="The primary name your brand is known by. This will be used across all content." />
          </div>
          <Input
            id="brandName"
            value={data.brandName || ""}
            onChange={(e) => onChange("brandName", e.target.value)}
            placeholder="Aligned AI"
            className="min-h-[44px]"
            aria-invalid={!!errors.brandName}
          />
          {errors.brandName && <InlineError message={errors.brandName} />}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <HelpTooltip content="We'll use this to auto-extract your brand colors, keywords, and metadata." />
          </div>
          <Input
            id="websiteUrl"
            type="url"
            value={data.websiteUrl || ""}
            onChange={(e) => onChange("websiteUrl", e.target.value)}
            placeholder="https://aligned.ai"
            className="min-h-[44px]"
            aria-invalid={!!errors.websiteUrl}
          />
          {errors.websiteUrl && <InlineError message={errors.websiteUrl} />}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="tagline">Tagline / Slogan</Label>
            <HelpTooltip content="A catchy one-liner that appears in social captions and bios." />
          </div>
          <Input
            id="tagline"
            value={data.tagline || ""}
            onChange={(e) => onChange("tagline", e.target.value)}
            placeholder="The Future of Done-For-You Marketing, Done Intelligently"
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="shortDescription">
              Short Brand Description{" "}
              <span className="text-destructive">*</span>
            </Label>
            <HelpTooltip content="2-3 sentences that train our AI to understand your brand's essence." />
          </div>
          <Textarea
            id="shortDescription"
            value={data.shortDescription || ""}
            onChange={(e) => onChange("shortDescription", e.target.value)}
            placeholder="An intelligent brand content platform that gives agencies and businesses the power to stay a month ahead—without the overwhelm..."
            rows={4}
            aria-invalid={!!errors.shortDescription}
          />
          {errors.shortDescription && (
            <InlineError message={errors.shortDescription} />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="industry">
              Industry / Category <span className="text-destructive">*</span>
            </Label>
            <HelpTooltip content="Helps us tailor content recommendations and best practices." />
          </div>
          <Select
            value={data.industry || ""}
            onValueChange={(value) => onChange("industry", value)}
          >
            <SelectTrigger
              className="min-h-[44px]"
              aria-invalid={!!errors.industry}
            >
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <InlineError message={errors.industry} />}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="primaryAudience">Primary Audience</Label>
            <HelpTooltip content="Who are you speaking to? e.g., 'Small business owners aged 30-50'" />
          </div>
          <Input
            id="primaryAudience"
            value={data.primaryAudience || ""}
            onChange={(e) => onChange("primaryAudience", e.target.value)}
            placeholder="Marketing agencies and growing brands"
            className="min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}
