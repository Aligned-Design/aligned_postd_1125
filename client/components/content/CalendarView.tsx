import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system";
import type { CalendarEvent, CalendarFilter, PostModel } from "@shared/api";

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventMove: (eventId: string, newDate: string) => Promise<void>;
  onEventClick: (event: CalendarEvent) => void;
  filter: CalendarFilter;
  onFilterChange: (filter: CalendarFilter) => void;
}

export function CalendarView({
  events,
  onEventMove,
  onEventClick,
  filter,
  onFilterChange,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const statusColors = {
    draft: "bg-gray-200 text-gray-800",
    review: "bg-yellow-200 text-yellow-800",
    approved: "bg-green-200 text-green-800",
    scheduled: "bg-blue-200 text-blue-800",
    published: "bg-purple-200 text-purple-800",
    failed: "bg-red-200 text-red-800",
  };

  const platformIcons = {
    instagram: "📷",
    facebook: "📘",
    twitter: "🐦",
    linkedin: "💼",
    tiktok: "🎵",
  };

  const getDaysInView = () => {
    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
      });
    } else {
      // Month view logic
      const __startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );

      const days = [];
      for (let i = 1; i <= endOfMonth.getDate(); i++) {
        days.push(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
        );
      }
      return days;
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.scheduledAt.startsWith(dateStr));
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDrop = async (date: Date) => {
    if (!draggedEvent) return;

    const newDateTime = new Date(date);
    newDateTime.setHours(new Date(draggedEvent.scheduledAt).getHours());
    newDateTime.setMinutes(new Date(draggedEvent.scheduledAt).getMinutes());

    await onEventMove(draggedEvent.id, newDateTime.toISOString());
    setDraggedEvent(null);
  };

  const __filteredEvents = events.filter((event) => {
    const matchesBrand =
      !filter.brands?.length || filter.brands.includes(event.brandId);
    const matchesPlatform =
      !filter.platforms?.length || filter.platforms.includes(event.platform);
    const matchesStatus =
      !filter.statuses?.length || filter.statuses.includes(event.status);

    return matchesBrand && matchesPlatform && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() - 1)),
              )
            }
          >
            ←
          </Button>

          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>

          <Button
            variant="outline"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() + 1)),
              )
            }
          >
            →
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium">Filters:</span>

        {/* Platform Filter */}
        <select
          multiple
          value={filter.platforms || []}
          onChange={(e) => {
            const platforms = Array.from(
              e.target.selectedOptions,
              (option) => option.value,
            ) as PostModel["platform"][];
            onFilterChange({ ...filter, platforms });
          }}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="twitter">Twitter</option>
          <option value="linkedin">LinkedIn</option>
          <option value="tiktok">TikTok</option>
        </select>

        {/* Status Filter */}
        <select
          multiple
          value={filter.statuses || []}
          onChange={(e) => {
            const statuses = Array.from(
              e.target.selectedOptions,
              (option) => option.value,
            ) as PostModel["status"][];
            onFilterChange({ ...filter, statuses });
          }}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Calendar Grid */}
      <div
        className={cn(
          "grid gap-1",
          viewMode === "week" ? "grid-cols-7" : "grid-cols-7",
        )}
      >
        {/* Day Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center font-medium bg-gray-100">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {getDaysInView().map((date, index) => {
          const dayEvents = getEventsForDate(date);

          return (
            <div
              key={index}
              className="min-h-32 p-2 border border-gray-200 bg-white"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(date)}
            >
              <div className="text-sm font-medium mb-2">{date.getDate()}</div>

              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={() => handleDragStart(event)}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      "p-1 rounded text-xs cursor-pointer hover:opacity-80",
                      statusColors[event.status],
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>{platformIcons[event.platform]}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
