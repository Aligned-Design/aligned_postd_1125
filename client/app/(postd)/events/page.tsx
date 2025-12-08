import { useWorkspace } from "@/contexts/WorkspaceContext";
import { EventCard } from "@/components/dashboard/EventCard";
import { EventEditorModal } from "@/components/dashboard/EventEditorModal";
import { EventInsightsPanel } from "@/components/dashboard/EventInsightsPanel";
import { EventTypeSelector } from "@/components/dashboard/EventTypeSelector";
import { EventCreationMode } from "@/components/dashboard/EventCreationMode";
import { EventConfirmationModal } from "@/components/dashboard/EventConfirmationModal";
import { EventAIForm } from "@/components/dashboard/EventAIForm";
import { Event, EventQuickStats, EventStatus, EventType } from "@/types/event";
import { generateCompleteEvent } from "@/lib/generateEventContent";
import {
  Plus,
  Calendar,
  MapPin,
  Zap,
  AlertCircle,
  ListTodo,
  Grid3x3,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { logError } from "@/lib/logger";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";

export default function Events() {
  const { currentWorkspace } = useWorkspace();
  // Event CRUD state
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "all">("all");
  const [filterPlatform, setFilterPlatform] = useState<string | "all">("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // New event creation flow state
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [showCreationMode, setShowCreationMode] = useState(false);
  const [selectedCreationMode, setSelectedCreationMode] = useState<"ai" | "manual" | null>(null);
  const [showAIForm, setShowAIForm] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedEvent, setGeneratedEvent] = useState<Event | null>(null);

  // ✅ FIX: Real events data - no mock data
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // ✅ FIX: Fetch real events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);

        const response = await fetch("/api/events");

        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        } else if (response.status === 404) {
          // API endpoint not implemented yet
          setEvents([]);
          setEventsError("Events feature is coming soon. The API endpoint is not yet implemented.");
        } else {
          throw new Error(`Failed to load events: ${response.statusText}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load events";
        logError("[Events] Failed to load events", err instanceof Error ? err : new Error(String(err)));
        setEventsError(errorMessage);
        setEvents([]); // Show empty state instead of mock data
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Helper: Get default placeholder SVG for events without images
  const getEventPlaceholderSvg = () => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="300" fill="#f1f5f9"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">No Event Image</text>
      </svg>
    `)}`;
  };

  // Calculate stats
  const stats: EventQuickStats = useMemo(() => {
    const upcoming = events.filter((e) => new Date(e.startDate) > new Date());
    const allPlatforms = new Set(events.flatMap((e) => e.platforms.map((p) => p.platform)));
    const failedSyncs = events.filter((e) =>
      e.platforms.some((p) => p.syncStatus === "failed")
    ).length;
    const totalPromotions = events.reduce((sum, e) => sum + (e.promotionSchedule?.length || 0), 0);

    return {
      upcomingCount: upcoming.length,
      connectedPlatforms: allPlatforms.size,
      scheduledPromotions: totalPromotions,
      failedSyncs,
    };
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const statusMatch = filterStatus === "all" || event.status === filterStatus;
      const platformMatch =
        filterPlatform === "all" ||
        event.platforms.some((p) => p.platform === filterPlatform);
      return statusMatch && platformMatch;
    });
  }, [events, filterStatus, filterPlatform]);

  // Traditional "Add Event" flow
  const handleAddEvent = () => {
    setShowTypeSelector(true);
  };

  // Event type selection
  const handleSelectEventType = (type: EventType) => {
    setSelectedEventType(type);
    setShowTypeSelector(false);
    setShowCreationMode(true);
  };

  // Creation mode selection
  const handleSelectCreationMode = (mode: "ai" | "manual") => {
    setSelectedCreationMode(mode);
    setShowCreationMode(false);

    if (mode === "ai") {
      setShowAIForm(true);
    } else {
      // Manual mode - open editor directly
      setSelectedEvent(undefined);
      setShowEventEditor(true);
      resetCreationFlow();
    }
  };

  // AI form submission
  const handleAIFormSubmit = async (data: {
    goal: string;
    targetAudience: string;
    startDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
  }) => {
    setIsGeneratingEvent(true);

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate complete event with AI content
    const generated = generateCompleteEvent({
      eventType: selectedEventType!,
      goal: data.goal,
      targetAudience: data.targetAudience,
      startDate: data.startDate,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      description: data.description,
      brand: "Postd",
    });

    const newEvent: Event = {
      id: Date.now().toString(),
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      ...generated,
    } as Event;

    setGeneratedEvent(newEvent);
    setShowAIForm(false);
    setShowConfirmation(true);
    setIsGeneratingEvent(false);
  };

  // Confirmation handlers
  const handleGenerateCampaign = () => {
    if (generatedEvent) {
      setEvents([...events, generatedEvent]);
      setShowConfirmation(false);
      resetCreationFlow();
      // TODO: Redirect to Campaigns page with pre-filled data
    }
  };

  const handleLaunchManually = () => {
    if (generatedEvent) {
      setEvents([...events, generatedEvent]);
      setShowConfirmation(false);
      resetCreationFlow();
      // TODO: Open campaign creation form
    }
  };

  const handleSkipCampaign = () => {
    if (generatedEvent) {
      setEvents([...events, generatedEvent]);
      setShowConfirmation(false);
      resetCreationFlow();
    }
  };

  const resetCreationFlow = () => {
    setSelectedEventType(null);
    setSelectedCreationMode(null);
    setGeneratedEvent(null);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventEditor(true);
  };

  const handleSaveEvent = (event: Event) => {
    if (selectedEvent) {
      setEvents(events.map((e) => (e.id === event.id ? event : e)));
    } else {
      setEvents([...events, event]);
    }
    setShowEventEditor(false);
    setSelectedEvent(undefined);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
    setShowDeleteConfirm(null);
  };

  const handlePromoteEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventEditor(true);
  };

  return (
    <PageShell>
      <PageHeader
        title="Events"
        subtitle={`${currentWorkspace?.logo || ""} ${currentWorkspace?.name || ""} — Manage business events, sync across platforms, and amplify reach with AI promotions.`}
        actions={
          <button
            onClick={handleAddEvent}
            className="flex items-center gap-2 px-4 py-2.5 bg-lime-400 text-indigo-950 rounded-lg hover:bg-lime-500 transition-colors font-bold text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        }
      />
      
      {/* Loading State */}
      {eventsLoading && (
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/60">
          <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-black text-slate-900 mb-2">Loading events...</h3>
        </div>
      )}

      {/* Error State */}
      {!eventsLoading && eventsError && events.length === 0 && (
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/60">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 mb-2">Unable to load events</h3>
          <p className="text-slate-600 font-medium mb-6">{eventsError}</p>
        </div>
      )}

      {/* Empty State */}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/60">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 mb-2">No events yet</h3>
          <p className="text-slate-600 font-medium mb-6">
            Create your first event to get started with event management and promotion.
          </p>
          <button
            onClick={handleAddEvent}
            className="inline-flex items-center gap-2 px-6 py-3 bg-lime-400 text-indigo-950 rounded-lg hover:bg-lime-500 transition-colors font-bold"
          >
            <Plus className="w-5 h-5" />
            Create Your First Event
          </button>
        </div>
      )}

      {/* Content - only show if not loading and no error */}
      {!eventsLoading && !eventsError && events.length > 0 && (
        <>
      {/* Zone 1: Strategic Overview */}
      <div className="mb-12">

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 border border-white/60 hover:bg-white/70 transition-all">
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Upcoming</p>
                <p className="text-2xl font-black text-indigo-600">{stats.upcomingCount}</p>
              </div>
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 border border-white/60 hover:bg-white/70 transition-all">
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Connected</p>
                <p className="text-2xl font-black text-lime-600">{stats.connectedPlatforms}/3</p>
              </div>
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 border border-white/60 hover:bg-white/70 transition-all">
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Promotions</p>
                <p className="text-2xl font-black text-blue-600">{stats.scheduledPromotions}</p>
              </div>
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 border border-white/60 hover:bg-white/70 transition-all">
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Issues</p>
                <p className="text-2xl font-black text-red-600">{stats.failedSyncs}</p>
              </div>
            </div>
          </div>

          {/* Zone 2: Operational Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Main content area */}
            <div className="lg:col-span-2">
              {/* Filters and view toggle */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-indigo-600 text-white"
                        : "bg-white/50 text-slate-600 hover:bg-white/70 border border-white/60"
                    }`}
                  >
                    <ListTodo className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "calendar"
                        ? "bg-indigo-600 text-white"
                        : "bg-white/50 text-slate-600 hover:bg-white/70 border border-white/60"
                    }`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 flex-1">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "all" || ["draft", "scheduled", "published", "live", "completed", "cancelled"].includes(value)) {
                        setFilterStatus(value as EventStatus | "all");
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Platforms</option>
                    <option value="facebook">Facebook</option>
                    <option value="google_business">Google Business</option>
                    <option value="squarespace">Squarespace</option>
                  </select>
                </div>
              </div>

              {/* Events list/calendar view */}
              {viewMode === "list" ? (
                <div className="space-y-4">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, idx) => (
                      <div
                        key={event.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <EventCard
                          event={event}
                          onEdit={handleEditEvent}
                          onDelete={() => setShowDeleteConfirm(event.id)}
                          onPromote={handlePromoteEvent}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-white/60 text-center">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 font-medium mb-2">No events found</p>
                      <p className="text-xs text-slate-500">
                        Create your first event to get started
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-white/60 text-center">
                  <Grid3x3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">Calendar view coming soon</p>
                  <p className="text-xs text-slate-500">
                    Currently showing list view. Calendar view will be available soon.
                  </p>
                </div>
              )}
            </div>

            {/* Zone 3: AI Insights Panel */}
            <div className="h-fit sticky top-20">
              <div className="bg-white/50 backdrop-blur-xl rounded-xl p-5 border border-white/60">
                <EventInsightsPanel
                  events={events}
                  stats={stats}
                  onPromoteClick={(action) => {
                    // TODO: Implement promote action
                  }}
                />
              </div>
            </div>
          </div>

      {/* Event Editor Modal */}
      <EventEditorModal
        event={selectedEvent}
        isOpen={showEventEditor}
        onClose={() => {
          setShowEventEditor(false);
          setSelectedEvent(undefined);
        }}
        onSave={handleSaveEvent}
        campaigns={[]}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <p className="text-lg font-black text-slate-900 mb-4">Delete Event?</p>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Event Creation Flow Modals */}
      <EventTypeSelector
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelectType={handleSelectEventType}
      />

      <EventCreationMode
        isOpen={showCreationMode}
        eventType={selectedEventType}
        onClose={() => setShowCreationMode(false)}
        onSelectMode={handleSelectCreationMode}
      />

      {/* AI Form Modal */}
      {showAIForm && selectedEventType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-lime-50 to-green-50 p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Create Event with AI</h2>
              <button
                onClick={() => {
                  setShowAIForm(false);
                  resetCreationFlow();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-8">
              <EventAIForm
                eventType={selectedEventType}
                onSubmit={handleAIFormSubmit}
                onCancel={() => {
                  setShowAIForm(false);
                  resetCreationFlow();
                }}
                isLoading={isGeneratingEvent}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <EventConfirmationModal
        isOpen={showConfirmation}
        event={generatedEvent}
        onClose={() => {
          setShowConfirmation(false);
          resetCreationFlow();
        }}
        onGenerateCampaign={handleGenerateCampaign}
        onLaunchManually={handleLaunchManually}
        onSkip={handleSkipCampaign}
      />
        </>
      )}
    </PageShell>
  );
}
