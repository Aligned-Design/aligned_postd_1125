/**
 * SchedulingPreferences Component
 * 
 * Allows users to configure preferred posting days and time windows.
 * This is a preference system (suggestions only), not a blocking system.
 */

import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { cn } from "@/lib/design-system";

const DAYS_OF_WEEK = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
] as const;

type DayId = typeof DAYS_OF_WEEK[number]["id"];

interface TimeWindow {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

interface PreferredPostingSchedule {
  preferredDays: DayId[];
  preferredWindows: {
    [day: string]: TimeWindow[];
  };
}

interface SchedulingPreferencesProps {
  brandId?: string;
}

export function SchedulingPreferences({ brandId: propBrandId }: SchedulingPreferencesProps) {
  const { brandId: contextBrandId } = useCurrentBrand();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [schedule, setSchedule] = useState<PreferredPostingSchedule>({
    preferredDays: [],
    preferredWindows: {},
  });

  // Use prop brandId if provided, otherwise use current brand from context
  const activeBrandId = propBrandId || contextBrandId;

  // Load existing preferences
  useEffect(() => {
    if (!activeBrandId) return;

    // Validate brandId is a valid UUID before making the request
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeBrandId)) {
      console.warn("[SchedulingPreferences] Invalid brandId, skipping fetch:", activeBrandId);
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/brands/${activeBrandId}/posting-schedule`);
        if (response.ok) {
          const data = await response.json();
          if (data.schedule) {
            setSchedule(data.schedule);
          }
        }
      } catch (error) {
        console.error("Failed to load scheduling preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [activeBrandId]);

  const toggleDay = (dayId: DayId) => {
    setSchedule((prev) => {
      const newDays = prev.preferredDays.includes(dayId)
        ? prev.preferredDays.filter((d) => d !== dayId)
        : [...prev.preferredDays, dayId];
      
      // Remove windows for unselected days
      const newWindows = { ...prev.preferredWindows };
      if (!newDays.includes(dayId)) {
        delete newWindows[dayId];
      }

      return {
        preferredDays: newDays,
        preferredWindows: newWindows,
      };
    });
  };

  const addTimeWindow = (dayId: DayId) => {
    setSchedule((prev) => ({
      ...prev,
      preferredWindows: {
        ...prev.preferredWindows,
        [dayId]: [
          ...(prev.preferredWindows[dayId] || []),
          { start: "09:00", end: "17:00" },
        ],
      },
    }));
  };

  const removeTimeWindow = (dayId: DayId, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      preferredWindows: {
        ...prev.preferredWindows,
        [dayId]: (prev.preferredWindows[dayId] || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updateTimeWindow = (dayId: DayId, index: number, field: "start" | "end", value: string) => {
    setSchedule((prev) => {
      const windows = [...(prev.preferredWindows[dayId] || [])];
      windows[index] = { ...windows[index], [field]: value };
      return {
        ...prev,
        preferredWindows: {
          ...prev.preferredWindows,
          [dayId]: windows,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!activeBrandId) {
      toast({
        title: "Error",
        description: "Brand ID is required",
        variant: "destructive",
      });
      return;
    }

    // Validate brandId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeBrandId)) {
      toast({
        title: "Error",
        description: "Invalid brand. Please select a valid brand.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/brands/${activeBrandId}/posting-schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to save preferences" }));
        throw new Error(error.message || "Failed to save");
      }

      toast({
        title: "Preferences Saved",
        description: "Your preferred posting schedule has been updated.",
      });
    } catch (error) {
      console.error("Failed to save scheduling preferences:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <CardTitle>Preferred Posting Schedule</CardTitle>
          </div>
          <CardDescription>
            Configure your preferred posting days and times. This is used for suggestions only—you can always schedule outside these preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preferred Days */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Preferred Posting Days</Label>
            <p className="text-sm text-slate-600 mb-4">
              Select the days when you prefer to post content. You can schedule on any day regardless of this setting.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.id}
                  className={cn(
                    "flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer",
                    schedule.preferredDays.includes(day.id)
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  onClick={() => toggleDay(day.id)}
                >
                  <Checkbox
                    checked={schedule.preferredDays.includes(day.id)}
                    onCheckedChange={() => toggleDay(day.id)}
                  />
                  <Label className="font-medium cursor-pointer">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Time Windows */}
          {schedule.preferredDays.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Preferred Posting Times</Label>
              <p className="text-sm text-slate-600 mb-4">
                Set time windows for each selected day. Leave empty to allow posting at any time on that day.
              </p>
              <div className="space-y-4">
                {schedule.preferredDays.map((dayId) => {
                  const day = DAYS_OF_WEEK.find((d) => d.id === dayId);
                  const windows = schedule.preferredWindows[dayId] || [];

                  return (
                    <div key={dayId} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="font-semibold">{day?.label}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeWindow(dayId)}
                          className="gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Time Window
                        </Button>
                      </div>

                      {windows.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">
                          No time restrictions—posting allowed at any time
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {windows.map((window, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <Input
                                  type="time"
                                  value={window.start}
                                  onChange={(e) => updateTimeWindow(dayId, index, "start", e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-slate-500">to</span>
                                <Input
                                  type="time"
                                  value={window.end}
                                  onChange={(e) => updateTimeWindow(dayId, index, "end", e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeWindow(dayId, index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> These preferences are used for suggestions only. You can always schedule content outside your preferred days and times. The AI Advisor may use this information to suggest optimal posting times.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

