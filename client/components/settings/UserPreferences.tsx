/**
 * User preferences component
 * Shows role-based settings
 */

import { useState } from "react";
import { useCan } from "@/lib/auth/useCan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserPreferencesProps {
  className?: string;
}

export function UserPreferencesComponent({
  className = "",
}: UserPreferencesProps) {
  const canManageUsers = useCan("user:manage");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="team">Team Settings</TabsTrigger>
          )}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-4">General Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Dark mode</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Compact view</span>
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={slackNotifications}
                  onChange={(e) => setSlackNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Slack notifications</span>
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Team Settings - Admin only */}
        {canManageUsers && (
          <TabsContent value="team" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-4">Team Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage team members and their roles
              </p>
              <div className="space-y-2">
                <div className="p-3 border rounded">
                  <p className="font-medium text-sm">Team Members</p>
                  <p className="text-xs text-gray-500">5 members</p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default UserPreferencesComponent;
