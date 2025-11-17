import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  BrandIntakeFormData,
  FONT_FAMILIES,
  FONT_WEIGHTS,
} from "@/types/brand-intake";
import { Upload, X, Image } from "lucide-react";
import { useState } from "react";

interface Section3Props {
  data: Partial<BrandIntakeFormData>;
  onChange: (field: keyof BrandIntakeFormData, value: unknown) => void;
  errors: Record<string, string>;
}

export default function Section3VisualIdentity({
  data,
  onChange,
  errors: _errors,
}: Section3Props) {
  const [newReferenceLink, setNewReferenceLink] = useState("");

  const toggleFontWeight = (weight: string) => {
    const current = data.fontWeights || [];
    const updated = current.includes(weight)
      ? current.filter((w) => w !== weight)
      : [...current, weight];
    onChange("fontWeights", updated);
  };

  const addReferenceLink = () => {
    if (newReferenceLink.trim() && newReferenceLink.match(/^https?:\/\/.+/)) {
      const current = data.referenceMaterialLinks || [];
      onChange("referenceMaterialLinks", [...current, newReferenceLink.trim()]);
      setNewReferenceLink("");
    }
  };

  const removeReferenceLink = (link: string) => {
    const current = data.referenceMaterialLinks || [];
    onChange(
      "referenceMaterialLinks",
      current.filter((l) => l !== link),
    );
  };

  const handleFileChange = (
    field: keyof BrandIntakeFormData,
    files: FileList | null,
  ) => {
    if (files) {
      const fileArray = Array.from(files);
      onChange(field, fileArray);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Visual Identity</h2>
        <p className="text-muted-foreground">
          Define your brand's visual style, colors, and design assets
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <HelpTooltip content="Your main brand color in hex format." />
            </div>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={data.primaryColor || "#8B5CF6"}
                onChange={(e) => onChange("primaryColor", e.target.value)}
                className="w-16 h-12 p-1"
              />
              <Input
                value={data.primaryColor || "#8B5CF6"}
                onChange={(e) => onChange("primaryColor", e.target.value)}
                placeholder="#8B5CF6"
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <HelpTooltip content="A complementary color for variety." />
            </div>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={data.secondaryColor || "#F0F7F7"}
                onChange={(e) => onChange("secondaryColor", e.target.value)}
                className="w-16 h-12 p-1"
              />
              <Input
                value={data.secondaryColor || "#F0F7F7"}
                onChange={(e) => onChange("secondaryColor", e.target.value)}
                placeholder="#F0F7F7"
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <HelpTooltip content="Optional highlight tone for CTAs and emphasis." />
            </div>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                type="color"
                value={data.accentColor || "#EC4899"}
                onChange={(e) => onChange("accentColor", e.target.value)}
                className="w-16 h-12 p-1"
              />
              <Input
                value={data.accentColor || "#EC4899"}
                onChange={(e) => onChange("accentColor", e.target.value)}
                placeholder="#EC4899"
                className="min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <HelpTooltip content="Primary typeface for your brand." />
          </div>
          <Select
            value={data.fontFamily || "Nourd"}
            onValueChange={(value) => onChange("fontFamily", value)}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Font Weights</Label>
            <HelpTooltip content="Select the weights you use in your brand (e.g., Regular, Bold)." />
          </div>
          <div className="flex flex-wrap gap-2">
            {FONT_WEIGHTS.map((weight) => (
              <label
                key={weight}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={(data.fontWeights || []).includes(weight)}
                  onCheckedChange={() => toggleFontWeight(weight)}
                />
                <span className="text-sm">{weight}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="logoUpload">Logo Upload</Label>
            <HelpTooltip content="Upload your brand logo (PNG or SVG preferred)." />
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
            <Input
              id="logoUpload"
              type="file"
              accept=".png,.svg,.jpg,.jpeg"
              onChange={(e) => handleFileChange("logoFiles", e.target.files)}
              className="hidden"
            />
            <label
              htmlFor="logoUpload"
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload logo (PNG, SVG, JPG)
              </p>
              {(data.logoFiles || []).length > 0 && (
                <Badge variant="secondary">
                  {data.logoFiles!.length} file(s) selected
                </Badge>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="brandImagery">Brand Imagery Uploads</Label>
            <HelpTooltip content="Up to 10 images that represent your brand's visual style." />
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
            <Input
              id="brandImagery"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                handleFileChange("brandImageryFiles", e.target.files)
              }
              className="hidden"
            />
            <label
              htmlFor="brandImagery"
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <Image className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload brand images (up to 10)
              </p>
              {(data.brandImageryFiles || []).length > 0 && (
                <Badge variant="secondary">
                  {data.brandImageryFiles!.length} file(s) selected
                </Badge>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="referenceLinks">Reference Material Links</Label>
            <HelpTooltip content="Links to Google Drive, Pinterest, Notion, or brand PDFs." />
          </div>
          <div className="flex gap-2">
            <Input
              id="referenceLinks"
              type="url"
              value={newReferenceLink}
              onChange={(e) => setNewReferenceLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addReferenceLink();
                }
              }}
              placeholder="https://... (press Enter to add)"
              className="min-h-[44px]"
            />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {(data.referenceMaterialLinks || []).map((link) => (
              <div
                key={link}
                className="flex items-center gap-2 p-2 border rounded"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  {link}
                </a>
                <button
                  type="button"
                  onClick={() => removeReferenceLink(link)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove link"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
