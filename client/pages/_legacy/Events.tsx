// LEGACY PAGE (archived)
// This file is not routed or imported anywhere.
// Canonical implementation lives under client/app/(postd)/...
// Safe to delete after one or two stable releases.

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AppShell } from "@postd/layout/AppShell";
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
} from "lucide-react";
import { useState, useMemo } from "react";

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

  // Mock events data
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Product Launch Webinar",
      description: "Join us for our Q1 2024 product launch webinar featuring new AI capabilities.",
      location: "Zoom (online)",
      startDate: "2024-03-15",
      startTime: "14:00",
      endDate: "2024-03-15",
      endTime: "15:30",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
      eventType: "digital",
      status: "published",
      visibility: "public",
      tags: ["product", "launch", "ai"],
      brand: "POSTD",
      createdDate: "2024-02-20",
      updatedDate: "2024-02-28",
      platforms: [
        { platform: "facebook", isConnected: true, syncStatus: "synced" },
        { platform: "google_business", isConnected: true, syncStatus: "synced" },
        { platform: "squarespace", isConnected: true, syncStatus: "pending" },
      ],
      promotionSchedule: [
        {
          id: "p1",
          type: "before",
          title: "Join Our Product Launch",
          content: "Exciting new features coming March 15! Register now for our exclusive webinar.",
          platforms: ["facebook", "google_business"],
          scheduledDate: "2024-03-13",
          status: "published",
        },
        {
          id: "p2",
          type: "during",
          title: "Live: Product Launch",
          content: "We're live now! Join us as we reveal our latest AI capabilities.",
          platforms: ["facebook"],
          scheduledDate: "2024-03-15",
          status: "scheduled",
        },
        {
          id: "p3",
          type: "after",
          title: "Watch the Recording",
          content: "Missed the live event? Watch the full recording of our product launch webinar.",
          platforms: ["facebook", "google_business", "squarespace"],
          scheduledDate: "2024-03-16",
          status: "draft",
        },
      ],
      attendance: { interested: 245, going: 89, views: 1200 },
      engagementData: { impressions: 3450, clicks: 234, shares: 45 },
    },
    {
      id: "2",
      title: "Customer Success Stories",
      description: "Celebrate our amazing customers and their success stories with POSTD",
      location: "Instagram Live",
      startDate: "2024-03-22",
      startTime: "16:00",
      endDate: "2024-03-22",
      endTime: "16:30",
      eventType: "digital",
      status: "scheduled",
      visibility: "public",
      tags: ["customer", "success", "stories"],
      brand: "POSTD",
      createdDate: "2024-02-25",
      updatedDate: "2024-02-28",
      platforms: [
        { platform: "facebook", isConnected: true, syncStatus: "synced" },
        { platform: "google_business", isConnected: true, syncStatus: "failed" },
        { platform: "squarespace", isConnected: false, syncStatus: "not_linked" },
      ],
      promotionSchedule: [
        {
          id: "p4",
          type: "before",
          title: "Tune In Tomorrow",
          content: "Don't miss our live Instagram session with amazing customers sharing their success stories!",
          platforms: ["facebook"],
          scheduledDate: "2024-03-21",
          status: "scheduled",
        },
      ],
    },
    {
      id: "3",
      title: "Quarterly Business Review",
      description: "Q1 performance review and planning session for all teams",
      location: "San Francisco HQ - Conference Room A",
      startDate: "2024-04-05",
      startTime: "10:00",
      endDate: "2024-04-05",
      endTime: "12:00",
      eventType: "in_person",
      status: "draft",
      visibility: "private",
      tags: ["internal", "planning", "quarterly"],
      brand: "POSTD",
      createdDate: "2024-02-28",
      updatedDate: "2024-02-28",
      platforms: [
        { platform: "facebook", isConnected: true, syncStatus: "not_linked" },
        { platform: "google_business", isConnected: true, syncStatus: "not_linked" },
        { platform: "squarespace", isConnected: false, syncStatus: "not_linked" },
      ],
      promotionSchedule: [],
    },
    {
      id: "4",
      title: "Community Webinar Series",
      description: "Monthly webinar educating our community on social media best practices",
      location: "Zoom",
      startDate: "2024-03-01",
      startTime: "11:00",
      endDate: "2024-03-01",
      endTime: "12:00",
      eventType: "digital",
      status: "completed",
      visibility: "public",
      tags: ["education", "community", "webinar"],
      brand: "POSTD",
      createdDate: "2024-01-15",
      updatedDate: "2024-02-28",
      platforms: [
        { platform: "facebook", isConnected: true, syncStatus: "synced" },
        { platform: "google_business", isConnected: true, syncStatus: "synced" },
        { platform: "squarespace", isConnected: true, syncStatus: "synced" },
      ],
      promotionSchedule: [
        {
          id: "p5",
          type: "before",
          title: "Join Our Webinar",
          content: "Learn social media best practices from the experts",
          platforms: ["facebook", "google_business"],
          scheduledDate: "2024-02-28",
          status: "published",
        },
      ],
      attendance: { interested: 567, going: 234, views: 5600 },
      engagementData: { impressions: 8900, clicks: 890, shares: 234 },
    },
    {
      id: "5",
      title: "Spring Sale - 40% Off Everything",
      description: "Limited-time spring promotion featuring 40% discounts on all products and services",
      location: "Online & In-Store",
      startDate: "2024-03-25",
      startTime: "00:00",
      endDate: "2024-03-31",
      endTime: "23:59",
      eventType: "promo",
      status: "scheduled",
      visibility: "public",
      tags: ["sale", "spring", "discount"],
      brand: "POSTD",
      createdDate: "2024-03-10",
      updatedDate: "2024-03-10",
      platforms: [
        { platform: "facebook", isConnected: true, syncStatus: "synced" },
        { platform: "google_business", isConnected: true, syncStatus: "synced" },
        { platform: "squarespace", isConnected: true, syncStatus: "pending" },
      ],
      promotionSchedule: [
        {
          id: "p6",
          type: "before",
          title: "Huge Spring Sale Coming!",
          content: "Get ready! Our biggest spring sale is starting March 25. Save 40% on everything!",
          platforms: ["facebook", "google_business"],
          scheduledDate: "2024-03-23",
          status: "scheduled",
        },
        {
          id: "p7",
          type: "during",
          title: "Sale is LIVE NOW - 40% Off!",
          content: "It's here! All products on sale for 40% off. Shop now before it ends March 31!",
          platforms: ["facebook", "google_business", "squarespace"],
          scheduledDate: "2024-03-25",
          status: "scheduled",
        },
      ],
      attendance: { interested: 892, going: 0, views: 3200 },
      engagementData: { impressions: 12500, clicks: 1250, shares: 89 },
    },
  ]);

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
      brand: "POSTD",
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
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {/* Zone 1: Strategic Overview */}
          <div className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                  Events
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  {currentWorkspace?.logo} {currentWorkspace?.name} — Manage business events, sync across platforms, and amplify reach with AI promotions.
                </p>
              </div>
              <button
                onClick={handleAddEvent}
                className="flex items-center gap-2 px-4 py-2.5 bg-lime-400 text-indigo-950 rounded-lg hover:bg-lime-500 transition-colors font-bold text-sm sm:text-base whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
            </div>

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
                    onChange={(e) => setFilterStatus(e.target.value as any)}
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
                    console.log("Promote action:", action);
                  }}
                />
              </div>
            </div>
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
    </AppShell>
  );
}
