/**
 * Client Settings Page
 * Manages email preferences, notification settings, and account preferences
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Check,
  Copy,
  Mail,
  Bell,
  Settings as SettingsIcon,
} from "lucide-react";
import type { ClientSettings } from "@shared/client-settings";
import { TIMEZONE_OPTIONS, LANGUAGE_OPTIONS } from "@shared/client-settings";

export default function ClientSettings() {
  const [settings, setSettings] = useState<ClientSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [unsubscribeUrl, setUnsubscribeUrl] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/client-settings", {
        headers: {
          "x-client-id": "current-client",
          "x-brand-id": "current-brand",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/client-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": "current-client",
          "x-brand-id": "current-brand",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();
      setSettings(data.settings);
      setSaveSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateUnsubscribeLink = async () => {
    if (!settings) return;

    try {
      const response = await fetch(
        "/api/client-settings/generate-unsubscribe-link",
        {
          method: "POST",
          headers: {
            "x-client-id": "current-client",
            "x-brand-id": "current-brand",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate unsubscribe link");
      }

      const data = await response.json();
      setUnsubscribeUrl(data.unsubscribeUrl);
    } catch (error) {
      console.error("Failed to generate unsubscribe link:", error);
    }
  };

  const handleCopyUnsubscribeUrl = () => {
    if (unsubscribeUrl) {
      navigator.clipboard.writeText(unsubscribeUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Failed to load settings</p>
            <p className="text-sm text-red-700">
              Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Account Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your email preferences and notification settings
        </p>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 font-medium">
            Settings saved successfully
          </p>
        </div>
      )}

      {/* Email Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>
            Choose which emails you want to receive and how often
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Approval emails */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Approval Notifications
            </h3>
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Posts Needing Approval
                  </p>
                  <p className="text-sm text-gray-600">
                    Get notified when content is ready for your review
                  </p>
                </div>
                <Switch
                  checked={settings.emailPreferences.approvalsNeeded}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailPreferences: {
                        ...settings.emailPreferences,
                        approvalsNeeded: checked,
                      },
                    })
                  }
                  aria-label="Toggle approval notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Approval Reminders
                  </p>
                  <p className="text-sm text-gray-600">
                    Receive reminders for pending approvals
                  </p>
                </div>
                <Switch
                  checked={settings.emailPreferences.approvalReminders}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailPreferences: {
                        ...settings.emailPreferences,
                        approvalReminders: checked,
                      },
                    })
                  }
                  aria-label="Toggle approval reminders"
                />
              </div>

              {settings.emailPreferences.approvalReminders && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Reminder Frequency
                  </label>
                  <Select
                    value={settings.emailPreferences.reminderFrequency}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        emailPreferences: {
                          ...settings.emailPreferences,
                          reminderFrequency: value as unknown,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediately</SelectItem>
                      <SelectItem value="24h">Every 24 hours</SelectItem>
                      <SelectItem value="48h">Every 48 hours</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Publishing notifications */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-gray-900">
              Publishing Notifications
            </h3>
            <div className="space-y-3 pl-4 border-l-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Publishing Failures
                  </p>
                  <p className="text-sm text-gray-600">
                    Alert me when content fails to publish
                  </p>
                </div>
                <Switch
                  checked={settings.emailPreferences.publishFailures}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailPreferences: {
                        ...settings.emailPreferences,
                        publishFailures: checked,
                      },
                    })
                  }
                  aria-label="Toggle publishing failure notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Publishing Success
                  </p>
                  <p className="text-sm text-gray-600">
                    Confirm when content is successfully published
                  </p>
                </div>
                <Switch
                  checked={settings.emailPreferences.publishSuccess}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailPreferences: {
                        ...settings.emailPreferences,
                        publishSuccess: checked,
                      },
                    })
                  }
                  aria-label="Toggle publishing success notifications"
                />
              </div>
            </div>
          </div>

          {/* Digest emails */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-gray-900">Digest Emails</h3>
            <div className="space-y-3 pl-4 border-l-2 border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weekly Digest</p>
                  <p className="text-sm text-gray-600">
                    Get a weekly summary of your content performance
                  </p>
                </div>
                <Switch
                  checked={settings.emailPreferences.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailPreferences: {
                        ...settings.emailPreferences,
                        weeklyDigest: checked,
                      },
                    })
                  }
                  aria-label="Toggle weekly digest"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Daily Digest</p>
                  <p className="text-sm text-gray-600">
                    Get a daily summary of your content activity
                  </p>
                </div>
                <Switch
                  checked={settings.emailPreferences.dailyDigest}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailPreferences: {
                        ...settings.emailPreferences,
                        dailyDigest: checked,
                      },
                    })
                  }
                  aria-label="Toggle daily digest"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Account Preferences
          </CardTitle>
          <CardDescription>
            Customize your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Timezone */}
            <div>
              <Label htmlFor="timezone" className="text-sm font-medium">
                Timezone
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    timezone: value,
                  })
                }
              >
                <SelectTrigger id="timezone" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div>
              <Label htmlFor="language" className="text-sm font-medium">
                Language
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    language: value as unknown,
                  })
                }
              >
                <SelectTrigger id="language" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max emails per day */}
          <div>
            <Label className="text-sm font-medium">
              Maximum Emails Per Day:{" "}
              {settings.emailPreferences.maxEmailsPerDay}
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              We'll consolidate excess emails into a digest to avoid
              overwhelming your inbox
            </p>
            <input
              type="range"
              min="1"
              max="100"
              value={settings.emailPreferences.maxEmailsPerDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  emailPreferences: {
                    ...settings.emailPreferences,
                    maxEmailsPerDay: parseInt(e.target.value),
                  },
                })
              }
              className="mt-4 w-full"
              aria-label="Maximum emails per day"
            />
          </div>
        </CardContent>
      </Card>

      {/* Unsubscribe Management */}
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe Management</CardTitle>
          <CardDescription>
            Generate and share your personal unsubscribe link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Use this link to unsubscribe from emails without logging in. Share
            it securely with anyone who needs it.
          </p>

          <div>
            <Button
              onClick={handleGenerateUnsubscribeLink}
              variant="outline"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Generate Unsubscribe Link
            </Button>
          </div>

          {unsubscribeUrl && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">
                Your Unsubscribe Link
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={unsubscribeUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  aria-label="Unsubscribe link"
                />
                <Button
                  onClick={handleCopyUnsubscribeUrl}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copiedToClipboard ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                ⚠️ Keep this link private. Anyone with this link can unsubscribe
                from your emails.
              </p>
            </div>
          )}

          {settings.unsubscribedFromAll && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">
                  You're unsubscribed from all emails
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  To resubscribe to notifications, update your email preferences
                  above and save your settings.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button onClick={loadSettings} variant="outline" disabled={saving}>
          Reset
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
