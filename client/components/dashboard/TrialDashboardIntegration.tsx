import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/use-trial-status";
import { usePublishCelebration } from "@/hooks/use-publish-celebration";
import { TrialBanner } from "./TrialBanner";
import { PostCounterPill } from "./PostCounterPill";
import { useState } from "react";

/**
 * Example integration of trial workflow components
 * This demonstrates how to use TrialBanner, PostCounterPill, and publish celebration
 */
export function TrialDashboardIntegration() {
  const { user } = useAuth();
  const { trialStatus, isLoading } = useTrialStatus();
  const { celebrate } = usePublishCelebration();
  const [isPublishing, setIsPublishing] = useState(false);

  // Mock publish function - replace with actual API call
  const handlePublish = async () => {
    if (!trialStatus?.canPublish) {
      return;
    }

    setIsPublishing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if this is the first post
      const isFirstPost = (user?.trial_published_count || 0) === 0;

      // Celebrate with confetti
      celebrate(isFirstPost);

      // Update trial count (in real implementation, this comes from server)
      if (user) {
        user.trial_published_count = (user.trial_published_count || 0) + 1;
      }
    } catch (error) {
      console.error("Publish failed:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Don't show trial UI for non-trial users
  if (user?.plan !== "trial" || isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {trialStatus && (
        <TrialBanner
          publishedCount={trialStatus.publishedCount}
          maxPosts={trialStatus.maxPosts}
        />
      )}

      {/* Example content area with post counter */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Ready to Publish?
          </h3>
          {trialStatus && (
            <PostCounterPill
              publishedCount={trialStatus.publishedCount}
              maxPosts={trialStatus.maxPosts}
            />
          )}
        </div>

        <p className="text-slate-600 mb-6">
          Test your content publishing workflow during the trial period. You can
          publish up to 2 posts to see the full platform in action.
        </p>

        <button
          onClick={handlePublish}
          disabled={!trialStatus?.canPublish || isPublishing}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            trialStatus?.canPublish && !isPublishing
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isPublishing
            ? "Publishing..."
            : trialStatus?.canPublish
              ? "Publish Test Post"
              : "Trial Limit Reached"}
        </button>

        {trialStatus && !trialStatus.canPublish && (
          <p className="text-sm text-red-600 mt-3">
            You've reached your trial limit. Upgrade to continue publishing!
          </p>
        )}
      </div>

      {/* Trial Info Card */}
      {trialStatus && trialStatus.daysRemaining !== null && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <h4 className="font-bold text-purple-900 mb-2">
            Trial Period Status
          </h4>
          <div className="space-y-2 text-sm text-purple-800">
            <p>
              <strong>Days Remaining:</strong> {trialStatus.daysRemaining} days
            </p>
            <p>
              <strong>Posts Used:</strong> {trialStatus.publishedCount} /{" "}
              {trialStatus.maxPosts}
            </p>
            <p>
              <strong>Posts Remaining:</strong> {trialStatus.remainingPosts}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
