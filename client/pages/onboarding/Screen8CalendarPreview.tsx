/**
 * Screen 8: 1-Week Calendar View Preview
 * 
 * Onboarding-only calendar view showing generated content.
 * Features:
 * - Each post placed on a day
 * - Tappable cards
 * - Hover previews
 * - Drag & drop enabled
 * - Bubble guide hints
 * 
 * This is NOT the full calendar UI - only for onboarding.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Calendar, Sparkles, MessageSquare, RefreshCw, X } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  type: string;
  scheduledDate: string;
  scheduledTime: string;
  preview?: string;
  imageUrl?: string; // ✅ Image URL from scraped brand images or prioritized images
}

export default function Screen8CalendarPreview() {
  const { user, brandSnapshot, setOnboardingStep } = useAuth();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [engagementCount, setEngagementCount] = useState(0);
  const [showConnectCTA, setShowConnectCTA] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayContent, setSelectedDayContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    // Load generated content from API
    const loadContent = async () => {
      try {
        // Get the most recent content package for this brand
        // For onboarding, we'll use the brandId from localStorage or context
        const brandId = localStorage.getItem("aligned_brand_id");
        if (!brandId) {
          console.warn("[CalendarPreview] No brandId found");
          return;
        }
        
        // Try new content plan API first
        const contentPlanResponse = await fetch(`/api/content-plan/${brandId}`);
        if (contentPlanResponse.ok) {
          const data = await contentPlanResponse.json();
          if (data.success && data.contentPlan && data.contentPlan.items) {
            const items: ContentItem[] = data.contentPlan.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              platform: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
              type: item.contentType || "post",
              scheduledDate: item.scheduledDate,
              scheduledTime: item.scheduledTime,
              preview: item.content?.substring(0, 50) + "..." || item.title,
              imageUrl: item.imageUrl,
            }));
            setContentItems(items);
            return;
          }
        }
        
        // Fallback to old onboarding API
        const response = await fetch(`/api/onboarding/content-package/${brandId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.contentPackage) {
            const items: ContentItem[] = data.contentPackage.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              platform: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
              type: item.type,
              scheduledDate: item.scheduledDate,
              scheduledTime: item.scheduledTime,
              preview: item.content?.substring(0, 50) + "..." || item.title,
              imageUrl: item.imageUrl, // ✅ Include imageUrl from API response
            }));
            setContentItems(items);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load content package:", error);
      }
      
      // Fallback: Try to get from localStorage (if saved during generation)
      const savedPackage = localStorage.getItem("aligned:onboarding:content_package");
      if (savedPackage) {
        try {
          const parsed = JSON.parse(savedPackage);
          if (parsed.items) {
            const items: ContentItem[] = parsed.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              platform: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
              type: item.type,
              scheduledDate: item.scheduledDate,
              scheduledTime: item.scheduledTime,
              preview: item.content?.substring(0, 50) + "..." || item.title,
              imageUrl: item.imageUrl, // ✅ Include imageUrl from localStorage
            }));
            setContentItems(items);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved package:", e);
        }
      }
      
      // Final fallback: Generate sample content based on brand snapshot
      if (brandSnapshot) {
        const sampleContent = generateSampleWeekContent(brandSnapshot);
        setContentItems(sampleContent);
      } else {
        setContentItems([]);
      }
    };
    
    loadContent();
  }, [brandSnapshot]);

  // Generate sample 7-day content plan based on brand data
  const generateSampleWeekContent = (snapshot: any): ContentItem[] => {
    const brandName = snapshot.brandName || snapshot.name || "Your Brand";
    const industry = snapshot.industry || snapshot.businessType || "business";
    const weeklyFocus = (user as any)?.weeklyFocus || localStorage.getItem("aligned:weekly_focus") || "brand_awareness";
    
    // Content templates based on weekly focus
    const contentTemplates: Array<{
      title: string;
      platform: string;
      type: string;
      time: string;
    }> = [];

    if (weeklyFocus === "social_engagement") {
      contentTemplates.push(
        { title: `Engage with ${brandName} Community`, platform: "Instagram", type: "post", time: "9:00 AM" },
        { title: `Behind the Scenes at ${brandName}`, platform: "Facebook", type: "post", time: "2:00 PM" },
        { title: `${brandName} Weekly Tips`, platform: "LinkedIn", type: "post", time: "10:00 AM" },
        { title: `Customer Spotlight: ${brandName}`, platform: "Instagram", type: "story", time: "5:00 PM" },
        { title: `${brandName} Product Showcase`, platform: "Facebook", type: "post", time: "11:00 AM" },
        { title: `Industry Insights from ${brandName}`, platform: "LinkedIn", type: "article", time: "3:00 PM" },
        { title: `Weekend Inspiration from ${brandName}`, platform: "Instagram", type: "post", time: "10:00 AM" },
      );
    } else if (weeklyFocus === "lead_generation") {
      contentTemplates.push(
        { title: `${brandName} Free Resource Guide`, platform: "LinkedIn", type: "post", time: "9:00 AM" },
        { title: `Exclusive Offer from ${brandName}`, platform: "Facebook", type: "post", time: "1:00 PM" },
        { title: `How ${brandName} Can Help You`, platform: "Instagram", type: "carousel", time: "11:00 AM" },
        { title: `${brandName} Case Study Highlights`, platform: "LinkedIn", type: "article", time: "2:00 PM" },
        { title: `Limited Time: ${brandName} Special`, platform: "Facebook", type: "post", time: "10:00 AM" },
        { title: `Testimonials: Why Choose ${brandName}`, platform: "Instagram", type: "post", time: "4:00 PM" },
        { title: `${brandName} Weekly Newsletter`, platform: "Email", type: "email", time: "8:00 AM" },
      );
    } else if (weeklyFocus === "brand_consistency") {
      contentTemplates.push(
        { title: `${brandName} Brand Story`, platform: "LinkedIn", type: "post", time: "9:00 AM" },
        { title: `${brandName} Values in Action`, platform: "Instagram", type: "post", time: "2:00 PM" },
        { title: `What Makes ${brandName} Unique`, platform: "Facebook", type: "post", time: "11:00 AM" },
        { title: `${brandName} Team Spotlight`, platform: "LinkedIn", type: "article", time: "3:00 PM" },
        { title: `${brandName} Brand Guidelines`, platform: "Instagram", type: "carousel", time: "10:00 AM" },
        { title: `${brandName} Mission Statement`, platform: "Facebook", type: "post", time: "1:00 PM" },
        { title: `${brandName} Weekly Reflection`, platform: "Instagram", type: "story", time: "5:00 PM" },
      );
    } else {
      // Default: brand awareness
      contentTemplates.push(
        { title: `Welcome to ${brandName}`, platform: "Instagram", type: "post", time: "9:00 AM" },
        { title: `${brandName} Introduction`, platform: "LinkedIn", type: "post", time: "10:00 AM" },
        { title: `Discover ${brandName}`, platform: "Facebook", type: "post", time: "2:00 PM" },
        { title: `${brandName} Services Overview`, platform: "Instagram", type: "carousel", time: "11:00 AM" },
        { title: `Why ${brandName}?`, platform: "LinkedIn", type: "article", time: "3:00 PM" },
        { title: `${brandName} Community`, platform: "Facebook", type: "post", time: "1:00 PM" },
        { title: `${brandName} Weekly Update`, platform: "Instagram", type: "story", time: "4:00 PM" },
      );
    }

    // Distribute content across 7 days
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date.toISOString().split("T")[0];
    });

    // Distribute posts across days (1-2 per day)
    const items: ContentItem[] = [];
    let templateIndex = 0;
    
    for (let dayIndex = 0; dayIndex < 7 && templateIndex < contentTemplates.length; dayIndex++) {
      const postsPerDay = dayIndex < 5 ? 2 : 1; // 2 posts Mon-Fri, 1 post Sat-Sun
      
      for (let i = 0; i < postsPerDay && templateIndex < contentTemplates.length; i++) {
        const template = contentTemplates[templateIndex];
        items.push({
          id: `sample-${dayIndex}-${i}`,
          title: template.title,
          platform: template.platform,
          type: template.type,
          scheduledDate: weekDates[dayIndex],
          scheduledTime: template.time,
          preview: `${template.title} - ${template.platform} ${template.type}`,
        });
        templateIndex++;
      }
    }

    return items;
  };

  const handleItemClick = (itemId: string) => {
    setEngagementCount((prev) => prev + 1);
    checkEngagementTrigger();
    // Find the item and show its details
    const item = contentItems.find(i => i.id === itemId);
    if (item) {
      setSelectedDayContent([item]);
      setSelectedDay(item.scheduledDate);
    }
  };

  const handleDayClick = (date: string) => {
    const dayContent = getContentForDay(date);
    if (dayContent.length > 0) {
      setSelectedDayContent(dayContent);
      setSelectedDay(date);
    }
  };

  const handleItemDrag = (itemId: string) => {
    setDraggedItem(itemId);
    setEngagementCount((prev) => prev + 1);
    checkEngagementTrigger();
  };

  const handleItemDrop = (targetDate: string) => {
    if (draggedItem) {
      setContentItems((prev) =>
        prev.map((item) =>
          item.id === draggedItem ? { ...item, scheduledDate: targetDate } : item
        )
      );
      setDraggedItem(null);
      setEngagementCount((prev) => prev + 1);
      checkEngagementTrigger();
    }
  };

  const checkEngagementTrigger = () => {
    // Show connect CTA after user engages (clicks, drags, or edits)
    if (engagementCount >= 1 && !showConnectCTA) {
      setTimeout(() => {
        setShowConnectCTA(true);
      }, 1000);
    }
  };

  const handleContinue = () => {
    setOnboardingStep(9);
  };

  const handleSkipConnect = () => {
    setShowConnectCTA(false);
    // Mark as skipped, continue to dashboard
    localStorage.setItem("aligned:onboarding:connect_skipped", "true");
    setOnboardingStep(10);
  };

  const handleRegenerateWeek = async () => {
    const weeklyFocus = (user as any)?.weeklyFocus || localStorage.getItem("aligned:weekly_focus") || "brand_awareness";
    if (!weeklyFocus || !brandSnapshot) return;
    
    setIsRegenerating(true);
    try {
      const brandId = localStorage.getItem("aligned_brand_id") || `brand_${Date.now()}`;
      
      const response = await fetch("/api/onboarding/regenerate-week", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId,
          weeklyFocus,
          brandSnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate content");
      }

      const result = await response.json();
      if (result.success && result.contentPackage) {
        // Update content items
        const items: ContentItem[] = result.contentPackage.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          platform: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
          type: item.type,
          scheduledDate: item.scheduledDate,
          scheduledTime: item.scheduledTime,
          preview: item.content?.substring(0, 50) + "..." || item.title,
          imageUrl: item.imageUrl, // ✅ Include imageUrl from regenerated content
        }));
        setContentItems(items);
        
        // Save to localStorage
        localStorage.setItem("aligned:onboarding:content_package", JSON.stringify(result.contentPackage));
      }
    } catch (error) {
      console.error("Failed to regenerate content:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Group content by day
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date.toISOString().split("T")[0];
  });

  const getContentForDay = (date: string) => {
    return contentItems.filter((item) => item.scheduledDate === date);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
      case "facebook":
      case "linkedin":
      case "twitter":
        return "📱";
      case "email":
        return "📧";
      case "google":
        return "📍";
      case "blog":
        return "📝";
      default:
        return "📄";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
      <div className="max-w-6xl mx-auto pt-6 pb-12">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={8} totalSteps={10} label="Your content calendar" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Here's your week at a glance
          </h1>
          <p className="text-slate-600 font-medium mb-4">
            Your 7-day content plan is ready. Drag posts to rearrange or click to edit.
          </p>
          <button
            onClick={handleRegenerateWeek}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating..." : "Regenerate Week"}
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6 mb-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              const dayContent = getContentForDay(date);
              const dateObj = new Date(date);
              const dayName = daysOfWeek[index];

              return (
                <div
                  key={date}
                  className="min-h-[200px] p-3 rounded-lg border-2 border-slate-200 bg-slate-50/50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                  onClick={() => handleDayClick(date)}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleItemDrop(date);
                  }}
                >
                  {/* Day Header */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-slate-600 uppercase">{dayName}</p>
                    <p className="text-lg font-black text-slate-900">{dateObj.getDate()}</p>
                    {dayContent.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">{dayContent.length} {dayContent.length === 1 ? 'post' : 'posts'}</p>
                    )}
                  </div>

                  {/* Content Items */}
                  <div className="space-y-2">
                    {dayContent.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleItemDrag(item.id)}
                        onClick={() => handleItemClick(item.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-move group"
                      >
                        {/* ✅ Image Preview (if available) */}
                        {item.imageUrl && (
                          <div className="w-full h-20 mb-2 rounded overflow-hidden bg-slate-100">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image on error (broken URL)
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{getPlatformIcon(item.platform)}</span>
                          <span className="text-xs font-bold text-slate-700 truncate">{item.platform}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 group-hover:text-slate-900 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{item.scheduledTime}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guide Hints */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>This is your week at a glance.</strong> You can see all your scheduled content in one place.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Drag posts to rearrange.</strong> Click and drag any post to a different day or time.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Click any post to edit or regenerate.</strong> Make changes to match your brand perfectly.
              </p>
            </div>
          </div>
        </div>

        {/* Connect Accounts CTA (Triggered by Engagement) */}
        {showConnectCTA && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-black mb-1">You're almost ready!</h3>
                  <p className="text-indigo-100 text-sm">
                    Connect your accounts to publish your content automatically
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-white text-indigo-600 font-black rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                  >
                    Connect My Accounts
                  </button>
                  <button
                    onClick={handleSkipConnect}
                    className="px-4 py-3 bg-indigo-500/50 text-white font-bold rounded-lg hover:bg-indigo-500/70 transition-colors whitespace-nowrap"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button (if CTA not shown yet) */}
        {!showConnectCTA && (
          <div className="text-center">
            <button
              onClick={handleContinue}
              className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

