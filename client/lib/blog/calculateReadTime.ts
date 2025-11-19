/**
 * calculateReadTime
 * 
 * Calculates estimated reading time for blog content.
 * Assumes average reading speed of 200 words per minute.
 */

export function calculateReadTime(content: string): number {
  // Remove markdown syntax for word count
  const plainText = content
    .replace(/[#*`[\]()]/g, '') // Remove markdown characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  const wordsPerMinute = 200;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  
  // Minimum 1 minute
  return Math.max(1, readTime);
}

