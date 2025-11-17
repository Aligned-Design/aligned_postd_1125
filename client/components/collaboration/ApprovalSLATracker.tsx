import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface ChangeLogEntry {
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

interface ApprovalSLATrackerProps {
  contentId: string;
  submittedAt: string;
  slaHours: number;
  status: "pending" | "approved" | "rejected" | "auto_approved";
  changeLog?: ChangeLogEntry[];
  versionNumber?: number;
  onAutoApprove?: () => void;
  className?: string;
}

export function ApprovalSLATracker({
  contentId,
  submittedAt,
  slaHours = 24,
  status,
  changeLog = [],
  versionNumber = 1,
  onAutoApprove,
  className,
}: ApprovalSLATrackerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showChangeLog, setShowChangeLog] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const submitted = new Date(submittedAt).getTime();
      const deadline = submitted + slaHours * 60 * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [submittedAt, slaHours]);

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getUrgencyLevel = (): "normal" | "warning" | "critical" => {
    const percentRemaining =
      (timeRemaining / (slaHours * 60 * 60 * 1000)) * 100;

    if (percentRemaining === 0) return "critical";
    if (percentRemaining < 25) return "warning";
    return "normal";
  };

  const urgency = getUrgencyLevel();

  if (status !== "pending") {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-bold text-green-900">
                {status === "approved"
                  ? "Approved"
                  : status === "rejected"
                    ? "Changes Requested"
                    : "Auto-Approved"}
              </p>
              <p className="text-sm text-green-700">
                {status === "approved" &&
                  "This content has been approved and is ready to publish"}
                {status === "rejected" &&
                  "Agency is working on the requested changes"}
                {status === "auto_approved" &&
                  "Automatically approved due to SLA deadline"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* SLA Timer */}
      <Card
        className={cn(
          "border-2",
          urgency === "critical" && "border-red-500 bg-red-50",
          urgency === "warning" && "border-amber-500 bg-amber-50",
          urgency === "normal" && "border-blue-200 bg-blue-50",
        )}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  urgency === "critical" && "bg-red-100",
                  urgency === "warning" && "bg-amber-100",
                  urgency === "normal" && "bg-blue-100",
                )}
              >
                {urgency === "critical" ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "font-bold",
                    urgency === "critical" && "text-red-900",
                    urgency === "warning" && "text-amber-900",
                    urgency === "normal" && "text-blue-900",
                  )}
                >
                  {timeRemaining === 0 ? "SLA Expired" : "Time to Approve"}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    urgency === "critical" && "text-red-700",
                    urgency === "warning" && "text-amber-700",
                    urgency === "normal" && "text-blue-700",
                  )}
                >
                  {timeRemaining === 0
                    ? "Approval deadline has passed"
                    : `${formatTimeRemaining(timeRemaining)} remaining`}
                </p>
              </div>
            </div>

            {timeRemaining === 0 && onAutoApprove && (
              <Button
                onClick={onAutoApprove}
                className="gap-2"
                variant="destructive"
              >
                <CheckCircle className="h-4 w-4" />
                Auto-Approve Now
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  urgency === "critical" && "bg-red-600",
                  urgency === "warning" && "bg-amber-600",
                  urgency === "normal" && "bg-blue-600",
                )}
                style={{
                  width: `${Math.max(0, Math.min(100, (timeRemaining / (slaHours * 60 * 60 * 1000)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Alert */}
      {urgency === "warning" && (
        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Less than 6 hours remaining.</strong> If no action is taken,
            this content will be auto-approved to maintain publishing schedule.
          </AlertDescription>
        </Alert>
      )}

      {urgency === "critical" && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>SLA deadline reached.</strong> Your agency may auto-approve
            this content to stay on schedule. Review now to provide feedback.
          </AlertDescription>
        </Alert>
      )}

      {/* Version History */}
      {changeLog.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <button
              onClick={() => setShowChangeLog(!showChangeLog)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-600" />
                <span className="font-bold text-slate-900">
                  Version {versionNumber} - Change Log
                </span>
                <Badge variant="outline" className="text-xs">
                  {changeLog.length}{" "}
                  {changeLog.length === 1 ? "change" : "changes"}
                </Badge>
              </div>
              {showChangeLog ? (
                <ChevronUp className="h-4 w-4 text-slate-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-600" />
              )}
            </button>

            {showChangeLog && (
              <div className="mt-4 space-y-3">
                {changeLog.map((entry, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600 mt-1.5" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 mb-1">
                        {entry.field}
                      </p>
                      <div className="bg-slate-100 rounded-lg p-2 mb-1">
                        <span className="text-slate-600 line-through">
                          {entry.oldValue}
                        </span>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <span className="text-green-900">{entry.newValue}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Approval SLA: {slaHours} hours
              </h4>
              <p className="text-slate-700 text-sm">
                Please review within {slaHours} hours to provide feedback. After
                the deadline, your agency may auto-approve to maintain
                publishing schedule.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
