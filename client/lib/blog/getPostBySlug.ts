/**
 * getPostBySlug
 * 
 * Fetches a single blog post by its slug.
 */

import { BlogPost } from "./getBlogPosts";
import { getBlogPosts } from "./getBlogPosts";

/**
 * Get a blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getBlogPosts();
  return posts.find(post => post.slug === slug) || null;
}

/**
 * Get related posts (same category, excluding current post)
 */
export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return [];
  
  const posts = getBlogPosts(currentPost.category);
  return posts
    .filter(post => post.slug !== currentSlug)
    .slice(0, limit);
}

