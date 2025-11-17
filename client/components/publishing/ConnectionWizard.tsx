import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  MapPin,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { Platform, ConnectionStatus, OAuthFlow } from "@shared/publishing";

interface ConnectionWizardProps {
  brandId: string;
  connections: ConnectionStatus[];
  onConnectionUpdate?: () => void;
}

const PLATFORM_CONFIG = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    description: "Share photos and stories",
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600",
    description: "Reach your audience on Facebook",
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700",
    description: "Professional networking and content",
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "bg-black",
    description: "Share thoughts and engage",
  },
  google_business: {
    name: "Google Business",
    icon: MapPin,
    color: "bg-green-600",
    description: "Manage your business presence",
  },
} as const;

export function ConnectionWizard({
  brandId,
  connections,
  onConnectionUpdate,
}: ConnectionWizardProps) {
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform);
    setError(null);

    try {
      const response = await fetch("/api/publishing/oauth/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, brandId }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate connection");
      }

      const oauthFlow: OAuthFlow = await response.json();

      // Open OAuth flow in popup window
      const popup = window.open(
        oauthFlow.authUrl,
        `oauth-${platform}`,
        "width=600,height=700,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          // Refresh connections after a short delay
          setTimeout(() => {
            onConnectionUpdate?.();
          }, 1000);
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(
        () => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkClosed);
            setConnecting(null);
            setError("Connection timeout. Please try again.");
          }
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      console.error("Connection error:", error);
      setError(error instanceof Error ? error.message : "Connection failed");
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      const response = await fetch(
        `/api/publishing/connections/${brandId}/${platform}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        onConnectionUpdate?.();
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      setError("Failed to disconnect. Please try again.");
    }
  };

  const handleRefreshToken = async (platform: Platform) => {
    try {
      const response = await fetch(
        `/api/publishing/refresh-token/${brandId}/${platform}`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        onConnectionUpdate?.();
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      setError("Failed to refresh connection. Please reconnect.");
    }
  };

  const getConnectionStatus = (
    platform: Platform,
  ): ConnectionStatus | undefined => {
    return connections.find((c) => c.platform === platform);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Connections</h2>
        <p className="text-gray-600">
          Connect your social media accounts to start publishing content
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
          const connection = getConnectionStatus(platform as Platform);
          const Icon = config.icon;
          const isConnecting = connecting === platform;

          return (
            <Card key={platform} className="relative overflow-hidden">
              <div className={cn("h-2", config.color)} />

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn("p-2 rounded-lg text-white", config.color)}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {config.description}
                    </p>
                  </div>
                  {connection?.connected && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {connection?.connected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {connection.profilePicture && (
                        <img
                          src={connection.profilePicture}
                          alt={connection.accountName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {connection.accountName}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Connected
                          </Badge>
                          {connection.needsReauth && (
                            <Badge variant="destructive" className="text-xs">
                              Needs Reauth
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {connection.tokenExpiry && (
                      <p className="text-xs text-gray-500">
                        Token expires:{" "}
                        {new Date(connection.tokenExpiry).toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {connection.needsReauth ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRefreshToken(platform as Platform)
                          }
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(platform as Platform)}
                          className="flex-1"
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect(platform as Platform)}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect {config.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>OAuth Flow:</strong> Each connection takes 1-2 minutes to
          complete. You'll be redirected to the platform's authorization page in
          a popup window.
        </AlertDescription>
      </Alert>
    </div>
  );
}
