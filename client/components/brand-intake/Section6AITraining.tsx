import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { BrandIntakeFormData } from "@/types/brand-intake";
import { FileText, Image, FolderArchive } from "lucide-react";

interface Section6Props {
  data: Partial<BrandIntakeFormData>;
  onChange: (field: keyof BrandIntakeFormData, value: unknown) => void;
  errors: Record<string, string>;
}

export default function Section6AITraining({
  data,
  onChange,
  errors: _errors,
}: Section6Props) {
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
        <h2 className="text-2xl font-bold mb-2">Brand Reference Materials</h2>
        <p className="text-muted-foreground">
          Upload reference materials to help Postd understand your brand voice and style
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="textReferences">Upload Text References</Label>
            <HelpTooltip content="Mission statements, brochures, PDFs that define your voice." />
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
            <Input
              id="textReferences"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              onChange={(e) =>
                handleFileChange("textReferenceFiles", e.target.files)
              }
              className="hidden"
            />
            <label
              htmlFor="textReferences"
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload documents (PDF, DOC, TXT)
              </p>
              {(data.textReferenceFiles || []).length > 0 && (
                <Badge variant="secondary">
                  {data.textReferenceFiles!.length} file(s) selected
                </Badge>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="visualReferences">Upload Visual References</Label>
            <HelpTooltip content="Images and videos showing your brand's visual style." />
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
            <Input
              id="visualReferences"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) =>
                handleFileChange("visualReferenceFiles", e.target.files)
              }
              className="hidden"
            />
            <label
              htmlFor="visualReferences"
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <Image className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload images or videos
              </p>
              {(data.visualReferenceFiles || []).length > 0 && (
                <Badge variant="secondary">
                  {data.visualReferenceFiles!.length} file(s) selected
                </Badge>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="previousContent">Upload Previous Content</Label>
            <HelpTooltip content="ZIP file or folder of past posts for tone embedding." />
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
            <Input
              id="previousContent"
              type="file"
              accept=".zip"
              onChange={(e) =>
                handleFileChange("previousContentFiles", e.target.files)
              }
              className="hidden"
            />
            <label
              htmlFor="previousContent"
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <FolderArchive className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload ZIP archive of previous content
              </p>
              {(data.previousContentFiles || []).length > 0 && (
                <Badge variant="secondary">
                  {data.previousContentFiles!.length} file(s) selected
                </Badge>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="aiNotes">AI Notes / Instructions</Label>
            <HelpTooltip content="Special context or instructions for The Copywriter to follow." />
          </div>
          <Textarea
            id="aiNotes"
            value={data.aiNotes || ""}
            onChange={(e) => onChange("aiNotes", e.target.value)}
            placeholder="e.g., Always include a call-to-action, avoid industry jargon, prefer short paragraphs..."
            rows={6}
          />
        </div>
      </div>
    </div>
  );
}
