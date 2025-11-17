import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  AlertTriangle,
  CheckCircle,
  X,
  Monitor,
  Smartphone,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  charLimit: number;
  aspectRatio: string;
  deviceType: "mobile" | "desktop";
  supportedFormats: string[];
}

interface PlatformSpecificPreviewProps {
  open: boolean;
  onClose: () => void;
  content: {
    caption: string;
    hashtags: string[];
    mediaType?: "image" | "video" | "carousel";
    mediaUrl?: string;
  };
  platforms: string[];
  onConfirmPublish?: (platforms: string[]) => void;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    charLimit: 2200,
    aspectRatio: "1:1 / 4:5 / 16:9",
    deviceType: "mobile",
    supportedFormats: ["image", "video", "carousel"],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    charLimit: 3000,
    aspectRatio: "16:9",
    deviceType: "desktop",
    supportedFormats: ["image", "video", "document"],
  },
  twitter: {
    id: "twitter",
    name: "Twitter/X",
    icon: <Twitter className="w-5 h-5" />,
    charLimit: 280,
    aspectRatio: "16:9 / 1:1",
    deviceType: "mobile",
    supportedFormats: ["image", "video", "gif"],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    charLimit: 63206,
    aspectRatio: "16:9 / 1:1",
    deviceType: "desktop",
    supportedFormats: ["image", "video", "carousel"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="w-5 h-5" />,
    charLimit: 5000,
    aspectRatio: "16:9",
    deviceType: "desktop",
    supportedFormats: ["video"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: <div className="text-sm">🎵</div>,
    charLimit: 150,
    aspectRatio: "9:16",
    deviceType: "mobile",
    supportedFormats: ["video"],
  },
};

export function PlatformSpecificPreview({
  open,
  onClose,
  content,
  platforms,
  onConfirmPublish,
}: PlatformSpecificPreviewProps) {
  const [activeTab, setActiveTab] = useState(platforms[0] || "instagram");
  const [copied, setCopied] = useState(false);

  const activePlatform = PLATFORM_CONFIGS[activeTab];
  const fullText = `${content.caption}\n\n${content.hashtags.join(" ")}`;
  const charCount = fullText.length;
  const isOverLimit = charCount > (activePlatform?.charLimit || 0);

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCompatibilityStatus = (platformId: string) => {
    const platform = PLATFORM_CONFIGS[platformId];
    const mediaType = content.mediaType || "image";

    if (!platform.supportedFormats.includes(mediaType)) {
      return {
        compatible: false,
        message: `${platform.name} doesn't support ${mediaType} format`,
      };
    }

    if (fullText.length > platform.charLimit) {
      return {
        compatible: false,
        message: `Caption exceeds ${platform.name} character limit (${platform.charLimit})`,
      };
    }

    return {
      compatible: true,
      message: `Compatible with ${platform.name}`,
    };
  };

  const renderDeviceMockup = () => {
    if (!activePlatform) return null;

    if (activePlatform.deviceType === "mobile") {
      return (
        <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Phone Frame */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
            {/* Phone Status Bar */}
            <div className="h-8 bg-slate-100 flex items-center justify-between px-6 text-xs">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-slate-400 rounded-sm"></div>
                <div className="w-4 h-4 bg-slate-400 rounded-sm"></div>
                <div className="w-4 h-4 bg-slate-400 rounded-sm"></div>
              </div>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto h-[calc(100%-2rem)]">
              {/* Post Header */}
              <div className="flex items-center gap-2 p-3 border-b">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
                <div>
                  <p className="text-xs font-bold">Your Brand</p>
                  <p className="text-[10px] text-slate-500">Just now</p>
                </div>
              </div>

              {/* Media Preview */}
              {content.mediaUrl ? (
                <div
                  className={`w-full ${
                    activePlatform.id === "tiktok"
                      ? "aspect-[9/16]"
                      : "aspect-square"
                  } bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center`}
                >
                  <img
                    src={content.mediaUrl}
                    alt="Post preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-full ${
                    activePlatform.id === "tiktok"
                      ? "aspect-[9/16]"
                      : "aspect-square"
                  } bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center`}
                >
                  <p className="text-xs text-slate-400">Image Preview</p>
                </div>
              )}

              {/* Caption */}
              <div className="p-3">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  <span className="font-bold">Your Brand</span>{" "}
                  {content.caption}
                </p>

                {/* Hashtags */}
                {content.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {content.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-blue-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Platform-specific elements */}
                {activePlatform.id === "instagram" && (
                  <div className="mt-3 text-[10px] text-slate-400">
                    View all comments (0)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      );
    }

    // Desktop Layout
    return (
      <div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {/* Browser Bar */}
        <div className="h-10 bg-slate-100 border-b flex items-center gap-2 px-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-slate-600">
            {activePlatform.name.toLowerCase()}.com
          </div>
        </div>

        {/* Feed Post */}
        <div className="p-6">
          {/* Post Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full"></div>
            <div>
              <p className="text-sm font-bold">Your Brand</p>
              <p className="text-xs text-slate-500">Just now • 🌎</p>
            </div>
          </div>

          {/* Caption */}
          <div className="mb-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content.caption}
            </p>

            {/* Hashtags */}
            {content.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {content.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media */}
          {content.mediaUrl ? (
            <img
              src={content.mediaUrl}
              alt="Post preview"
              className="w-full rounded-lg"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
              <p className="text-sm text-slate-400">Media Preview</p>
            </div>
          )}

          {/* Engagement Bar */}
          <div className="mt-4 pt-3 border-t flex items-center gap-4 text-xs text-slate-600">
            <button className="hover:text-blue-600">👍 Like</button>
            <button className="hover:text-blue-600">💬 Comment</button>
            <button className="hover:text-blue-600">↗️ Share</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Monitor className="w-6 h-6" />
                Platform Preview
              </DialogTitle>
              <DialogDescription className="mt-1">
                See how your post will look on each platform before publishing
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {platforms.map((platformId) => {
                const platform = PLATFORM_CONFIGS[platformId];
                const status = getCompatibilityStatus(platformId);

                return (
                  <TabsTrigger
                    key={platformId}
                    value={platformId}
                    className="flex items-center gap-2"
                  >
                    {platform?.icon}
                    <span className="hidden md:inline">{platform?.name}</span>
                    {!status.compatible && (
                      <AlertTriangle className="w-3 h-3 text-red-500 ml-auto" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {platforms.map((platformId) => (
              <TabsContent
                key={platformId}
                value={platformId}
                className="space-y-6"
              >
                {/* Compatibility Warning */}
                {(() => {
                  const status = getCompatibilityStatus(platformId);
                  if (!status.compatible) {
                    return (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-red-900 mb-1">
                              ⚠️ Compatibility Issue
                            </p>
                            <p className="text-sm text-red-800">
                              {status.message}
                            </p>
                            <p className="text-xs text-red-700 mt-2">
                              This post will be skipped when publishing to{" "}
                              {activePlatform?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Preview Area */}
                <div className="bg-slate-50 rounded-xl p-6">
                  {renderDeviceMockup()}
                </div>

                {/* Platform Details */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {activePlatform?.deviceType === "mobile" ? (
                            <Smartphone className="w-4 h-4 text-slate-600" />
                          ) : (
                            <Monitor className="w-4 h-4 text-slate-600" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {activePlatform?.deviceType} View
                          </span>
                        </div>
                        <Badge
                          variant={isOverLimit ? "destructive" : "secondary"}
                        >
                          {charCount} / {activePlatform?.charLimit} chars
                        </Badge>
                      </div>

                      {/* Character Counter */}
                      {isOverLimit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">
                            ⚠️ Your caption exceeds the character limit by{" "}
                            <strong>
                              {charCount - (activePlatform?.charLimit || 0)}
                            </strong>{" "}
                            characters.
                            {activePlatform?.name} will truncate your post.
                          </p>
                        </div>
                      )}

                      {/* Format Info */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-600 mb-1">
                            Supported Formats
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {activePlatform?.supportedFormats.map((format) => (
                              <Badge
                                key={format}
                                variant="outline"
                                className="text-xs"
                              >
                                {format}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 mb-1">
                            Aspect Ratio
                          </p>
                          <p className="text-sm font-medium">
                            {activePlatform?.aspectRatio}
                          </p>
                        </div>
                      </div>

                      {/* Copy Text Button */}
                      <Button
                        variant="outline"
                        onClick={handleCopyText}
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? "Copied!" : "Copy Full Text"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Publish Button */}
          {onConfirmPublish && (
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const compatiblePlatforms = platforms.filter(
                    (p) => getCompatibilityStatus(p).compatible,
                  );
                  onConfirmPublish(compatiblePlatforms);
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Publish to{" "}
                {
                  platforms.filter((p) => getCompatibilityStatus(p).compatible)
                    .length
                }{" "}
                Platform(s)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
