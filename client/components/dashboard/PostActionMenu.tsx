import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Trash2,
  Copy,
  Clock,
  Tag,
  Users,
  Folder,
  Share2,
} from "lucide-react";

interface PostActionMenuProps {
  postId: string;
  status: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSchedule?: () => void;
  onChangeStatus?: () => void;
  onAssign?: () => void;
  onMoveCampaign?: () => void;
  onShare?: () => void;
}

export function PostActionMenu({
  postId,
  status,
  onDelete,
  onDuplicate,
  onSchedule,
  onChangeStatus,
  onAssign,
  onMoveCampaign,
  onShare,
}: PostActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: (() => void) | undefined, isDisabled: boolean) => {
    if (isDisabled) return;
    action?.();
    setIsOpen(false);
  };

  // Check if an action is effectively disabled (no handler or empty handler)
  const isActionDisabled = (action: (() => void) | undefined): boolean => {
    return !action;
  };

  const menuItems = [
    {
      icon: Clock,
      label: "Schedule for Later",
      action: onSchedule,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50",
      disabled: isActionDisabled(onSchedule),
    },
    {
      icon: Tag,
      label: "Change Status",
      action: onChangeStatus,
      color: "text-purple-600",
      bgColor: "hover:bg-purple-50",
      disabled: isActionDisabled(onChangeStatus),
    },
    {
      icon: Users,
      label: "Assign",
      action: onAssign,
      color: "text-indigo-600",
      bgColor: "hover:bg-indigo-50",
      disabled: isActionDisabled(onAssign),
    },
    {
      icon: Folder,
      label: "Move to Campaign",
      action: onMoveCampaign,
      color: "text-slate-600",
      bgColor: "hover:bg-slate-50",
      disabled: isActionDisabled(onMoveCampaign),
    },
    {
      icon: Copy,
      label: "Duplicate",
      action: onDuplicate,
      color: "text-green-600",
      bgColor: "hover:bg-green-50",
      disabled: isActionDisabled(onDuplicate),
    },
    {
      icon: Share2,
      label: "Share",
      action: onShare,
      color: "text-cyan-600",
      bgColor: "hover:bg-cyan-50",
      disabled: isActionDisabled(onShare),
    },
    {
      icon: Trash2,
      label: "Delete/Archive",
      action: onDelete,
      color: "text-red-600",
      bgColor: "hover:bg-red-50",
      isDanger: true,
      disabled: isActionDisabled(onDelete),
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600 hover:text-indigo-700"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg bg-white/95 backdrop-blur-xl border border-indigo-200/60 shadow-lg z-50 animate-[slideDown_150ms_ease-out]">
          <div className="p-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleAction(item.action, item.disabled)}
                  disabled={item.disabled}
                  title={item.disabled ? "Coming soon" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    item.disabled
                      ? "text-slate-400 cursor-not-allowed opacity-60"
                      : item.isDanger
                        ? `${item.color} ${item.bgColor} border-b border-indigo-100/50 mt-1 pt-3`
                        : `${item.color} ${item.bgColor}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.disabled && (
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
