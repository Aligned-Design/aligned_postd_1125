import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { cn } from "@/lib/design-system";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toaster Component
 *
 * Toast notification system that consumes design tokens for:
 * - Background color (--color-surface)
 * - Text color (--color-foreground)
 * - Border color (--color-border)
 * - Shadow (--shadow-lg)
 * - Theme-aware dark mode support
 *
 * Usage:
 * import { toast } from "sonner";
 * toast.success("Success message");
 * toast.error("Error message");
 * toast.loading("Loading...");
 */

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          /* Toast container */
          toast: cn(
            "group toast group-[.toaster]:bg-[var(--color-surface)]",
            "group-[.toaster]:text-[var(--color-foreground)]",
            "group-[.toaster]:border group-[.toaster]:border-[var(--color-border)]",
            "group-[.toaster]:shadow-[var(--shadow-lg)]",
            "group-[.toaster]:rounded-[var(--radius-lg)]",
            "group-[.toaster]:px-[var(--spacing-md)] group-[.toaster]:py-[var(--spacing-md)]",
            "dark:group-[.toaster]:bg-[var(--color-dark-surface)]",
            "dark:group-[.toaster]:text-[var(--color-dark-foreground)]",
            "dark:group-[.toaster]:border-[var(--color-slate-600)]",
          ),

          /* Description text */
          description:
            "group-[.toast]:text-[var(--color-muted)] dark:group-[.toast]:text-[var(--color-slate-400)]",

          /* Action button */
          actionButton: cn(
            "group-[.toast]:bg-[var(--color-primary)] group-[.toast]:text-white",
            "group-[.toast]:rounded-[var(--radius-md)]",
            "group-[.toast]:px-[var(--spacing-sm)] group-[.toast]:py-[var(--spacing-xs)]",
            "group-[.toast]:font-[var(--font-weight-semibold)]",
            "group-[.toast]:text-[var(--font-size-body-sm)]",
            "hover:group-[.toast]:bg-[var(--color-primary-light)]",
            "transition-colors duration-[var(--animation-duration-quick)]",
          ),

          /* Cancel button */
          cancelButton: cn(
            "group-[.toast]:bg-[var(--color-border)] group-[.toast]:text-[var(--color-foreground)]",
            "group-[.toast]:rounded-[var(--radius-md)]",
            "group-[.toast]:px-[var(--spacing-sm)] group-[.toast]:py-[var(--spacing-xs)]",
            "group-[.toast]:font-[var(--font-weight-semibold)]",
            "group-[.toast]:text-[var(--font-size-body-sm)]",
            "hover:group-[.toast]:bg-[var(--color-gray-300)]",
            "dark:group-[.toast]:bg-[var(--color-slate-600)] dark:group-[.toast]:text-[var(--color-dark-foreground)] dark:hover:group-[.toast]:bg-[var(--color-slate-500)]",
            "transition-colors duration-[var(--animation-duration-quick)]",
          ),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
