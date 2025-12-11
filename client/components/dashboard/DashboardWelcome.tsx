/**
 * Dashboard Welcome Component
 * 
 * Shows a celebration and guidance for first-time users after onboarding completion.
 * Displays completion checklist, next steps, and quick actions.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConfetti } from "@/hooks/useConfetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Plus,
  Settings,
  Link2,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface DashboardWelcomeProps {
  onDismiss: () => void;
  brandId?: string;
  hasContent?: boolean;
  hasBrandGuide?: boolean;
  hasConnectedAccounts?: boolean;
}

export function DashboardWelcome({
  onDismiss,
  brandId,
  hasContent = true,
  hasBrandGuide = true,
  hasConnectedAccounts = false,
}: DashboardWelcomeProps) {
  const navigate = useNavigate();
  const { fire } = useConfetti();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fire confetti on mount
    const timer = setTimeout(() => {
      fire({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.3 },
        colors: ["#632bf0", "#c084fc", "#e2e8f0", "#a855f7", "#12b76a"], // primary-light, purple-400, slate-200, purple-500, success (design tokens)
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fire]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-3">
              🎉 You're all set!
            </h1>
            <p className="text-slate-600 font-medium text-lg">
              Your Brand Guide is complete and your first week of content is ready.
            </p>
          </div>

          {/* Completion Checklist */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Here's what we've set up for you:
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">Brand Guide created</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">
                  First week of content generated ({hasContent ? "8 pieces" : "Ready"})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">Ready to review and publish</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              What would you like to do first?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-300"
                onClick={() => {
                  handleDismiss();
                  navigate("/calendar");
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Review Your Content</h3>
                      <p className="text-sm text-slate-600">
                        See your 7-day content plan and make any edits
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-300"
                onClick={() => {
                  handleDismiss();
                  navigate("/content-queue");
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Publish Your First Post</h3>
                      <p className="text-sm text-slate-600">
                        Approve and schedule your first piece of content
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-300"
                onClick={() => {
                  handleDismiss();
                  navigate("/brand-guide");
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Customize Your Brand</h3>
                      <p className="text-sm text-slate-600">
                        Fine-tune your brand voice and preferences
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-300"
                onClick={() => {
                  handleDismiss();
                  navigate("/linked-accounts");
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Connect Accounts</h3>
                      <p className="text-sm text-slate-600">
                        Link your social platforms to start publishing
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-slate-600"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleDismiss}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
            >
              Let's go!
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

