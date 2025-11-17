import { AlertTriangle, CreditCard, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PastDueBannerProps {
  daysPastDue: number;
  accountStatus: "past_due" | "archived";
  onDismiss?: () => void;
  dismissible?: boolean;
}

export function PastDueBanner({
  daysPastDue,
  accountStatus,
  onDismiss,
  dismissible = false,
}: PastDueBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleUpdatePayment = () => {
    navigate("/billing");
  };

  // Determine severity and messaging based on days past due
  const getSeverity = () => {
    if (accountStatus === "archived") return "critical";
    if (daysPastDue >= 14) return "critical";
    if (daysPastDue >= 7) return "warning";
    return "info";
  };

  const severity = getSeverity();

  const getMessage = () => {
    if (accountStatus === "archived") {
      return {
        title: "Your account has been archived",
        description:
          "We've safely stored your data for the next 90 days. Reactivate anytime to restore your settings and scheduled content.",
        daysUntilDeletion: 90 - daysPastDue,
      };
    }

    if (daysPastDue >= 14) {
      return {
        title: "Your Aligned AI account is now paused",
        description:
          "Publishing and approvals are disabled while we wait for payment. Update your billing info to restore full access instantly.",
        daysUntilArchive: 30 - daysPastDue,
      };
    }

    if (daysPastDue >= 7) {
      return {
        title: "⚠️ Action required to keep your content live",
        description: `Your account will pause in ${14 - daysPastDue} days if we can't process your payment. Update your card to avoid interruption.`,
      };
    }

    return {
      title: "Payment update needed",
      description:
        "Your recent payment didn't go through. Please update your payment method to avoid service interruption.",
    };
  };

  const message = getMessage();

  const bgColor =
    severity === "critical"
      ? "bg-red-50 border-red-300"
      : severity === "warning"
        ? "bg-orange-50 border-orange-300"
        : "bg-yellow-50 border-yellow-300";

  const iconColor =
    severity === "critical"
      ? "text-red-600"
      : severity === "warning"
        ? "text-orange-600"
        : "text-yellow-600";

  const textColor =
    severity === "critical"
      ? "text-red-900"
      : severity === "warning"
        ? "text-orange-900"
        : "text-yellow-900";

  return (
    <div
      className={`${bgColor} border-l-4 p-6 rounded-lg mb-6 shadow-md relative animate-in slide-in-from-top duration-300`}
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`absolute top-4 right-4 ${textColor} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-start gap-4 pr-8">
        <AlertTriangle className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-1`} />

        <div className="flex-1">
          <h3 className={`font-bold text-lg ${textColor} mb-2`}>
            {message.title}
          </h3>

          <p className={`${textColor} mb-4 leading-relaxed`}>
            {message.description}
          </p>

          {message.daysUntilArchive !== undefined &&
            message.daysUntilArchive > 0 && (
              <div className="bg-white/60 rounded-lg px-3 py-2 mb-4 inline-block">
                <p className="text-sm font-semibold text-slate-700">
                  Account pauses in: {message.daysUntilArchive} days
                </p>
              </div>
            )}

          {message.daysUntilDeletion !== undefined &&
            message.daysUntilDeletion > 0 && (
              <div className="bg-white/60 rounded-lg px-3 py-2 mb-4 inline-block">
                <p className="text-sm font-semibold text-slate-700">
                  Permanent deletion in: {message.daysUntilDeletion} days
                </p>
              </div>
            )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUpdatePayment}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CreditCard className="w-4 h-4" />
              Update Payment Method
            </Button>

            {accountStatus === "archived" && (
              <Button
                variant="outline"
                onClick={() => navigate("/billing")}
                className="gap-2"
              >
                Reactivate Account
              </Button>
            )}
          </div>

          {accountStatus === "past_due" && daysPastDue >= 14 && (
            <p className="text-sm mt-4 text-slate-600">
              <strong>Current restrictions:</strong> Publishing disabled,
              approvals disabled. Your dashboard and analytics remain viewable
              (read-only).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
