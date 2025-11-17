import {
  AlertCircle,
  Clock,
  Edit3,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/design-system";

interface StatusCard {
  id: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  priority?: boolean;
  urgent?: boolean;
}

interface StatusOverviewBannerProps {
  onStatusClick?: (statusId: string) => void;
  navigateToQueue?: boolean;
}

export function StatusOverviewBanner({
  onStatusClick,
  navigateToQueue = false,
}: StatusOverviewBannerProps) {
  const navigate = useNavigate();
  const statuses: StatusCard[] = [
    {
      id: "reviewing",
      label: "Pending Approvals",
      count: 4,
      icon: <Clock className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50/50",
      borderColor: "border-orange-200/60",
      priority: true,
    },
    {
      id: "scheduled",
      label: "Scheduled",
      count: 2,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50/50",
      borderColor: "border-blue-200/60",
    },
    {
      id: "draft",
      label: "Drafts",
      count: 2,
      icon: <Edit3 className="w-5 h-5" />,
      color: "text-slate-600",
      bgColor: "bg-slate-50/50",
      borderColor: "border-slate-200/60",
    },
    {
      id: "errored",
      label: "Errored",
      count: 1,
      icon: <AlertCircle className="w-5 h-5" />,
      color: "text-red-600",
      bgColor: "bg-red-50/50",
      borderColor: "border-red-200/60",
      urgent: true,
    },
    {
      id: "published",
      label: "Published",
      count: 2,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50/50",
      borderColor: "border-green-200/60",
    },
  ];

  const handleClick = (statusId: string) => {
    if (navigateToQueue) {
      // Navigate to content queue with status filter
      navigate(`/queue?status=${statusId}`);
    } else {
      // Original behavior: scroll to section
      if (onStatusClick) {
        onStatusClick(statusId);
      }
      const element = document.getElementById(`status-${statusId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() => handleClick(status.id)}
          role="button"
          aria-label={`View ${status.label} (${status.count} items)`}
          className={cn(
            "group relative rounded-lg transition-all duration-300 border cursor-pointer",
            "min-h-[88px] p-4 sm:p-5",
            "hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
            status.bgColor,
            status.borderColor,
            "hover:border-current"
          )}
        >
          {/* Priority/Urgent badge */}
          {status.priority && (
            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-black">
              Priority
            </div>
          )}
          {status.urgent && (
            <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-black animate-pulse">
              Urgent
            </div>
          )}

          {/* Content */}
          <div className="flex items-start gap-2 mb-2">
            <div
              className={`flex-shrink-0 ${status.color} group-hover:scale-110 transition-transform duration-300`}
            >
              {status.icon}
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                {status.label}
              </p>
            </div>
          </div>

          {/* Count */}
          <div className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
            {status.count}
          </div>

          {/* Click hint */}
          <p className="text-xs text-slate-500 font-medium group-hover:text-slate-700 transition-colors">
            Click to view →
          </p>
        </button>
      ))}
    </div>
  );
}
