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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  BrandIntakeFormData,
  BRAND_PERSONALITIES,
  WRITING_STYLES,
} from "@/types/brand-intake";
import { X } from "lucide-react";
import { useState } from "react";

interface Section2Props {
  data: Partial<BrandIntakeFormData>;
  onChange: (field: keyof BrandIntakeFormData, value: unknown) => void;
  errors: Record<string, string>;
}

export default function Section2VoiceMessaging({
  data,
  onChange,
  errors: _errors,
}: Section2Props) {
  const [newToneKeyword, setNewToneKeyword] = useState("");
  const [_newPhrase, _setNewPhrase] = useState("");

  const togglePersonality = (personality: string) => {
    const current = data.brandPersonality || [];
    const updated = current.includes(personality)
      ? current.filter((p) => p !== personality)
      : [...current, personality];
    onChange("brandPersonality", updated);
  };

  const addToneKeyword = () => {
    if (newToneKeyword.trim()) {
      const current = data.toneKeywords || [];
      onChange("toneKeywords", [...current, newToneKeyword.trim()]);
      setNewToneKeyword("");
    }
  };

  const removeToneKeyword = (keyword: string) => {
    const current = data.toneKeywords || [];
    onChange(
      "toneKeywords",
      current.filter((k) => k !== keyword),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Voice & Messaging</h2>
        <p className="text-muted-foreground">
          Define how your brand communicates and what tone to use
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Brand Personality</Label>
            <HelpTooltip content="Select all traits that describe your brand's character. These guide AI tone." />
          </div>
          <div className="flex flex-wrap gap-2">
            {BRAND_PERSONALITIES.map((personality) => (
              <label
                key={personality}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={(data.brandPersonality || []).includes(personality)}
                  onCheckedChange={() => togglePersonality(personality)}
                />
                <span className="text-sm">{personality}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="toneKeywords">Tone Keywords</Label>
            <HelpTooltip content='Add descriptive words like "Empowering", "Educated", "Witty" that define your voice.' />
          </div>
          <div className="flex gap-2">
            <Input
              id="toneKeywords"
              value={newToneKeyword}
              onChange={(e) => setNewToneKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addToneKeyword();
                }
              }}
              placeholder="Type keyword and press Enter"
              className="min-h-[44px]"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(data.toneKeywords || []).map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeToneKeyword(keyword)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${keyword}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="writingStyle">Writing Style</Label>
            <HelpTooltip content="The overall tone of your written content." />
          </div>
          <Select
            value={data.writingStyle || ""}
            onValueChange={(value) => onChange("writingStyle", value)}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select writing style" />
            </SelectTrigger>
            <SelectContent>
              {WRITING_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Faith or Values Integration</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="faithValues"
              checked={data.faithValuesIntegration || false}
              onCheckedChange={(checked) =>
                onChange("faithValuesIntegration", !!checked)
              }
            />
            <Label htmlFor="faithValues" className="font-normal cursor-pointer">
              Include faith or values-based messaging
            </Label>
          </div>
          {data.faithValuesIntegration && (
            <Textarea
              value={data.faithValuesDetails || ""}
              onChange={(e) => onChange("faithValuesDetails", e.target.value)}
              placeholder="Describe how faith or values should be integrated..."
              rows={3}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="wordsToAvoid">Words to Avoid</Label>
            <HelpTooltip content="Compliance and brand guardrails. List words or phrases to exclude from content." />
          </div>
          <Textarea
            id="wordsToAvoid"
            value={data.wordsToAvoid || ""}
            onChange={(e) => onChange("wordsToAvoid", e.target.value)}
            placeholder="e.g., guaranteed, cheap, free, etc."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="commonPhrases">Common Phrases / Taglines</Label>
            <HelpTooltip content='Recurring phrases like "Aligned, not hustled" that reinforce brand identity.' />
          </div>
          <Textarea
            id="commonPhrases"
            value={data.commonPhrases || ""}
            onChange={(e) => onChange("commonPhrases", e.target.value)}
            placeholder="Enter common phrases (one per line)"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
