/**
 * Postd Authenticated Layout
 * 
 * This layout wraps all authenticated routes in the AppShell.
 * Since we're using React Router (not Next.js), this is a component
 * that can be used to wrap protected routes in App.tsx.
 * 
 * Includes error boundary to catch and handle component errors gracefully.
 */

import { ReactNode } from "react";
import { AppShell } from "@/components/postd/layout/AppShell";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface PostdLayoutProps {
  children: ReactNode;
}

export function PostdLayout({ children }: PostdLayoutProps) {
  return (
    <ErrorBoundary>
      <AppShell>{children}</AppShell>
    </ErrorBoundary>
  );
}

