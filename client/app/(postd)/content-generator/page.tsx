import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { GenerationResult } from "@/components/generation/GenerationResult";
import type { BrandFidelityScore, LinterResult } from "@/types/agent-config";

interface GenerationState {
  topic: string;
  tone: string;
  platform: string;
  format: string;
  maxLength?: number;
  includeCTA: boolean;
  ctaType?: string;
}

interface ResultState {
  content: string;
  bfsScore?: BrandFidelityScore;
  linterResult?: LinterResult;
  timestamp: string;
}

const DEFAULT_STATE: GenerationState = {
  topic: "",
  tone: "professional",
  platform: "instagram",
  format: "post",
  maxLength: 280,
  includeCTA: true,
  ctaType: "comment",
};

export default function ContentGenerator() {
  const [formState, setFormState] = useState<GenerationState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [_regenerationCount, setRegenerationCount] = useState(0);

  const handleGenerate = async () => {
    if (!formState.topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/agents/generate/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formState.topic,
          tone: formState.tone,
          platform: formState.platform,
          format: formState.format,
          max_length: formState.maxLength,
          include_cta: formState.includeCTA,
          cta_type: formState.ctaType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      setResult({
        content: data.content,
        bfsScore: data.bfs_score,
        linterResult: data.linter_result,
        timestamp: new Date().toISOString(),
      });
      setRegenerationCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerationCount((prev) => prev + 1);
    await handleGenerate();
  };

  const handleApprove = async () => {
    if (!result) return;

    try {
      setLoading(true);
      const response = await fetch("/api/agents/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result.content,
          platform: formState.platform,
          bfs_score: result.bfsScore?.overall,
        }),
      });

      if (response.ok) {
        setError(null);
        // Show success message and clear form
        setTimeout(() => {
          setResult(null);
          setFormState(DEFAULT_STATE);
        }, 1500);
      } else {
        setError("Failed to approve content");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Sparkles className="h-8 w-8" />
          AI Content Generator
        </h1>
        <p className="text-gray-600">
          Generate on-brand content with AI and guaranteed compliance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Content Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Topic or Idea
                </label>
                <Textarea
                  placeholder="What would you like to create content about?"
                  value={formState.topic}
                  onChange={(e) =>
                    setFormState({ ...formState, topic: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Platform
                </label>
                <Select
                  value={formState.platform}
                  onValueChange={(value) =>
                    setFormState({ ...formState, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <Select
                  value={formState.format}
                  onValueChange={(value) =>
                    setFormState({ ...formState, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="image">Image Caption</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium mb-1">Tone</label>
                <Select
                  value={formState.tone}
                  onValueChange={(value) =>
                    setFormState({ ...formState, tone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Length */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Characters
                </label>
                <Input
                  type="number"
                  value={formState.maxLength}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      maxLength: parseInt(e.target.value),
                    })
                  }
                  min={50}
                  max={5000}
                />
              </div>

              {/* CTA Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeCTA"
                    checked={formState.includeCTA}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        includeCTA: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label htmlFor="includeCTA" className="text-sm font-medium">
                    Include Call-to-Action
                  </label>
                </div>

                {formState.includeCTA && (
                  <Select
                    value={formState.ctaType}
                    onValueChange={(value) =>
                      setFormState({ ...formState, ctaType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link Click</SelectItem>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="dm">Direct Message</SelectItem>
                      <SelectItem value="bio">Bio Link</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {!result ? (
            <Card className="h-full min-h-96">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Generate content to see results with BFS scoring and
                    compliance checks
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GenerationResult
              content={result.content}
              platform={formState.platform}
              bfsScore={result.bfsScore}
              linterResult={result.linterResult}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onEdit={() => {
                // In a full implementation, this would open an editor modal
                console.log("Edit draft:", result.content);
              }}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
