import { Link2, Plus, Trash2, AlertCircle, Clock, Shield, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface LinkedAccount {
  id: string;
  platform: string;
  icon: string;
  handle: string;
  status: "connected" | "disconnected" | "error" | "expiring";
  connectedDate?: string;
  tokenExpiresIn?: number; // days until expiration
  permissions?: string[];
  lastSync?: string;
}

const linkedAccounts: LinkedAccount[] = [
  {
    id: "1",
    platform: "Meta (Facebook & Instagram)",
    icon: "📘",
    handle: "@alignedbydesign",
    status: "connected",
    connectedDate: "Oct 12, 2024",
    tokenExpiresIn: 45,
    permissions: ["publish_pages", "manage_pages", "read_insights"],
    lastSync: "2 hours ago",
  },
  {
    id: "2",
    platform: "Google Business",
    icon: "🔍",
    handle: "Aligned By Design",
    status: "connected",
    connectedDate: "Oct 8, 2024",
    tokenExpiresIn: 15,
    permissions: ["read_business", "manage_listings"],
    lastSync: "30 minutes ago",
  },
  {
    id: "3",
    platform: "TikTok",
    icon: "🎵",
    handle: "@aligned",
    status: "expiring",
    connectedDate: "Sep 30, 2024",
    tokenExpiresIn: 5,
    permissions: ["video.upload", "video.publish"],
    lastSync: "1 day ago",
  },
  {
    id: "4",
    platform: "YouTube",
    icon: "📺",
    handle: "Aligned By Design",
    status: "connected",
    connectedDate: "Sep 22, 2024",
    tokenExpiresIn: 60,
    permissions: ["youtube.upload", "youtube.readonly"],
    lastSync: "3 hours ago",
  },
  {
    id: "5",
    platform: "LinkedIn",
    icon: "💼",
    handle: "Aligned By Design",
    status: "connected",
    connectedDate: "Sep 15, 2024",
    tokenExpiresIn: 30,
    permissions: ["r_feed", "w_member_social"],
    lastSync: "1 hour ago",
  },
  {
    id: "6",
    platform: "Pinterest",
    icon: "📌",
    handle: "alignedbydesign",
    status: "disconnected",
  },
  {
    id: "7",
    platform: "Shopify",
    icon: "🛍️",
    handle: "alignedbydesign.myshopify.com",
    status: "disconnected",
  },
  {
    id: "8",
    platform: "Mailchimp",
    icon: "📧",
    handle: "Email Marketing",
    status: "error",
  },
  {
    id: "9",
    platform: "Blog Posts",
    icon: "📝",
    handle: "WordPress",
    status: "disconnected",
  },
  {
    id: "10",
    platform: "Email",
    icon: "✉️",
    handle: "Email Service",
    status: "disconnected",
  },
];

const availablePlatforms = [
  { name: "Twitter/X", icon: "𝕏" },
  { name: "Bluesky", icon: "☁️" },
  { name: "Threads", icon: "🧵" },
  { name: "Snapchat", icon: "👻" },
];

export default function LinkedAccounts() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [accounts, setAccounts] = useState(linkedAccounts);

  const handleRefreshToken = async (accountId: string) => {
    setRefreshing(accountId);
    try {
      // Simulate token refresh API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? { ...acc, status: "connected", tokenExpiresIn: 60 }
            : acc
        )
      );

      toast({
        title: "Token refreshed",
        description: "Authentication token has been renewed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh token",
        variant: "destructive",
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, status: "disconnected" }
          : acc
      )
    );
    toast({
      title: "Disconnected",
      description: "Account has been disconnected",
    });
  };

  return (    
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60">
                    <Link2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-indigo-950">
                      Linked Accounts
                    </h1>
                    <p className="text-sm text-indigo-600/70 mt-1">
                      Connect, manage, and disconnect your publishing platforms
                    </p>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-lime-400 hover:bg-lime-500 text-indigo-950 font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-lime-400/30">
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>
          </div>

          {/* Expiring Soon Alert */}
          {accounts.some((acc) => acc.status === "expiring") && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900">Tokens expiring soon</h3>
                <p className="text-sm text-amber-800 mt-1">
                  {accounts.filter((acc) => acc.status === "expiring").length} account(s) need authentication renewal to avoid disruption.
                </p>
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          <div className="mb-12">
            <h2 className="text-lg font-black text-indigo-950 mb-4">
              Connected Accounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts
                .filter((acc) => acc.status === "connected" || acc.status === "expiring")
                .map((account) => {
                  const isExpiring = account.status === "expiring";
                  const expiringDays = account.tokenExpiresIn || 0;
                  const isRefreshing = refreshing === account.id;

                  return (
                    <div
                      key={account.id}
                      className={`p-4 backdrop-blur-xl rounded-lg transition-all duration-200 ${
                        isExpiring
                          ? "bg-amber-50/50 border border-amber-200/50 hover:border-amber-300/50"
                          : "bg-white/50 border border-white/60 hover:border-lime-400/50 hover:shadow-lg hover:shadow-lime-400/10"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">{account.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-indigo-950">
                              {account.platform}
                            </h3>
                            <p className="text-sm text-indigo-600/60 mt-0.5">
                              {account.handle}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpiring ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-bold text-amber-600">
                                {expiringDays}d left
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                              <span className="text-xs font-medium text-lime-600">
                                Connected
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Permissions */}
                      {account.permissions && (
                        <div className="mb-3 pb-3 border-b border-white/40">
                          <button
                            onClick={() =>
                              setShowPermissions(
                                showPermissions === account.id ? null : account.id
                              )
                            }
                            className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-2"
                          >
                            <Shield className="w-3 h-3" />
                            {account.permissions.length} permissions
                          </button>
                          {showPermissions === account.id && (
                            <div className="space-y-1">
                              {account.permissions.map((perm) => (
                                <div
                                  key={perm}
                                  className="text-xs bg-indigo-50 px-2 py-1 rounded text-indigo-700"
                                >
                                  {perm}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Info */}
                      <div className="flex items-center justify-between mb-3 text-xs text-indigo-600/50">
                        <span>{account.connectedDate}</span>
                        {account.lastSync && (
                          <span>Synced: {account.lastSync}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {isExpiring && (
                          <button
                            onClick={() => handleRefreshToken(account.id)}
                            disabled={isRefreshing}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="p-1.5 text-indigo-600/60 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-auto"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Disconnected Accounts */}
          {accounts.some((acc) => acc.status === "disconnected") && (
            <div className="mb-12">
              <h2 className="text-lg font-black text-indigo-950 mb-4">
                Disconnected
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts
                  .filter((acc) => acc.status === "disconnected")
                  .map((account) => (
                    <div
                      key={account.id}
                      className="p-4 bg-white/30 backdrop-blur-xl border border-white/40 rounded-lg hover:border-indigo-300/50 transition-all duration-200 opacity-70 hover:opacity-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl opacity-50">{account.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-indigo-950">
                              {account.platform}
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-indigo-400">
                          Not Connected
                        </span>
                      </div>
                      <div className="pt-3 border-t border-white/40">
                        <button className="w-full px-3 py-2 text-sm font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-950 rounded transition-colors">
                          Connect Account
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Error Accounts */}
          {accounts.some((acc) => acc.status === "error") && (
            <div className="mb-12">
              <h2 className="text-lg font-black text-indigo-950 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Connection Issues
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts
                  .filter((acc) => acc.status === "error")
                  .map((account) => (
                    <div
                      key={account.id}
                      className="p-4 bg-red-50/50 backdrop-blur-xl border border-red-200/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">{account.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-indigo-950">
                              {account.platform}
                            </h3>
                            <p className="text-xs text-red-600 mt-1">
                              Authentication expired
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-red-200/30">
                        <button
                          onClick={() => handleRefreshToken(account.id)}
                          disabled={refreshing === account.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-950 rounded transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${refreshing === account.id ? "animate-spin" : ""}`} />
                          {refreshing === account.id ? "Reconnecting..." : "Reconnect"}
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="flex-1 px-3 py-2 text-xs font-semibold bg-white/50 hover:bg-white/70 text-indigo-600 rounded transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Available Platforms */}
          <div>
            <h2 className="text-lg font-black text-indigo-950 mb-4">
              Available Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availablePlatforms.map((platform) => (
                <div
                  key={platform.name}
                  className="p-4 bg-white/50 backdrop-blur-xl border border-white/60 rounded-lg hover:border-lime-400/50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-lime-400/10"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <span className="text-4xl">{platform.icon}</span>
                    <h3 className="font-semibold text-indigo-950">
                      {platform.name}
                    </h3>
                  </div>
                  <button className="w-full mt-4 px-3 py-2 text-sm font-semibold bg-lime-100 hover:bg-lime-200 text-indigo-950 rounded transition-colors">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    
  );
}
