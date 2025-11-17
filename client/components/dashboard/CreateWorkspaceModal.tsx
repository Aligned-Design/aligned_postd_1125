import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INDUSTRY_OPTIONS = [
  "Events & Entertainment",
  "Beauty & Skincare",
  "Finance & Investment",
  "Technology",
  "E-commerce",
  "Healthcare",
  "Education",
  "Real Estate",
  "Fashion",
  "Food & Beverage",
  "Other",
];

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("🏢");
  const [industry, setIndustry] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Workspace name is required",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      createWorkspace({
        name: name.trim(),
        logo,
        industry: industry || undefined,
        timezone,
      });

      toast({
        title: "Workspace created",
        description: `"${name}" workspace is ready to use`,
      });

      setName("");
      setLogo("🏢");
      setIndustry("");
      setTimezone("America/New_York");

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workspace",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex items-center justify-between border-b border-indigo-700">
          <h2 className="text-2xl font-black">Create Workspace</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Help text */}
          <p className="text-sm text-slate-600 font-medium">
            Each workspace has its own Brand Guide, Library, Calendar, and Analytics.
          </p>

          {/* Workspace Name */}
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">
              Workspace Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ABD Events"
              className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Logo / Emoji */}
          <div>
            <label className="block text-sm font-black text-slate-900 mb-3">
              Logo (Emoji)
            </label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              {["🏢", "🎪", "✨", "📈", "🌟", "🚀", "💼", "🎯", "🔥", "⭐", "🎨", "🌈"].map(
                (emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleLogoChange(emoji)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      logo === emoji
                        ? "bg-indigo-600 scale-110 ring-2 ring-indigo-400"
                        : "hover:bg-slate-200"
                    }`}
                  >
                    {emoji}
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium mt-2">Selected: {logo}</p>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">Select an industry...</option>
              {INDUSTRY_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-black text-slate-900 mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
