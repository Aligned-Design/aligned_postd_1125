import { X } from "lucide-react";
import { Post, PLATFORM_ICONS, PLATFORM_NAMES } from "@/types/post";

interface PostPreviewModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PostPreviewModal({
  post,
  isOpen,
  onClose,
}: PostPreviewModalProps) {
  if (!isOpen || !post) return null;

  const Icon = PLATFORM_ICONS[post.platform] as React.ComponentType<{
    className?: string;
  }>;
  const platformName = PLATFORM_NAMES[post.platform];

  // Different preview layouts based on platform
  const getPreviewContent = () => {
    switch (post.platform) {
      case "linkedin":
        return (
          <div className="bg-white rounded-lg border border-slate-300 overflow-hidden w-full">
            {/* LinkedIn header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Your Company
                      </p>
                      <p className="text-xs text-slate-600">
                        {post.brand || "Company Page"} •{" "}
                        {post.scheduledDate || "Just now"}
                      </p>
                    </div>
                    <button className="text-slate-400 text-lg">•••</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-slate-900 text-sm leading-relaxed">
                {post.title}
              </p>
              <p className="text-slate-700 text-sm leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            {/* Image */}
            <img
              src={`https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=500&h=300&fit=crop`}
              alt="preview"
              className="w-full"
            />

            {/* Engagement */}
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="flex items-center gap-1 text-xs text-slate-600 mb-3">
                <span>👍 123</span>
                <span className="ml-auto">45 comments • 12 shares</span>
              </div>
              <div className="flex gap-0 text-slate-600 text-sm font-semibold">
                <button className="flex-1 py-2 hover:bg-slate-50 transition rounded">
                  👍 Like
                </button>
                <button className="flex-1 py-2 hover:bg-slate-50 transition rounded">
                  💬 Comment
                </button>
                <button className="flex-1 py-2 hover:bg-slate-50 transition rounded">
                  ↗️ Share
                </button>
              </div>
            </div>
          </div>
        );

      case "instagram":
        return (
          <div className="bg-white rounded-lg overflow-hidden border border-slate-300 w-full">
            {/* Instagram header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-orange-400 flex-shrink-0"></div>
                <div>
                  <p className="font-bold text-sm text-slate-900">your_brand</p>
                  <p className="text-xs text-slate-600">Followed</p>
                </div>
              </div>
              <button className="text-slate-400 text-lg">•••</button>
            </div>

            {/* Image */}
            <div className="bg-slate-200 aspect-square overflow-hidden">
              <img
                src={`https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop`}
                alt="preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex justify-between text-2xl mb-3">
                <div className="flex gap-3">
                  <button className="hover:opacity-70 transition">❤️</button>
                  <button className="hover:opacity-70 transition">💬</button>
                  <button className="hover:opacity-70 transition">➤</button>
                </div>
                <button className="hover:opacity-70 transition">🔖</button>
              </div>
              <p className="text-xs text-slate-600 mb-2">1,234 likes</p>
            </div>

            {/* Caption */}
            <div className="px-4 py-3 space-y-2">
              <div>
                <span className="font-bold text-sm text-slate-900">
                  your_brand
                </span>
                <p className="text-sm text-slate-900 inline"> {post.title}</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {post.excerpt}
              </p>
              <button className="text-xs text-slate-500 font-semibold">
                View all 45 comments
              </button>
            </div>
          </div>
        );

      case "twitter":
        return (
          <div className="bg-white w-full border border-slate-200 rounded-2xl overflow-hidden">
            {/* Twitter/X header */}
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex-shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">
                        Your Brand
                      </p>
                      <span className="text-xs text-slate-600">@yourbrand</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {post.scheduledDate || "now"}
                    </p>
                  </div>
                </div>
                <button className="text-slate-400">•••</button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3">
              <p className="text-slate-900 text-base leading-relaxed">
                {post.title}
              </p>
              <p className="text-slate-700 text-base leading-relaxed mt-3">
                {post.excerpt}
              </p>
            </div>

            {/* Image */}
            <div className="mx-4 my-3 rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={`https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&h=300&fit=crop`}
                alt="preview"
                className="w-full"
              />
            </div>

            {/* Engagement metrics */}
            <div className="px-4 py-3 text-xs text-slate-600 border-b border-slate-200">
              <div className="flex gap-4">
                <span>123 Reposts</span>
                <span>45 Quotes</span>
                <span>234 Likes</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 flex justify-between text-slate-600 text-sm font-semibold max-w-xs mx-auto">
              <button className="hover:text-blue-500 flex-1">💬</button>
              <button className="hover:text-blue-500 flex-1">🔄</button>
              <button className="hover:text-red-500 flex-1">❤️</button>
              <button className="hover:text-blue-500 flex-1">📊</button>
            </div>
          </div>
        );

      case "tiktok":
        return (
          <div className="bg-black rounded-lg overflow-hidden w-full aspect-[9/16] flex flex-col relative">
            {/* TikTok video area */}
            <div className="relative flex-1 bg-slate-800 flex items-center justify-center">
              <img
                src={`https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=400&h=600&fit=crop`}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* TikTok bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="flex items-end gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm mb-2">
                    @yourbrand
                  </p>
                  <p className="text-white text-xs line-clamp-2 leading-relaxed">
                    {post.title}
                  </p>
                  <p className="text-slate-200 text-xs line-clamp-2 mt-1">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0 text-center">
                  <div className="text-2xl">❤️</div>
                  <span className="text-xs text-white font-semibold">1.2K</span>
                </div>
              </div>
            </div>

            {/* TikTok side actions */}
            <div className="absolute right-3 bottom-24 flex flex-col gap-4">
              <div className="text-center">
                <div className="text-2xl">❤️</div>
                <p className="text-xs text-white mt-1 font-semibold">1.2K</p>
              </div>
              <div className="text-center">
                <div className="text-2xl">💬</div>
                <p className="text-xs text-white mt-1 font-semibold">234</p>
              </div>
              <div className="text-center">
                <div className="text-2xl">📤</div>
                <p className="text-xs text-white mt-1 font-semibold">456</p>
              </div>
            </div>
          </div>
        );

      case "facebook":
        return (
          <div className="bg-white rounded-lg border border-slate-300 overflow-hidden w-full">
            {/* Facebook header */}
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">
                    {post.brand || "Your Brand"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {post.scheduledDate || "Just now"}
                  </p>
                </div>
                <button className="text-slate-400">•••</button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <p className="text-slate-900 text-sm font-medium">{post.title}</p>
              <p className="text-slate-700 text-sm leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            {/* Image */}
            <img
              src={`https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop`}
              alt="preview"
              className="w-full"
            />

            {/* Engagement */}
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                <span>👍 ❤️ 😊</span>
                <span className="ml-auto">
                  234 reactions • 45 comments • 12 shares
                </span>
              </div>
              <div className="flex gap-0 text-slate-600 text-sm font-semibold">
                <button className="flex-1 py-2 hover:bg-slate-50 transition rounded">
                  👍 Like
                </button>
                <button className="flex-1 py-2 hover:bg-slate-50 transition rounded">
                  💬 Comment
                </button>
                <button className="flex-1 py-2 hover:bg-slate-50 transition rounded">
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        );

      case "youtube":
        return (
          <div className="bg-white rounded-xl overflow-hidden w-full">
            {/* YouTube thumbnail */}
            <div className="bg-black aspect-video flex items-center justify-center relative">
              <img
                src={`https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=600&h=338&fit=crop`}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl">
                  ▶️
                </div>
              </div>
            </div>

            {/* Video info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {post.title}
                </h3>
              </div>

              {/* Channel info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex-shrink-0"></div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      {post.brand || "Your Channel"}
                    </p>
                    <p className="text-xs text-slate-600">1.2M subscribers</p>
                  </div>
                </div>
                <button className="text-red-600 font-bold text-xs px-4 py-1.5 rounded-full border border-red-600 hover:bg-red-50">
                  Subscribe
                </button>
              </div>

              {/* Stats */}
              <div className="text-xs text-slate-600 space-y-1">
                <p>45K views • 2 days ago</p>
                <p className="text-slate-700">{post.excerpt}</p>
              </div>

              {/* Engagement buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100 text-xs font-semibold">
                  👍 234
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100 text-xs font-semibold">
                  👎 5
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-slate-100 text-xs font-semibold">
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        );

      case "pinterest":
        return (
          <div className="bg-white rounded-2xl overflow-hidden w-full border border-slate-200">
            {/* Pin image */}
            <div className="bg-slate-200 aspect-[4/5] flex items-center justify-center relative">
              <img
                src={`https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=500&fit=crop`}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <button className="absolute top-3 right-3 bg-red-600 text-white rounded-full px-4 py-2 font-bold text-sm hover:bg-red-700">
                📌 Save
              </button>
            </div>

            {/* Pin info */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {post.title}
              </h3>
              <p className="text-slate-700 text-xs leading-relaxed">
                {post.excerpt}
              </p>

              {/* Source info */}
              <div className="flex items-center gap-2 border-t border-slate-200 pt-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">
                    {post.brand || "Your Brand"}
                  </p>
                  <p className="text-xs text-slate-600">45 followers</p>
                </div>
              </div>

              {/* Save & Share buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-red-600 text-white py-2 rounded-full font-bold text-sm hover:bg-red-700">
                  📌 Save
                </button>
                <button className="flex-1 border border-slate-300 text-slate-900 py-2 rounded-full font-bold text-sm hover:bg-slate-100">
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-6 rounded-lg space-y-4 w-full">
            <p className="font-bold text-slate-900">{post.title}</p>
            <p className="text-slate-700 text-sm">{post.excerpt}</p>
            <img
              src={`https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop`}
              alt="preview"
              className="w-full rounded-lg"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-200/50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-indigo-600" />}
            <h2 className="text-xl font-black text-slate-900">
              {platformName} Preview
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview content */}
        <div className="p-6 flex justify-center">
          <div className="w-full max-w-md">{getPreviewContent()}</div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200/50 p-6 flex gap-3 justify-between">
          <button className="flex-1 px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold transition-all">
            Edit Post
          </button>
          <button className="flex-1 px-4 py-2 rounded-lg bg-lime-400 hover:bg-lime-500 text-indigo-950 font-bold transition-all">
            Schedule Now
          </button>
        </div>
      </div>
    </div>
  );
}
