import React, { createContext, useContext, useState, useEffect } from "react";

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Contributor" | "Viewer";
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  timezone?: string;
  createdBy?: string;
  createdAt?: string;
  members: WorkspaceMember[];
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  currentWorkspace: Workspace | undefined;
  setCurrentWorkspaceId: (id: string) => void;
  createWorkspace: (workspace: Omit<Workspace, "id" | "members">) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  addMember: (workspaceId: string, member: WorkspaceMember) => void;
  updateMember: (workspaceId: string, memberId: string, updates: Partial<WorkspaceMember>) => void;
  removeMember: (workspaceId: string, memberId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// ✅ REMOVED: Sample/demo brands (ABD Events, Aligned Aesthetics, Indie Investing)
// These should only be used as fallback when no real workspaces exist
// In production, workspaces should be loaded from Supabase
const INITIAL_WORKSPACES: Workspace[] = [];

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  // Load from localStorage using initial state function to avoid setState in effect
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const savedWorkspaces = localStorage.getItem("Aligned:workspaces");
    if (savedWorkspaces) {
      try {
        return JSON.parse(savedWorkspaces);
      } catch (e) {
        console.error("Failed to parse saved workspaces", e);
      }
    }
    return INITIAL_WORKSPACES;
  });
  
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string>(() => {
    const saved = localStorage.getItem("Aligned:lastWorkspaceId");
    if (saved && INITIAL_WORKSPACES.some((w) => w.id === saved)) {
      return saved;
    }
    return "ws-abd";
  });
  
  const [isHydrated] = useState(true); // Always hydrated when using initial state

  // Persist to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("Aligned:lastWorkspaceId", currentWorkspaceId);
      localStorage.setItem("Aligned:workspaces", JSON.stringify(workspaces));
    }
  }, [workspaces, currentWorkspaceId, isHydrated]);

  const setCurrentWorkspaceId = (id: string) => {
    if (workspaces.some((w) => w.id === id)) {
      setCurrentWorkspaceIdState(id);
    }
  };

  const createWorkspace = (workspace: Omit<Workspace, "id" | "members">) => {
    const newId = `ws-${Date.now()}`;
    const newWorkspace: Workspace = {
      ...workspace,
      id: newId,
      members: [
        {
          id: "u1",
          name: "Lauren",
          email: "lauren@aligned.com",
          role: "Admin",
          avatar: "👩‍💼",
        },
      ],
    };
    setWorkspaces([...workspaces, newWorkspace]);
    setCurrentWorkspaceId(newId);
  };

  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === id ? { ...w, ...updates, id: w.id, members: w.members } : w
      )
    );
  };

  const deleteWorkspace = (id: string) => {
    const remaining = workspaces.filter((w) => w.id !== id);
    setWorkspaces(remaining);
    if (currentWorkspaceId === id && remaining.length > 0) {
      setCurrentWorkspaceId(remaining[0].id);
    }
  };

  const addMember = (workspaceId: string, member: WorkspaceMember) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, members: [...w.members, member] }
          : w
      )
    );
  };

  const updateMember = (
    workspaceId: string,
    memberId: string,
    updates: Partial<WorkspaceMember>
  ) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              members: w.members.map((m) =>
                m.id === memberId ? { ...m, ...updates } : m
              ),
            }
          : w
      )
    );
  };

  const removeMember = (workspaceId: string, memberId: string) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, members: w.members.filter((m) => m.id !== memberId) }
          : w
      )
    );
  };

  // Auto-select first workspace if currentWorkspaceId is invalid or workspace not found
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);
  const effectiveWorkspace = currentWorkspace || (workspaces.length > 0 ? workspaces[0] : undefined);
  const effectiveWorkspaceId = effectiveWorkspace?.id || currentWorkspaceId;

  // Auto-select first workspace if current is missing (silent, no error)
   
  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      if (firstWorkspace && firstWorkspace.id !== currentWorkspaceId) {
        console.log("[WorkspaceContext] Auto-selecting first workspace:", firstWorkspace.name);
        setCurrentWorkspaceIdState(firstWorkspace.id);
      }
    }
  }, [currentWorkspace, workspaces, currentWorkspaceId]);

  // Always provide the WorkspaceContext to children. While hydration is pending,
  // the context will still be available with initial values. This prevents children
  // from throwing errors when they call useWorkspace during initial render.
  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspaceId: effectiveWorkspaceId,
        currentWorkspace: effectiveWorkspace,
        setCurrentWorkspaceId,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        addMember,
        updateMember,
        removeMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
