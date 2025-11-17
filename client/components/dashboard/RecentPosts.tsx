import { MoreVertical, CheckCircle2, Clock, Eye } from "lucide-react";

interface Post {
  id: string;
  caption: string;
  thumbnail: string;
  platform: string;
  status: "published" | "scheduled" | "reviewing";
  scheduledDate: string;
  metrics?: { reach: number; engagement: number };
}

const STATUS_STYLES = {
  published: { bg: "bg-green-50", text: "text-green-700", icon: CheckCircle2 },
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", icon: Clock },
  reviewing: { bg: "bg-yellow-50", text: "text-yellow-700", icon: Eye },
};

export function RecentPosts() {
  const posts: Post[] = [
    {
      id: "1",
      caption: "Excited to announce our new product feature!",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
      platform: "Instagram",
      status: "published",
      scheduledDate: "Nov 22, 9:00 AM",
      metrics: { reach: 12400, engagement: 234 },
    },
    {
      id: "2",
      caption: "Behind the scenes at our studio...",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
      platform: "LinkedIn",
      status: "scheduled",
      scheduledDate: "Nov 24, 10:30 AM",
    },
    {
      id: "3",
      caption: "Your feedback shapes our future →",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
      platform: "Twitter",
      status: "reviewing",
      scheduledDate: "Nov 25, 2:00 PM",
    },
    {
      id: "4",
      caption: "New blog post live: Growth strategies for 2025",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
      platform: "Facebook",
      status: "published",
      scheduledDate: "Nov 21, 8:00 AM",
      metrics: { reach: 8900, engagement: 156 },
    },
  ];

  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/60 hover:bg-white/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-blue-50/10 to-transparent rounded-2xl -z-10"></div>

      <div className="relative flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900">Recent Posts</h3>
        <button className="text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors duration-200">
          View All →
        </button>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-indigo-200/30">
              <th className="text-left py-3 px-4 font-black text-slate-900 text-sm uppercase tracking-wide">Post</th>
              <th className="text-left py-3 px-4 font-black text-slate-900 text-sm uppercase tracking-wide">Platform</th>
              <th className="text-left py-3 px-4 font-black text-slate-900 text-sm uppercase tracking-wide">Status</th>
              <th className="text-left py-3 px-4 font-black text-slate-900 text-sm uppercase tracking-wide">Scheduled</th>
              <th className="text-left py-3 px-4 font-black text-slate-900 text-sm uppercase tracking-wide">Performance</th>
              <th className="text-center py-3 px-4 font-black text-slate-900 text-sm uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const statusStyle = STATUS_STYLES[post.status];
              const StatusIcon = statusStyle.icon;
              return (
                <tr key={post.id} className="border-b border-indigo-200/20 hover:bg-indigo-50/30 transition-all duration-300 group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.thumbnail}
                        alt="Post thumbnail"
                        className="w-10 h-10 rounded-lg object-cover group-hover:ring-2 ring-indigo-400/50 transition-all duration-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {post.caption}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-700">{post.platform}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur ${statusStyle.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
                      <span className={`text-xs font-bold ${statusStyle.text}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-700">{post.scheduledDate}</span>
                  </td>
                  <td className="py-4 px-4">
                    {post.metrics ? (
                      <div className="text-sm">
                        <p className="font-black text-slate-900">{post.metrics.reach.toLocaleString()}</p>
                        <p className="text-slate-600 text-xs font-medium">{post.metrics.engagement} engagements</p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button className="p-2 hover:bg-indigo-100/50 rounded-lg transition-all duration-300 hover:scale-110">
                      <MoreVertical className="w-4 h-4 text-indigo-600" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
