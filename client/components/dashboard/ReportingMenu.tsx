import { FileText, Settings, Play, Mail, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ReportingMenuProps {
  onSettings?: () => void;
  onRun?: () => void;
  onEmail?: () => void;
  dateRangeLabel?: string;
}

export function ReportingMenu({ onSettings, onRun, onEmail, dateRangeLabel }: ReportingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void | undefined) => {
    action?.();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/50 border border-white/60 text-slate-700 hover:border-indigo-300/50 hover:bg-white/70 font-bold text-sm transition-all duration-200 group"
      >
        <FileText className="w-4 h-4" />
        Reporting
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 z-50 min-w-max overflow-hidden">
          {/* Settings */}
          <button
            onClick={() => handleAction(onSettings)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <div>
              <p className="font-bold text-sm">Settings</p>
              <p className="text-xs text-slate-500">Configure report format</p>
            </div>
          </button>

          {/* Run Report */}
          <button
            onClick={() => handleAction(onRun)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
          >
            <Play className="w-4 h-4 text-green-600" />
            <div>
              <p className="font-bold text-sm">Run Report</p>
              <p className="text-xs text-slate-500">Generate now</p>
            </div>
          </button>

          {/* Email Report */}
          <button
            onClick={() => handleAction(onEmail)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold text-sm">Email Report</p>
              <p className="text-xs text-slate-500">Send to recipients</p>
            </div>
          </button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
