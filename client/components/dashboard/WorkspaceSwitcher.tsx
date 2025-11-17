import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ChevronDown, Plus } from "lucide-react";

interface WorkspaceSwitcherProps {
  onCreateClick: () => void;
}

export function WorkspaceSwitcher({ onCreateClick }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspaceId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors duration-200 group"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg flex-shrink-0">{currentWorkspace.logo || "🏢"}</span>
          <div className="text-left">
            <p className="text-xs font-black text-white leading-tight">
              {currentWorkspace.name}
            </p>
            <p className="text-xs text-white/60 font-medium">Workspace</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-40 overflow-hidden">
            {/* Workspaces List */}
            <div className="max-h-64 overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspaceId(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-200 border-b border-slate-100 last:border-b-0 ${
                    ws.id === currentWorkspace.id
                      ? "bg-indigo-50 text-indigo-900"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{ws.logo || "🏢"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {ws.name}
                    </p>
                    {ws.industry && (
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {ws.industry}
                      </p>
                    )}
                  </div>
                  {ws.id === currentWorkspace.id && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Create New Workspace */}
            <button
              onClick={() => {
                onCreateClick();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-lime-50 text-lime-700 transition-colors duration-200 font-bold"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Create Workspace</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
