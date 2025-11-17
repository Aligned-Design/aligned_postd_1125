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
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { BrandIntakeFormData, APPROVAL_WORKFLOWS } from "@/types/brand-intake";
import { X } from "lucide-react";
import { useState } from "react";

interface Section5Props {
  data: Partial<BrandIntakeFormData>;
  onChange: (field: keyof BrandIntakeFormData, value: unknown) => void;
  errors: Record<string, string>;
}

export default function Section5Operational({
  data,
  onChange,
  errors: _errors,
}: Section5Props) {
  const [newHandle, setNewHandle] = useState("");

  const addSocialHandle = () => {
    if (newHandle.trim()) {
      const handle = newHandle.trim().startsWith("@")
        ? newHandle.trim()
        : `@${newHandle.trim()}`;
      const current = data.socialHandles || [];
      onChange("socialHandles", [...current, handle]);
      setNewHandle("");
    }
  };

  const removeSocialHandle = (handle: string) => {
    const current = data.socialHandles || [];
    onChange(
      "socialHandles",
      current.filter((h) => h !== handle),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Operational & Compliance</h2>
        <p className="text-muted-foreground">
          Set up approval workflows and content guidelines
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="approvalWorkflow">Approval Workflow</Label>
            <HelpTooltip content="How content should be reviewed before publishing." />
          </div>
          <Select
            value={data.approvalWorkflow || ""}
            onValueChange={(value) => onChange("approvalWorkflow", value)}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_WORKFLOWS.map((workflow) => (
                <SelectItem key={workflow} value={workflow}>
                  {workflow}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="disclaimers">Required Disclaimers</Label>
            <HelpTooltip content='Legal text required on certain content, e.g., "No investment guarantees."' />
          </div>
          <Textarea
            id="disclaimers"
            value={data.requiredDisclaimers || ""}
            onChange={(e) => onChange("requiredDisclaimers", e.target.value)}
            placeholder="Enter required disclaimers..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="restrictions">Content Restrictions</Label>
            <HelpTooltip content="Legal, imagery, or brand limitations to enforce." />
          </div>
          <Textarea
            id="restrictions"
            value={data.contentRestrictions || ""}
            onChange={(e) => onChange("contentRestrictions", e.target.value)}
            placeholder="e.g., No medical claims, no competitor mentions..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="socialHandles">Social Handles</Label>
            <HelpTooltip content="Your social media handles for auto-tagging and mentions." />
          </div>
          <Input
            id="socialHandles"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSocialHandle();
              }
            }}
            placeholder="@yourbrand (press Enter to add)"
            className="min-h-[44px]"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {(data.socialHandles || []).map((handle) => (
              <Badge key={handle} variant="secondary" className="gap-1">
                {handle}
                <button
                  type="button"
                  onClick={() => removeSocialHandle(handle)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${handle}`}
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
