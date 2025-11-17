interface PostCounterPillProps {
  publishedCount: number;
  maxPosts?: number;
}

export function PostCounterPill({
  publishedCount,
  maxPosts = 2,
}: PostCounterPillProps) {
  const isAtLimit = publishedCount >= maxPosts;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${
        isAtLimit
          ? "bg-red-100 text-red-800 border border-red-300"
          : "bg-lime-100 text-lime-800 border border-lime-300"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isAtLimit ? "bg-red-600" : "bg-lime-600"
          }`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isAtLimit ? "bg-red-600" : "bg-lime-600"
          }`}
        ></span>
      </span>
      Posts used {publishedCount}/{maxPosts}
    </div>
  );
}
