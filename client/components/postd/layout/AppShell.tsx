/**
 * AppShell - Main authenticated application shell for Postd
 * 
 * This is the single source of truth for the authenticated shell layout.
 * Replaces the old AppShell/AppLayout pattern.
 * 
 * Provides:
 * - Header with help button
 * - Sidebar navigation
 * - Main content area
 * - Help drawer
 * - Loading overlay
 */

import { ReactNode, useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { HelpDrawer } from "@/components/dashboard/HelpDrawer";
import { useLocation } from "react-router-dom";
import { useHelpState } from "@/hooks/useHelpState";
import type { PageKey } from "@/types/help";

interface AppShellProps {
  children: ReactNode;
}

const PAGE_MAP: Record<string, PageKey> = {
  "/dashboard": "dashboard",
  "/calendar": "calendar",
  "/library": "library",
  "/creative-studio": "studio",
  "/studio": "studio", // Alias for /creative-studio
  "/brand-guide": "brand",
  "/analytics": "analytics",
};

export function AppShell({ children }: AppShellProps) {
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();
  const { setHelpLastOpen } = useHelpState();

  const currentPage: PageKey = PAGE_MAP[location.pathname] || "dashboard";

  const handleHelpClick = () => {
    setShowHelpDrawer(true);
    setHelpLastOpen(true);
  };

  const handleHelpClose = () => {
    setShowHelpDrawer(false);
  };

  const handleReplayTour = () => {
    window.location.href = "/onboarding?step=5";
  };

  // Prevent blank screens during hydration: show a temporary loading overlay
  useEffect(() => {
    let mounted = true;
    const markReady = () => {
      if (mounted) setIsReady(true);
    };

    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady);
    }

    // Also ensure we don't hang the overlay forever
    const t = setTimeout(markReady, 800);

    return () => {
      mounted = false;
      window.removeEventListener("load", markReady);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showHelpDrawer) {
        handleHelpClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showHelpDrawer]);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar - Fixed width, hidden on mobile */}
      <aside className="hidden md:block w-64 shrink-0 fixed left-0 top-0 h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-800 z-30 overflow-y-auto">
        <Sidebar />
      </aside>
      
      {/* Main column - Flex-1, contains header and scrollable content, offset by sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Sticky header - Inside main column, above scrollable content */}
        <header className="sticky top-0 z-40 border-b bg-white">
          <Header onHelpClick={handleHelpClick} />
        </header>
        
        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          {children}
        </main>
      </div>

      {/* Help Drawer */}
      <HelpDrawer
        isOpen={showHelpDrawer}
        onClose={handleHelpClose}
        currentPage={currentPage}
        onReplayTour={handleReplayTour}
      />

      {/* Temporary loading overlay to avoid blank screens during hydration */}
      {!isReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Loading the app…</p>
          </div>
        </div>
      )}
    </div>
  );
}

