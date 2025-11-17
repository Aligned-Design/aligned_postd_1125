import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Settings,
  RefreshCw,
  Clock,
  Zap,
  PauseCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/design-system";

type RefreshMode = "daily" | "hourly" | "manual";

interface SmartRefreshSettingsProps {
  onRefresh?: () => void;
  className?: string;
}

export function SmartRefreshSettings({
  onRefresh,
  className,
}: SmartRefreshSettingsProps) {
  const [refreshMode, setRefreshMode] = useState<RefreshMode>("daily");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Calculate next update time
    if (refreshMode === "daily") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setNextUpdate(tomorrow);
    } else if (refreshMode === "hourly") {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      setNextUpdate(nextHour);
    } else {
      setNextUpdate(null);
    }
  }, [refreshMode, lastUpdated]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);

    // Call parent refresh handler if provided
    if (onRefresh) {
      await onRefresh();
    } else {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setLastUpdated(new Date());
    setIsRefreshing(false);

    // Track analytics
    if (window.posthog) {
      window.posthog.capture("analytics_refreshed", { mode: "manual" });
    }
  };

  const handleModeChange = (mode: RefreshMode) => {
    setRefreshMode(mode);

    // Save preference to localStorage
    localStorage.setItem("analytics_refresh_mode", mode);

    // Track analytics
    if (window.posthog) {
      window.posthog.capture("refresh_mode_changed", { mode });
    }
  };

  const getTimeSinceUpdate = () => {
    const minutes = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const getTimeUntilUpdate = () => {
    if (!nextUpdate) return null;

    const minutes = Math.floor((nextUpdate.getTime() - Date.now()) / 60000);

    if (minutes < 60) return `in ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `in ${hours} hour${hours > 1 ? "s" : ""}`;

    return "tomorrow at 9:00 AM";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Refresh Settings
          </CardTitle>

          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Updated {getTimeSinceUpdate()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Refresh Mode Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            How often should we update your analytics?
          </Label>

          <RadioGroup value={refreshMode} onValueChange={handleModeChange}>
            <div className="space-y-3">
              {/* Daily Digest */}
              <div
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                  refreshMode === "daily"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
                onClick={() => handleModeChange("daily")}
              >
                <RadioGroupItem value="daily" id="daily" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label
                      htmlFor="daily"
                      className="font-bold text-slate-900 cursor-pointer"
                    >
                      Daily Digest
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Updates once per day at 9:00 AM. Reduces anxiety and
                    encourages strategic thinking.
                  </p>
                  {refreshMode === "daily" && nextUpdate && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-indigo-700">
                      <Clock className="h-3 w-3" />
                      Next update {getTimeUntilUpdate()}
                    </div>
                  )}
                </div>
                {refreshMode === "daily" && (
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                )}
              </div>

              {/* Hourly Refresh */}
              <div
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                  refreshMode === "hourly"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
                onClick={() => handleModeChange("hourly")}
              >
                <RadioGroupItem value="hourly" id="hourly" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="hourly"
                    className="font-bold text-slate-900 cursor-pointer block mb-1"
                  >
                    Hourly Refresh
                  </Label>
                  <p className="text-sm text-slate-600">
                    Updates every hour for power users who need frequent data.
                  </p>
                  {refreshMode === "hourly" && nextUpdate && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-indigo-700">
                      <Zap className="h-3 w-3" />
                      Next update {getTimeUntilUpdate()}
                    </div>
                  )}
                </div>
                {refreshMode === "hourly" && (
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                )}
              </div>

              {/* Manual Only */}
              <div
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                  refreshMode === "manual"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
                onClick={() => handleModeChange("manual")}
              >
                <RadioGroupItem value="manual" id="manual" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="manual"
                    className="font-bold text-slate-900 cursor-pointer block mb-1"
                  >
                    Manual Only
                  </Label>
                  <p className="text-sm text-slate-600">
                    You control when to see new data. Maximum control, zero
                    distraction.
                  </p>
                </div>
                {refreshMode === "manual" && (
                  <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Manual Refresh Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="w-full gap-2"
            variant={refreshMode === "manual" ? "default" : "outline"}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Refreshing data...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Now
              </>
            )}
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <PauseCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 text-sm mb-1">
                  Why limit refresh frequency?
                </h4>
                <p className="text-blue-800 text-sm">
                  Constant updates can create anxiety and encourage reactive
                  behavior. Batched updates help you think strategically and
                  make better decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
