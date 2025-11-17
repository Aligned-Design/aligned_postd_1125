/**
 * renderMarkdown
 * 
 * Simple markdown renderer for blog content.
 * Converts basic markdown syntax to HTML.
 * For production, consider using a library like react-markdown or marked.
 */

export function renderMarkdown(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-black text-slate-900 mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-slate-900 mt-8 mb-4">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-700 underline font-semibold">$1</a>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li class="mb-1">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="mb-1">$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li class="mb-1">$2</li>');

  // Wrap consecutive list items in ul
  html = html.replace(/(<li class="mb-1">.*<\/li>\n?)+/g, (match) => {
    return `<ul class="list-disc list-inside mb-4 space-y-2 text-slate-700">${match}</ul>`;
  });

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.trim()) return '';
    if (para.startsWith('<')) return para; // Already HTML
    return `<p class="text-slate-700 mb-4 leading-relaxed">${para}</p>`;
  }).join('\n');

  // Code blocks (simple)
  html = html.replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-slate-100 rounded text-sm font-mono text-slate-900">$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-4 italic text-slate-600 my-4">$1</blockquote>');

  return html;
}

