import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { Integration, IntegrationTemplate } from "@shared/integrations";

interface IntegrationsManagerProps {
  brandId: string;
  className?: string;
}

export function IntegrationsManager({
  brandId,
  className,
}: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadIntegrations();
    loadTemplates();
  }, [brandId]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/integrations?brandId=${brandId}`);
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/integrations/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (template: IntegrationTemplate) => {
    try {
      const response = await fetch("/api/integrations/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: template.type,
          brandId,
          redirectUrl: `${window.location.origin}/integrations/callback`,
        }),
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.open(authUrl, "_blank", "width=600,height=700");
      }
    } catch (error) {
      console.error("Failed to start OAuth:", error);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "full" }),
      });

      await loadIntegrations();
    } catch (error) {
      console.error("Failed to sync:", error);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
      });

      await loadIntegrations();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const _getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const _getStatusColor = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-gray-600">
            Connect your tools for seamless automation
          </p>
        </div>
        <Badge variant="outline">
          {integrations.filter((i) => i.status === "connected").length}{" "}
          connected
        </Badge>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Connected Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onSync={() => handleSync(integration.id)}
                onDisconnect={() => handleDisconnect(integration.id)}
                onConfigure={() => setSelectedIntegration(integration.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Available Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter(
                (template) =>
                  !integrations.some((int) => int.type === template.type),
              )
              .map((template) => (
                <IntegrationTemplateCard
                  key={template.type}
                  template={template}
                  onConnect={() => handleConnect(template)}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings Modal */}
      {selectedIntegration && (
        <IntegrationSettings
          integration={integrations.find((i) => i.id === selectedIntegration)!}
          onClose={() => setSelectedIntegration(null)}
          onUpdate={loadIntegrations}
        />
      )}
    </div>
  );
}

interface IntegrationCardProps {
  integration: Integration;
  onSync: () => void;
  onDisconnect: () => void;
  onConfigure: () => void;
}

function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
  onConfigure,
}: IntegrationCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Zap className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium capitalize">
              {integration.type.replace("_", " ")}
            </h4>
            <Badge className={getStatusColor(integration.status)}>
              {getStatusIcon(integration.status)}
              <span className="ml-1">{integration.status}</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{integration.name}</p>
          {integration.lastSyncAt && (
            <p className="text-xs text-gray-500">
              Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onSync}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync
        </Button>
        <Button size="sm" variant="outline" onClick={onConfigure}>
          <Settings className="h-3 w-3 mr-1" />
          Settings
        </Button>
        <Button size="sm" variant="outline" onClick={onDisconnect}>
          <Trash2 className="h-3 w-3 mr-1" />
          Disconnect
        </Button>
      </div>
    </div>
  );
}

interface IntegrationTemplateCardProps {
  template: IntegrationTemplate;
  onConnect: () => void;
}

function IntegrationTemplateCard({
  template,
  onConnect,
}: IntegrationTemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-gray-600" />
          </div>
          <Badge variant="outline" className="capitalize">
            {template.category}
          </Badge>
        </div>

        <h3 className="font-semibold mb-2">{template.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{template.description}</p>

        <div className="space-y-2 mb-4">
          {template.features.slice(0, 3).map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-gray-600"
            >
              <CheckCircle className="h-3 w-3 text-green-500" />
              {feature}
            </div>
          ))}
        </div>

        <Button onClick={onConnect} className="w-full">
          Connect {template.name}
        </Button>
      </CardContent>
    </Card>
  );
}

interface IntegrationSettingsProps {
  integration: Integration;
  onClose: () => void;
  onUpdate: () => void;
}

function IntegrationSettings({
  integration,
  onClose,
  onUpdate,
}: IntegrationSettingsProps) {
  const [settings, setSettings] = useState(integration.settings);

  const handleSave = async () => {
    try {
      await fetch(`/api/integrations/${integration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {integration.name} Settings
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Sync</Label>
            <Switch
              checked={settings.syncEnabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, syncEnabled: checked }))
              }
            />
          </div>

          <div>
            <Label>Sync Frequency</Label>
            <Select
              value={settings.syncFrequency}
              onValueChange={(value: string) =>
                setSettings((prev) => ({ ...prev, syncFrequency: value as "realtime" | "hourly" | "daily" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sync Direction</Label>
            <Select
              value={settings.syncDirection}
              onValueChange={(value: string) =>
                setSettings((prev) => ({ ...prev, syncDirection: value as "inbound" | "outbound" | "bidirectional" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bidirectional">Bidirectional</SelectItem>
                <SelectItem value="inbound">Inbound Only</SelectItem>
                <SelectItem value="outbound">Outbound Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Auto Sync</Label>
            <Switch
              checked={settings.autoSync}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoSync: checked }))
              }
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusIcon(status: Integration["status"]) {
  switch (status) {
    case "connected":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusColor(status: Integration["status"]) {
  switch (status) {
    case "connected":
      return "bg-green-100 text-green-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
