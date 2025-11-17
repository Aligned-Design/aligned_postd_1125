/**
 * Global "New Post" / "Create Content" Button
 * 
 * Consistent button component for creating new content across all content-centric pages.
 * Routes to Creative Studio entry screen.
 */

import { Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system";

interface NewPostButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function NewPostButton({
  variant = "default",
  size = "md",
  className,
  showIcon = true,
  label = "New Post",
}: NewPostButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/studio");
  };

  const sizeClasses = {
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-5 text-sm",
    lg: "h-11 px-6 text-base",
  } as const;

  return (
            <Button
              onClick={handleClick}
              variant={variant}
              size={size === "md" ? "default" : size === "sm" ? "sm" : "lg"}
              className={cn(
                variant === "default" && [
                  "bg-[var(--color-lime-400)]",
                  "hover:bg-[var(--color-lime-600)]",
                  "!text-black font-semibold shadow-md", /* Black text for best contrast on bright lime */
                  "rounded-lg", /* Rounded rectangle */
                  sizeClasses[size],
                  "inline-flex items-center gap-2 whitespace-nowrap",
                ],
        className
      )}
      aria-label={label || "Create new content"}
    >
      {showIcon && (
        <Plus className={cn(
          size === "sm" && "w-4 h-4",
          size === "md" && "w-4 h-4",
          size === "lg" && "w-5 h-5"
        )} />
      )}
      <span>{label}</span>
    </Button>
  );
}

/**
 * Floating "New Post" button for mobile/sticky positioning
 */
export function FloatingNewPostButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/studio")}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-14 h-14 rounded-lg", /* Rounded rectangle for mobile floating button */
        "bg-[var(--color-lime-400)]",
        "hover:bg-[var(--color-lime-600)]",
        "text-black shadow-lg", /* Black text for best contrast */
        "flex items-center justify-center",
        "transition-all hover:scale-110",
        "md:hidden", // Only show on mobile
        className
      )}
      aria-label="Create new post"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}

