/**
 * White label settings component
 * Admin-only feature for customizing branding
 */

import { useCan } from "@/lib/auth";

interface WhiteLabelSettingsProps {
  className?: string;
}

export function WhiteLabelSettings({
  className = "",
}: WhiteLabelSettingsProps) {
  // Only admins can access white-label settings
  const canManageWhiteLabel = useCan("white_label:manage");

  if (!canManageWhiteLabel) {
    return (
      <div
        className={`p-6 bg-yellow-50 border border-yellow-200 rounded ${className}`}
      >
        <p className="text-yellow-800">
          White label settings are only available to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-4">White Label Settings</h3>

        <div className="space-y-4">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Company Logo
            </label>
            <div className="border-2 border-dashed rounded p-6 text-center">
              <p className="text-gray-500 text-sm">
                Drag and drop your logo here, or click to select
              </p>
            </div>
          </div>

          {/* Color scheme */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Brand Color
            </label>
            <input
              type="color"
              defaultValue="#8B5CF6"
              className="w-16 h-10 rounded border"
            />
          </div>

          {/* Company name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Company Name
            </label>
            <input
              type="text"
              placeholder="Your company name"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Support email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Support Email
            </label>
            <input
              type="email"
              placeholder="support@company.com"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhiteLabelSettings;
