import { X, Mail, Send } from "lucide-react";
import { useState } from "react";

interface EmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emails: string[]) => void;
  defaultRecipients?: string[];
  dateRangeLabel?: string;
}

export function EmailReportDialog({
  isOpen,
  onClose,
  onSend,
  defaultRecipients = [],
  dateRangeLabel,
}: EmailReportDialogProps) {
  const [recipients, setRecipients] = useState(defaultRecipients);
  const [newEmail, setNewEmail] = useState("");

  const handleAddEmail = () => {
    if (newEmail && !recipients.includes(newEmail)) {
      setRecipients([...recipients, newEmail]);
      setNewEmail("");
    }
  };

  const handleSend = () => {
    if (recipients.length > 0) {
      onSend(recipients);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Report
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipients Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Add Recipients
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                placeholder="email@example.com"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Recipients List */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sending to ({recipients.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recipients.length > 0 ? (
                recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <span className="text-sm font-medium text-slate-700">{email}</span>
                    <button
                      onClick={() => setRecipients(recipients.filter((e) => e !== email))}
                      className="text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recipients added</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600 font-medium">
              The analytics report {dateRangeLabel && `for ${dateRangeLabel}`} will be sent immediately to all recipients.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={recipients.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
