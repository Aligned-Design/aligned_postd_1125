/**
 * Hook for managing advisor insights and actions
 * Provides type-safe insight management and execution tracking
 */

import { useState, useCallback } from "react";
import { AdvisorInsight } from "@/components/dashboard/ActionableAdvisor";

export interface UseAdvisorInsightsOptions {
  onInsightExecuted?: (insightId: string) => void;
}

export function useAdvisorInsights(options: UseAdvisorInsightsOptions = {}) {
  const [insights, setInsights] = useState<AdvisorInsight[]>([]);
  const [executing, setExecuting] = useState<string | null>(null);
  const [executed, setExecuted] = useState<Set<string>>(new Set());

  const addInsight = useCallback((insight: AdvisorInsight) => {
    setInsights((prev) => [...prev, insight]);
  }, []);

  const addInsights = useCallback((newInsights: AdvisorInsight[]) => {
    setInsights((prev) => [...prev, ...newInsights]);
  }, []);

  const removeInsight = useCallback((insightId: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  }, []);

  const clearInsights = useCallback(() => {
    setInsights([]);
    setExecuted(new Set());
  }, []);

  const executeInsight = useCallback(
    async (insightId: string) => {
      const insight = insights.find((i) => i.id === insightId);
      if (!insight?.action) return;

      setExecuting(insightId);
      try {
        const result = insight.action.handler();
        if (result instanceof Promise) {
          await result;
        }
        setExecuted((prev) => new Set([...prev, insightId]));
        options.onInsightExecuted?.(insightId);
      } catch (error) {
        console.error("Failed to execute insight:", error);
        throw error;
      } finally {
        setExecuting(null);
      }
    },
    [insights, options]
  );

  return {
    insights,
    executing,
    executed,
    addInsight,
    addInsights,
    removeInsight,
    clearInsights,
    executeInsight,
  };
}

/**
 * Utility function to create common insight types
 */
export const insightFactory = {
  opportunity: (
    id: string,
    title: string,
    description: string,
    action?: AdvisorInsight["action"]
  ): AdvisorInsight => ({
    id,
    type: "opportunity",
    priority: "high",
    title,
    description,
    action,
  }),

  warning: (
    id: string,
    title: string,
    description: string,
    action?: AdvisorInsight["action"]
  ): AdvisorInsight => ({
    id,
    type: "warning",
    priority: "high",
    title,
    description,
    action,
  }),

  suggestion: (
    id: string,
    title: string,
    description: string,
    action?: AdvisorInsight["action"]
  ): AdvisorInsight => ({
    id,
    type: "suggestion",
    priority: "medium",
    title,
    description,
    action,
  }),
};
