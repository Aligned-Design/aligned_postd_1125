/**
 * ActionableAdvisor - Base component for Advisor panels with executable insights
 * Provides consistent insight rendering with action buttons
 * WCAG 2.1 Level AA compliant with ARIA labels and keyboard navigation
 */

import { Sparkles, ChevronRight, CheckCircle } from "lucide-react";
import { useState } from "react";

export interface AdvisorInsight {
  id: string;
  type: "opportunity" | "warning" | "suggestion";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: {
    label: string;
    handler: () => void | Promise<void>;
    icon?: React.ReactNode;
  };
  metadata?: Record<string, unknown>;
}

interface ActionableAdvisorProps {
  title: string;
  subtitle?: string;
  insights: AdvisorInsight[];
  onInsightExecuted?: (insightId: string) => void;
  emptyState?: React.ReactNode;
  ariaLabelledBy?: string;
}

export function ActionableAdvisor({
  title,
  subtitle = "Insights and recommendations",
  insights,
  onInsightExecuted,
  emptyState,
  ariaLabelledBy,
}: ActionableAdvisorProps) {
  const [executing, setExecuting] = useState<string | null>(null);
  const [executed, setExecuted] = useState<Set<string>>(new Set());
  const advisorId = `advisor-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const handleAction = async (insight: AdvisorInsight) => {
    if (!insight.action) return;

    setExecuting(insight.id);
    try {
      const result = insight.action.handler();
      if (result instanceof Promise) {
        await result;
      }
      setExecuted((prev) => new Set([...prev, insight.id]));
      onInsightExecuted?.(insight.id);
    } catch (error) {
      console.error("Failed to execute insight action:", error);
    } finally {
      setExecuting(null);
    }
  };

  const getTypeStyles = (type: AdvisorInsight["type"]) => {
    switch (type) {
      case "opportunity":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          badge: "bg-emerald-100 text-emerald-700",
          icon: "🎯",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          badge: "bg-amber-100 text-amber-700",
          icon: "⚠️",
        };
      case "suggestion":
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          badge: "bg-blue-100 text-blue-700",
          icon: "💡",
        };
    }
  };

  const getPriorityBorder = (priority: AdvisorInsight["priority"]) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-orange-500";
      case "low":
      default:
        return "border-l-4 border-l-blue-500";
    }
  };

  return (
    <section
      id={advisorId}
      className="bg-white/50 backdrop-blur-xl rounded-xl border border-indigo-200/50 p-6"
      role="region"
      aria-label={title}
      aria-describedby={ariaLabelledBy}
    >
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-indigo-200/40">
        <div
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-300/40 to-blue-300/30 backdrop-blur flex items-center justify-center border border-indigo-300/50"
          aria-hidden="true"
        >
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 font-medium">{subtitle}</p>
        </div>
      </div>

      {insights.length === 0 ? (
        emptyState || (
          <div className="text-center py-6">
            <p className="text-slate-600 text-sm">No insights available</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const styles = getTypeStyles(insight.type);
            const isExecuting = executing === insight.id;
            const wasExecuted = executed.has(insight.id);

            return (
              <div
                key={insight.id}
                className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${getPriorityBorder(
                  insight.priority
                )} transition-all duration-200 ${
                  wasExecuted ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-lg">{styles.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-slate-700 mt-1">
                      {insight.description}
                    </p>
                  </div>
                  {wasExecuted && (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                </div>

                {insight.action && (
                  <button
                    onClick={() => handleAction(insight)}
                    disabled={isExecuting || wasExecuted}
                    aria-busy={isExecuting}
                    aria-label={`${insight.action.label} - ${insight.title}`}
                    aria-describedby={`insight-${insight.id}-description`}
                    className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded text-xs font-bold transition-all ${
                      wasExecuted
                        ? "bg-white/50 text-slate-600 cursor-default"
                        : `${styles.badge} hover:brightness-90 active:scale-95`
                    } disabled:opacity-50`}
                  >
                    <span className="flex items-center gap-2">
                      {insight.action.icon}
                      {isExecuting ? "Executing..." : insight.action.label}
                    </span>
                    {!isExecuting && !wasExecuted && (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
