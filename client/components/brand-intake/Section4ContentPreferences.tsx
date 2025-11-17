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
  PLATFORMS,
  POST_FREQUENCIES,
  CONTENT_TYPES,
} from "@/types/brand-intake";
import { X } from "lucide-react";
import { useState } from "react";

interface Section4Props {
  data: Partial<BrandIntakeFormData>;
  onChange: (field: keyof BrandIntakeFormData, value: unknown) => void;
  errors: Record<string, string>;
}

export default function Section4ContentPreferences({
  data,
  onChange,
  errors: _errors,
}: Section4Props) {
  const [newHashtag, setNewHashtag] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");

  const togglePlatform = (platform: string) => {
    const current = data.platformsUsed || [];
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];
    onChange("platformsUsed", updated);
  };

  const toggleContentType = (type: string) => {
    const current = data.preferredContentTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange("preferredContentTypes", updated);
  };

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const hashtag = newHashtag.trim().startsWith("#")
        ? newHashtag.trim()
        : `#${newHashtag.trim()}`;
      const current = data.hashtagsToInclude || [];
      onChange("hashtagsToInclude", [...current, hashtag]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (hashtag: string) => {
    const current = data.hashtagsToInclude || [];
    onChange(
      "hashtagsToInclude",
      current.filter((h) => h !== hashtag),
    );
  };

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      const current = data.competitorsOrInspiration || [];
      onChange("competitorsOrInspiration", [...current, newCompetitor.trim()]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (competitor: string) => {
    const current = data.competitorsOrInspiration || [];
    onChange(
      "competitorsOrInspiration",
      current.filter((c) => c !== competitor),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Preferences</h2>
        <p className="text-muted-foreground">
          Tell us how and where you want to publish content
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Platforms Used</Label>
            <HelpTooltip content="Select all platforms where you publish content." />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PLATFORMS.map((platform) => (
              <label
                key={platform}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={(data.platformsUsed || []).includes(platform)}
                  onCheckedChange={() => togglePlatform(platform)}
                />
                <span className="text-sm">{platform}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="postFrequency">Post Frequency</Label>
            <HelpTooltip content="How often you want to publish content." />
          </div>
          <Select
            value={data.postFrequency || ""}
            onValueChange={(value) => onChange("postFrequency", value)}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select posting frequency" />
            </SelectTrigger>
            <SelectContent>
              {POST_FREQUENCIES.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Preferred Content Types</Label>
            <HelpTooltip content="What formats do you want to create?" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CONTENT_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={(data.preferredContentTypes || []).includes(type)}
                  onCheckedChange={() => toggleContentType(type)}
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="hashtags">Hashtags to Include</Label>
            <HelpTooltip content="Your top recurring brand hashtags." />
          </div>
          <Input
            id="hashtags"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHashtag();
              }
            }}
            placeholder="Type hashtag and press Enter"
            className="min-h-[44px]"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {(data.hashtagsToInclude || []).map((hashtag) => (
              <Badge key={hashtag} variant="secondary" className="gap-1">
                {hashtag}
                <button
                  type="button"
                  onClick={() => removeHashtag(hashtag)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${hashtag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="competitors">
              Competitors or Inspiration Brands
            </Label>
            <HelpTooltip content="Brands we can study for comparative tone modeling." />
          </div>
          <Input
            id="competitors"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCompetitor();
              }
            }}
            placeholder="Type brand name and press Enter"
            className="min-h-[44px]"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {(data.competitorsOrInspiration || []).map((competitor) => (
              <Badge key={competitor} variant="outline" className="gap-1">
                {competitor}
                <button
                  type="button"
                  onClick={() => removeCompetitor(competitor)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${competitor}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
