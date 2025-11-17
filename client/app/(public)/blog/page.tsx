/**
 * Blog Index Page
 * 
 * Displays all blog posts in a card layout.
 * Supports category filtering and search (future).
 */

import { getBlogPosts, getBlogCategories, type BlogPost } from "@/lib/blog/getBlogPosts";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Link } from "react-router-dom";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useState } from "react";

export default function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = getBlogCategories();
  const posts = getBlogPosts(selectedCategory || undefined);

  return (
    <PageShell>
      <PageHeader
        title="Blog"
        subtitle="Insights, tips, and guides to help you create better content"
      />

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                selectedCategory === null
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              All Posts
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  selectedCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No posts found in this category.</p>
        </div>
      )}
    </PageShell>
  );
}

interface BlogPostCardProps {
  post: BlogPost;
}

function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link to={`/blog/${post.slug}`} className="group">
      <SectionCard className="h-full hover:shadow-lg transition-all">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 bg-slate-100">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{post.readTime} min read</span>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          {post.author.avatar && (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <User className="w-4 h-4" />
            <span>{post.author.name}</span>
          </div>
        </div>

        {/* Read More */}
        <div className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
          Read more
          <ArrowRight className="w-4 h-4" />
        </div>
      </SectionCard>
    </Link>
  );
}

