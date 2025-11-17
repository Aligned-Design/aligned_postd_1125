/**
 * Individual Blog Post Page
 * 
 * Displays a full blog post with SEO meta tags, share buttons, and related posts.
 */

import { useParams, Link } from "react-router-dom";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog/getPostBySlug";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Calendar, Clock, User, ArrowLeft, Twitter, Linkedin, Share2 } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useEffect, useState } from "react";
import { renderMarkdown } from "@/lib/blog/renderMarkdown";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState(getPostBySlug(slug || ""));
  const [relatedPosts, setRelatedPosts] = useState(getRelatedPosts(slug || "", 3));

  useEffect(() => {
    if (slug) {
      const foundPost = getPostBySlug(slug);
      setPost(foundPost);
      if (foundPost) {
        setRelatedPosts(getRelatedPosts(slug, 3));
      }
    }
  }, [slug]);

  if (!post) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Post Not Found</h1>
          <p className="text-slate-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </PageShell>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = encodeURIComponent(post.title);
  const shareText = encodeURIComponent(post.excerpt);

  const handleShare = (platform: "twitter" | "linkedin") => {
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "width=550,height=420"
      );
    } else if (platform === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        "_blank",
        "width=550,height=420"
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead post={post} />

      <PageShell>
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold">Back to Blog</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* Category */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              {post.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author.name}</span>
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 bg-slate-100">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Share Buttons */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-700">Share:</span>
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
                <span className="text-sm font-semibold">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
                <span className="text-sm font-semibold">LinkedIn</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Copy link"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Copy Link</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <SectionCard className="prose prose-slate max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
            />
          </SectionCard>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    to={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <SectionCard className="h-full hover:shadow-lg transition-all">
                      {relatedPost.featuredImage && (
                        <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 bg-slate-100">
                          <img
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </SectionCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}

/**
 * SEO Head Component
 * Adds meta tags, OpenGraph, Twitter Cards, and JSON-LD schema
 */
function SEOHead({ post }: { post: any }) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.featuredImage ? `${siteUrl}${post.featuredImage}` : `${siteUrl}/og-default.jpg`;

  return (
    <>
      {/* Basic Meta Tags */}
      <meta name="title" content={post.title} />
      <meta name="description" content={post.excerpt} />
      <meta name="keywords" content={post.keywords.join(", ")} />
      <meta name="author" content={post.author.name} />

      {/* OpenGraph Tags */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={postUrl} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Postd" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={postUrl} />
      <meta name="twitter:title" content={post.title} />
      <meta name="twitter:description" content={post.excerpt} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Article Meta */}
      <meta property="article:published_time" content={new Date(post.date).toISOString()} />
      <meta property="article:author" content={post.author.name} />
      <meta property="article:section" content={post.category} />
      {post.keywords.map((keyword: string) => (
        <meta key={keyword} property="article:tag" content={keyword} />
      ))}

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            image: imageUrl,
            datePublished: new Date(post.date).toISOString(),
            dateModified: new Date(post.date).toISOString(),
            author: {
              "@type": "Person",
              name: post.author.name,
            },
            publisher: {
              "@type": "Organization",
              name: "Postd",
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/logo.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": postUrl,
            },
          }),
        }}
      />
    </>
  );
}

