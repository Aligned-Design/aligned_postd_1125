/**
 * Dashboard Page
 * Main entry point after authentication
 * Displays role-based content and actions
 */

import { useAuth } from "@/lib/auth";
import { useCan } from "@/lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { AppShell } from "@postd/layout/AppShell";
import ActionButtonsHeader from "@/components/dashboard/ActionButtonsHeader";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";
import AlignedAISummary from "@/components/dashboard/AlignedAISummary";
import SmartDashboard from "@/components/analytics/SmartDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const canCreateContent = useCan("content:create");
  const canManageBrand = useCan("brand:manage");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}! You're logged in as{" "}
            <span className="font-medium">{role}</span>
          </p>
        </div>

        {/* Action Buttons */}
        {canCreateContent && (
          <div>
            <ActionButtonsHeader
              onCreateContent={() => navigate("/creative-studio")}
              onSchedulePost={() => navigate("/content-queue")}
              onPublishNow={() => {
                /* Handle publish */
              }}
              onBestTimeSuggestions={() => {
                /* Handle suggestions */
              }}
            />
          </div>
        )}

        {/* Good News Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border border-green-200">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🎉</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Good News!
              </h2>
              <p className="text-gray-700 mb-4">
                Your content is performing well. Here's a quick summary of your
                metrics:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✨ 5 new pieces of content created</li>
                <li>📈 3.2K impressions this week</li>
                <li>💬 256 engagements</li>
                <li>⏰ Best posting time: 9 AM EST</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {canCreateContent && <AlignedAISummary />}

        {/* Dashboard Widgets */}
        <DashboardWidgets
          items={[
            {
              id: "1",
              title: "LinkedIn Post Review",
              status: "pending",
              date: "2025-11-12",
            },
            {
              id: "2",
              title: "Twitter Thread Approval",
              status: "pending",
              date: "2025-11-11",
            },
          ]}
          onApprove={(id) => console.log("Approved:", id)}
          onReject={(id) => console.log("Rejected:", id)}
        />

        {/* Analytics */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Analytics Overview</h2>
          <SmartDashboard hasGoals={true} />
        </div>

        {/* Brand Management Section - Admin only */}
        {canManageBrand && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Brand Management</h3>
            <p className="text-gray-700 mb-4">
              As an administrator, you have access to brand management tools.
            </p>
            <Link
              to="/brand-guide"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Brand
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
