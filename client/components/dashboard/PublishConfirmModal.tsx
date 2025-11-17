import { AlertCircle, X } from "lucide-react";

interface PublishConfirmModalProps {
  designName: string;
  platforms: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmModal({
  designName,
  platforms,
  onConfirm,
  onCancel,
}: PublishConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-rose-700" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Publish Now</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4">
          You're about to publish <span className="font-bold">{designName}</span> immediately, bypassing any scheduled time. This action cannot be undone.
        </p>

        {/* Platforms */}
        {platforms.length > 0 && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-bold text-slate-600 mb-2">Platforms:</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation Checkbox */}
        <label className="flex items-center gap-2 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer hover:bg-rose-100 transition-colors">
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-rose-700"
            defaultChecked={false}
          />
          <span className="text-sm font-semibold text-slate-700">
            I understand this will publish immediately
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-all"
          >
            Publish Now
          </button>
        </div>
      </div>
    </div>
  );
}
