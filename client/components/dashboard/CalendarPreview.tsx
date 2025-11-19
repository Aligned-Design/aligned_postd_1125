/* eslint-disable */
import { Facebook, Twitter, Instagram, Linkedin, Eye, Heart, MessageCircle, Music, Youtube, MapPin } from "lucide-react";

interface UpcomingPost {
  id: string;
  title: string;
  platform: "facebook" | "twitter" | "instagram" | "linkedin" | "tiktok" | "youtube" | "pinterest";
  status: "draft" | "reviewing" | "approved" | "scheduled";
  scheduledDate: string;
  image: string;
  excerpt: string;
  requiresApproval?: boolean;
  engagement?: {
    views: number;
    likes: number;
    comments: number;
  };
}

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music,
  youtube: Youtube,
  pinterest: MapPin,
};

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  reviewing: "bg-yellow-100 text-yellow-700 border-yellow-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  scheduled: "bg-blue-100 text-blue-700 border-blue-300",
};

const STATUS_DOT_COLORS = {
  draft: "bg-gray-400",
  reviewing: "bg-yellow-500",
  approved: "bg-green-500",
  scheduled: "bg-blue-500",
};

export function CalendarPreview() {
  const upcomingPosts: UpcomingPost[] = [
    {
      id: "1",
      title: "Introducing New Features",
      platform: "linkedin",
      status: "scheduled",
      scheduledDate: "Nov 18, 9:00 AM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "We're excited to announce our latest product updates that will help you streamline your workflow...",
      requiresApproval: false,
    },
    {
      id: "2",
      title: "Behind the Scenes",
      platform: "instagram",
      status: "scheduled",
      scheduledDate: "Nov 18, 2:30 PM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "Get a sneak peek into how our team creates amazing content for your brand...",
      requiresApproval: false,
    },
    {
      id: "3",
      title: "Quick Tips & Tricks",
      platform: "twitter",
      status: "approved",
      scheduledDate: "Nov 18, 10:00 AM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "Here are three quick ways to boost your engagement this week...",
      requiresApproval: false,
    },
    {
      id: "4",
      title: "Customer Success Story",
      platform: "facebook",
      status: "reviewing",
      scheduledDate: "Nov 19, 11:00 AM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "See how our customers are achieving their goals and transforming their business...",
      requiresApproval: true,
    },
    {
      id: "5",
      title: "Weekly Newsletter",
      platform: "linkedin",
      status: "draft",
      scheduledDate: "Nov 19, 8:00 AM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "This week's must-read insights and industry trends you shouldn't miss...",
      requiresApproval: true,
    },
    {
      id: "6",
      title: "Trending Sounds Challenge",
      platform: "tiktok",
      status: "scheduled",
      scheduledDate: "Nov 19, 3:00 PM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "Join the latest trend and show your creative side with our music challenge...",
      requiresApproval: false,
    },
    {
      id: "7",
      title: "Product Demo Video",
      platform: "youtube",
      status: "approved",
      scheduledDate: "Nov 20, 1:00 PM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "In-depth walkthrough of our latest features and how they save you time...",
      requiresApproval: false,
    },
    {
      id: "8",
      title: "Beautiful Design Inspiration",
      platform: "pinterest",
      status: "scheduled",
      scheduledDate: "Nov 20, 4:00 PM",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
      excerpt: "Curated collection of design inspiration and creative ideas for your next project...",
      requiresApproval: false,
    },
  ];

  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/60 hover:bg-white/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-blue-50/10 to-transparent rounded-2xl -z-10"></div>

      <h3 className="relative text-lg font-black text-slate-900 mb-6">Upcoming Content</h3>

      <div className="relative space-y-3">
        {upcomingPosts.map((post) => {
          const PlatformIcon = PLATFORM_ICONS[post.platform];
          return (
            <div
              key={post.id}
              className="group rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50/20 to-blue-50/10 hover:from-indigo-100/30 hover:to-blue-100/20 border border-indigo-200/20 hover:border-indigo-300/50 transition-all duration-300 cursor-pointer hover:shadow-md"
            >
              <div className="p-3 sm:p-4 flex gap-3 sm:gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-16 sm:w-24 h-16 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className={`absolute inset-0 ${STATUS_COLORS[post.status]} bg-opacity-20 backdrop-blur-sm flex items-center justify-center`}>
                      <div className={`w-3 h-3 rounded-full ${STATUS_DOT_COLORS[post.status]}`}></div>
                    </div>
                    {post.requiresApproval && (
                      <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse"></div>
                    )}
                  </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors duration-300">
                        {post.title}
                      </h4>
                      <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[post.status]}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-2">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs text-slate-600 font-medium">{post.scheduledDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
