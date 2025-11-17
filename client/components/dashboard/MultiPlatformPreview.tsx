import { Design } from "@/types/creativeStudio";
import { X } from "lucide-react";
import { useState } from "react";

interface MultiPlatformPreviewProps {
  design: Design;
  onClose: () => void;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  width: number;
  height: number;
  description: string;
  frameClass: string;
  preview: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "instagram-post",
    name: "Instagram Post",
    icon: "📱",
    width: 1080,
    height: 1080,
    description: "Feed Post (Square)",
    frameClass: "border-8 border-slate-400 rounded-2xl",
    preview: "instagram",
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    icon: "📱",
    width: 1080,
    height: 1920,
    description: "Full Screen Story",
    frameClass: "border-8 border-slate-400 rounded-3xl",
    preview: "story",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    width: 1080,
    height: 1920,
    description: "Vertical Video",
    frameClass: "border-8 border-black rounded-3xl",
    preview: "tiktok",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👤",
    width: 1200,
    height: 628,
    description: "Feed Post",
    frameClass: "border-4 border-slate-300 rounded-lg",
    preview: "facebook",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: "𝕏",
    width: 1200,
    height: 675,
    description: "Promoted Tweet",
    frameClass: "border-4 border-slate-300 rounded-lg",
    preview: "twitter",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    width: 1200,
    height: 628,
    description: "Company Post",
    frameClass: "border-4 border-slate-300 rounded-lg",
    preview: "linkedin",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: "📌",
    width: 1000,
    height: 1500,
    description: "Vertical Pin",
    frameClass: "border-4 border-slate-300 rounded-lg",
    preview: "pinterest",
  },
  {
    id: "youtube",
    name: "YouTube Thumbnail",
    icon: "▶️",
    width: 1280,
    height: 720,
    description: "Video Thumbnail",
    frameClass: "border-4 border-slate-300 rounded-lg",
    preview: "youtube",
  },
];

export function MultiPlatformPreview({ design, onClose }: MultiPlatformPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(PLATFORMS[0].id);

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);

  // Render design preview with scaling
  const renderPreview = (platform: Platform) => {
    const scale = Math.min(300 / platform.width, 400 / platform.height);

    return (
      <div
        className={platform.frameClass}
        style={{
          width: platform.width * scale,
          height: platform.height * scale,
          overflow: "hidden",
          backgroundColor: design.backgroundColor || "#ffffff",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: design.width,
            height: design.height,
            backgroundColor: design.backgroundColor,
          }}
        >
          {design.items.map((item) => (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                transform: `rotate(${item.rotation}deg)`,
              }}
            >
              {item.type === "background" && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background:
                      item.backgroundType === "gradient"
                        ? `linear-gradient(${item.gradientAngle || 0}deg, ${item.gradientFrom}, ${item.gradientTo})`
                        : item.backgroundColor,
                  }}
                />
              )}

              {item.type === "text" && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    fontSize: item.fontSize,
                    fontFamily: item.fontFamily,
                    color: item.fontColor,
                    fontWeight: item.fontWeight as any,
                    textAlign: item.textAlign as any,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {item.text}
                </div>
              )}

              {item.type === "image" && item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.imageName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}

              {item.type === "shape" && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: item.fill,
                    border: item.stroke ? `${item.strokeWidth || 2}px solid ${item.stroke}` : "none",
                    borderRadius: item.shapeType === "circle" ? "50%" : "0",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Platform Preview</h2>
            <p className="text-sm text-slate-600 mt-1">
              See how your design looks across different platforms
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Platform Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Select Platform</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedPlatform === platform.id
                      ? "border-lime-400 bg-lime-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{platform.icon}</div>
                  <p className="text-xs font-bold text-slate-700">{platform.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{platform.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedPlatformData && (
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedPlatformData.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedPlatformData.width} × {selectedPlatformData.height}px
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 font-semibold">
                    {selectedPlatformData.preview === "instagram" && "Appears in feed as a square"}
                    {selectedPlatformData.preview === "story" && "Appears as full-screen story"}
                    {selectedPlatformData.preview === "tiktok" && "Appears as vertical video"}
                    {selectedPlatformData.preview === "facebook" && "Appears in news feed"}
                    {selectedPlatformData.preview === "twitter" && "Appears in timeline"}
                    {selectedPlatformData.preview === "linkedin" && "Appears in company feed"}
                    {selectedPlatformData.preview === "pinterest" && "Appears as vertical pin"}
                    {selectedPlatformData.preview === "youtube" && "Video thumbnail"}
                  </p>
                </div>
              </div>

              {/* Preview Canvas */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-8 flex items-center justify-center min-h-96">
                {renderPreview(selectedPlatformData)}
              </div>

              {/* Platform-specific Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">📝 Platform Tips:</p>
                <p className="text-sm text-slate-600">
                  {selectedPlatformData.id === "instagram-post" &&
                    "Instagram displays feed posts as squares. Text and important elements should be centered to avoid being cut off on mobile."}
                  {selectedPlatformData.id === "instagram-story" &&
                    "Stories display full-screen. Keep important content in the center safe zone and avoid placing text near the top/bottom edges."}
                  {selectedPlatformData.id === "tiktok" &&
                    "TikToks are vertical full-screen videos. Ensure text is large and readable, and keep content within the safe area."}
                  {selectedPlatformData.id === "facebook" &&
                    "Facebook displays a 1.2:0.628 ratio in the feed. Images may be cropped if not in the correct aspect ratio."}
                  {selectedPlatformData.id === "twitter" &&
                    "Twitter recommends a 16:9 aspect ratio for images. Text should be large and visible in thumbnail preview."}
                  {selectedPlatformData.id === "linkedin" &&
                    "LinkedIn images display in a 1.2:0.628 ratio. Use professional imagery and clear text for better engagement."}
                  {selectedPlatformData.id === "pinterest" &&
                    "Pinterest favors tall, vertical images (2:3 ratio). Use eye-catching visuals and clear, readable text."}
                  {selectedPlatformData.id === "youtube" &&
                    "Thumbnails appear at 1280×720px but are often viewed at smaller sizes. Make sure text and important elements are clearly visible."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
