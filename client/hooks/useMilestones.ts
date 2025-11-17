import { useEffect, useState, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { MilestoneKey } from "@/lib/milestones";

interface Milestone {
  id: number;
  workspaceId: string;
  key: MilestoneKey;
  unlockedAt: string;
  acknowledgedAt?: string;
}

export function useMilestones() {
  const [newlyUnlocked, setNewlyUnlocked] = useState<MilestoneKey[]>([]);
  const acknowledgedRef = useRef<Set<string>>(new Set());
  const qc = useQueryClient();

  // Fetch existing milestones
  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["milestones"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/milestones");
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Skip WebSocket in development if not configured
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      console.log(
        "WebSocket URL not configured - milestone updates will be polling-based",
      );
      return;
    }

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(`${wsUrl}/milestones`);

        ws.onmessage = (e) => {
          try {
            const { key } = JSON.parse(e.data);
            if (key && !acknowledgedRef.current.has(key)) {
              setNewlyUnlocked((prev) => [...prev, key]);
              qc.invalidateQueries({ queryKey: ["milestones"] });
            }
          } catch (err) {
            console.error("Failed to parse milestone message:", err);
          }
        };

        ws.onerror = () => {
          console.log("Milestone WebSocket error - will reconnect");
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error("Failed to connect to milestone WebSocket:", err);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [qc]);

  // Acknowledge a milestone (prevent showing again)
  const acknowledgeMilestone = async (key: MilestoneKey) => {
    acknowledgedRef.current.add(key);
    setNewlyUnlocked((prev) => prev.filter((k) => k !== key));

    try {
      await fetch(`/api/milestones/${key}/ack`, { method: "POST" });
      qc.invalidateQueries({ queryKey: ["milestones"] });
    } catch (err) {
      console.error("Failed to acknowledge milestone:", err);
    }
  };

  return {
    newlyUnlocked,
    milestones,
    acknowledgeMilestone,
  };
}
