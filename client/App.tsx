import "./global.css";
import "./styles/tokens.css";
import "./styles/animations.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import MilestoneCelebrator from "@/components/MilestoneCelebrator";
import { DeployProof } from "@/components/DeployProof";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Screen0Login from "./pages/onboarding/Screen0Login";
import NotFound from "./pages/NotFound";
import { Navigate, useNavigate } from "react-router-dom";
import { PostdLayout } from "./app/(postd)/layout";
import { useEffect } from "react";
// Import authenticated pages from new structure
import Dashboard from "./app/(postd)/dashboard/page";
import Calendar from "./app/(postd)/calendar/page";
import PaidAds from "./app/(postd)/paid-ads/page";
import BrandGuide from "./app/(postd)/brand-guide/page";
import Analytics from "./app/(postd)/analytics/page";
import ContentQueue from "./app/(postd)/queue/page";
import Campaigns from "./app/(postd)/campaigns/page";
import LibraryPage from "./app/(postd)/library/page";
import Events from "./app/(postd)/events/page";
import Reviews from "./app/(postd)/reviews/page";
import LinkedAccounts from "./app/(postd)/linked-accounts/page";
import Settings from "./app/(postd)/settings/page";
import Reporting from "./app/(postd)/reporting/page";
import CreativeStudio from "./app/(postd)/studio/page";
import Approvals from "./app/(postd)/approvals/page";
import ClientPortal from "./app/(postd)/client-portal/page";
import BrandIntelligence from "./app/(postd)/brand-intelligence/page";
import ContentGenerator from "./app/(postd)/content-generator/page";
import ClientSettings from "./app/(postd)/client-settings/page";
import Brands from "./app/(postd)/brands/page";
import BrandIntake from "./app/(postd)/brand-intake/page";
import BrandSnapshot from "./app/(postd)/brand-snapshot/page";
import Billing from "./app/(postd)/billing/page";
import InsightsROI from "./app/(postd)/insights-roi/page";
import AdminPanel from "./app/(postd)/admin/page";
import Pricing from "./pages/Pricing";
import BlogIndex from "./app/(public)/blog/page";
import BlogPost from "./app/(public)/blog/[slug]/page";
import PrivacyPolicy from "./app/(public)/legal/privacy-policy/page";
import TermsOfService from "./app/(public)/legal/terms/page";
import CookiePolicy from "./app/(public)/legal/cookies/page";
import DataDeletion from "./app/(public)/legal/data-deletion/page";
import AcceptableUse from "./app/(public)/legal/acceptable-use/page";
import RefundPolicy from "./app/(public)/legal/refunds/page";
import ApiPolicy from "./app/(public)/legal/api-policy/page";
import AiDisclosure from "./app/(public)/legal/ai-disclosure/page";
import SecurityStatement from "./app/(public)/legal/security/page";

const queryClient = new QueryClient();

// Route guard components
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingStep } = useAuth();

  // If authenticated and onboarding is in progress, show onboarding
  if (isAuthenticated && onboardingStep) {
    return <Navigate to="/onboarding" replace />;
  }

  // If authenticated and onboarding is complete, show dashboard
  if (isAuthenticated && !onboardingStep) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated - show public content
  return children as React.ReactElement;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingStep } = useAuth();

  // Not authenticated - redirect to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but in onboarding - redirect to onboarding
  if (onboardingStep) {
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated and onboarding complete - show protected content
  return children as React.ReactElement;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingStep } = useAuth();

  // Authenticated but onboarding is complete - redirect to dashboard
  if (isAuthenticated && !onboardingStep) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow unauthenticated users OR users in onboarding to access /onboarding
  return children as React.ReactElement;
}

// Logout handler component
function LogoutHandler() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return null;
}

// Protected route wrapper - handles authentication and routing
function ProtectedRoutes() {
  return (
    <Routes>
      {/* Public Routes - landing page */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Index />
          </PublicRoute>
        }
      />

      {/* Pricing page - accessible to everyone */}
      <Route
        path="/pricing"
        element={
          <PublicRoute>
            <Pricing />
          </PublicRoute>
        }
      />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Screen0Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Index />
          </PublicRoute>
        }
      />
      {/* Blog Routes */}
      <Route
        path="/blog"
        element={
          <PublicRoute>
            <BlogIndex />
          </PublicRoute>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <PublicRoute>
            <BlogPost />
          </PublicRoute>
        }
      />
      {/* Legal Routes */}
      <Route
        path="/legal/privacy-policy"
        element={
          <PublicRoute>
            <PrivacyPolicy />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/terms"
        element={
          <PublicRoute>
            <TermsOfService />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/cookies"
        element={
          <PublicRoute>
            <CookiePolicy />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/data-deletion"
        element={
          <PublicRoute>
            <DataDeletion />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/acceptable-use"
        element={
          <PublicRoute>
            <AcceptableUse />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/refunds"
        element={
          <PublicRoute>
            <RefundPolicy />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/api-policy"
        element={
          <PublicRoute>
            <ApiPolicy />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/ai-disclosure"
        element={
          <PublicRoute>
            <AiDisclosure />
          </PublicRoute>
        }
      />
      <Route
        path="/legal/security"
        element={
          <PublicRoute>
            <SecurityStatement />
          </PublicRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* Protected Routes - only accessible when authenticated and onboarding complete */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Dashboard />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Calendar />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/content-queue"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <ContentQueue />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <ContentQueue />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Approvals />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/creative-studio"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <CreativeStudio />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      {/* Alias for /studio -> /creative-studio */}
      <Route
        path="/studio"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <CreativeStudio />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/content-generator"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <ContentGenerator />
            </PostdLayout>
          </ProtectedRoute>
        }
      />

      {/* Strategy Navigation */}
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Campaigns />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/brands"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Brands />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand-intake"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <BrandIntake />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand-guide"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <BrandGuide />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand-snapshot"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <BrandSnapshot />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand-intelligence"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <BrandIntelligence />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Analytics />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reporting"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Reporting />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Reporting />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/paid-ads"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <PaidAds />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ads"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <PaidAds />
            </PostdLayout>
          </ProtectedRoute>
        }
      />

      {/* Assets Navigation */}
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <LibraryPage />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-portal"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <ClientPortal />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Events />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Reviews />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/linked-accounts"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <LinkedAccounts />
            </PostdLayout>
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Settings />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-settings"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <ClientSettings />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <Billing />
            </PostdLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights-roi"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <InsightsROI />
            </PostdLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <PostdLayout>
              <AdminPanel />
            </PostdLayout>
          </ProtectedRoute>
        }
      />

      {/* Logout route - handled by AuthContext */}
      <Route
        path="/auth/logout"
        element={
          <ProtectedRoute>
            <LogoutHandler />
          </ProtectedRoute>
        }
      />

      {/* Catch-all - show 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export const App = () => {
  // Add error boundary wrapper
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <UserProvider>
          <AuthProvider>
            <BrowserRouter>
              <BrandProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <MilestoneCelebrator />
                  <DeployProof />
                  <ProtectedRoutes />
                </TooltipProvider>
              </BrandProvider>
            </BrowserRouter>
          </AuthProvider>
        </UserProvider>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
};
