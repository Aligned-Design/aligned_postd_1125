import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  MessageSquare,
  Target,
  CheckCircle2,
  XCircle,
  Edit,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BrandDNAProps {
  brandData: {
    name: string;
    colors: string[];
    tone: string[];
    voiceExample?: string;
    audience?: string;
    goal?: string;
    industry?: string;
    extractedMetadata?: {
      keywords: string[];
      coreMessaging: string[];
      dos: string[];
      donts: string[];
    };
  };
  onEdit: () => void;
  onConfirm: () => void;
}

export function BrandDNAVisualization({
  brandData,
  onEdit,
  onConfirm,
}: BrandDNAProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "visual",
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate confidence score based on available data
  const calculateConfidence = () => {
    let score = 0;
    if (brandData.colors.length > 0) score += 25;
    if (brandData.tone.length > 0) score += 25;
    if (brandData.voiceExample) score += 25;
    if (brandData.audience || brandData.goal) score += 25;
    return score;
  };

  const confidenceScore = calculateConfidence();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-2 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">We've got you! ✨</h2>
        <p className="text-slate-600 font-medium max-w-2xl mx-auto">
          Here's how we'll keep your content aligned from day one. Review what we learned and make any adjustments.
        </p>
      </div>

      {/* Confidence Score */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Brand Guide Strength
              </p>
              <p className="text-xs text-slate-600">
                Based on the information you've provided
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-indigo-600">
                {confidenceScore}%
              </p>
              <p className="text-xs text-slate-600">Confidence</p>
            </div>
          </div>
          <Progress value={confidenceScore} className="h-2" />
          <p className="text-xs text-slate-600 mt-2">
            {confidenceScore === 100
              ? "🎉 Excellent! Your Brand Guide is complete."
              : confidenceScore >= 75
                ? "Great start! Add more details to improve AI accuracy."
                : confidenceScore >= 50
                  ? "Good foundation. Consider adding more information."
                  : "Add more details to help AI understand your brand better."}
          </p>
        </CardContent>
      </Card>

      {/* Visual Style */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection("visual")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Visual Style</CardTitle>
                <p className="text-xs text-slate-600">
                  Colors and visual identity
                </p>
              </div>
            </div>
            {expandedSection === "visual" ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "visual" && (
          <CardContent>
            {brandData.colors.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-3">
                    Brand Color Palette
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {brandData.colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-2"
                      >
                        <div
                          className="w-16 h-16 rounded-lg border-2 border-slate-200 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <code className="text-xs font-mono text-slate-600">
                          {color}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600" />
                    These colors will be used in all AI-generated content and
                    designs
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm">No colors selected yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="mt-2"
                >
                  Add Colors
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Tone Profile */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection("tone")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Tone & Voice</CardTitle>
                <p className="text-xs text-slate-600">
                  How your brand communicates
                </p>
              </div>
            </div>
            {expandedSection === "tone" ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "tone" && (
          <CardContent>
            {brandData.tone.length > 0 || brandData.voiceExample ? (
              <div className="space-y-4">
                {brandData.tone.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      Tone Keywords
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandData.tone.map((t) => (
                        <Badge key={t} variant="secondary" className="text-sm">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {brandData.voiceExample && (
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      Voice Example
                    </p>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm text-slate-700 italic">
                        "{brandData.voiceExample}"
                      </p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-600" />
                    AI will match this tone in all generated content
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-sm">No tone defined yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="mt-2"
                >
                  Define Tone
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Core Messaging */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleSection("messaging")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Core Messaging</CardTitle>
                <p className="text-xs text-slate-600">
                  Key themes and audience
                </p>
              </div>
            </div>
            {expandedSection === "messaging" ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </CardHeader>
        {expandedSection === "messaging" && (
          <CardContent>
            <div className="space-y-4">
              {brandData.audience && (
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-2">
                    Target Audience
                  </p>
                  <p className="text-sm text-slate-700 bg-green-50 p-3 rounded-lg">
                    {brandData.audience}
                  </p>
                </div>
              )}
              {brandData.goal && (
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-2">
                    Primary Goal
                  </p>
                  <p className="text-sm text-slate-700 bg-green-50 p-3 rounded-lg">
                    {brandData.goal}
                  </p>
                </div>
              )}
              {brandData.extractedMetadata?.coreMessaging &&
                brandData.extractedMetadata.coreMessaging.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-2">
                      Extracted Key Messages
                    </p>
                    <ul className="space-y-2">
                      {brandData.extractedMetadata.coreMessaging.map(
                        (message, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-700 flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-0.5">•</span>
                            {message}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Do's & Don'ts */}
      {brandData.extractedMetadata &&
        (brandData.extractedMetadata.dos.length > 0 ||
          brandData.extractedMetadata.donts.length > 0) && (
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleSection("guidelines")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Brand Guidelines</CardTitle>
                    <p className="text-xs text-slate-600">Do's and don'ts</p>
                  </div>
                </div>
                {expandedSection === "guidelines" ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </CardHeader>
            {expandedSection === "guidelines" && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brandData.extractedMetadata.dos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Do's
                      </p>
                      <ul className="space-y-1">
                        {brandData.extractedMetadata.dos.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-700 flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {brandData.extractedMetadata.donts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-red-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        Don'ts
                      </p>
                      <ul className="space-y-1">
                        {brandData.extractedMetadata.donts.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-700 flex items-start gap-2"
                          >
                            <span className="text-red-600 mt-0.5">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onEdit} className="flex-1 gap-2">
          <Edit className="w-4 h-4" />
          Edit Brand Guide
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <CheckCircle2 className="w-4 h-4" />
          Looks Great → Continue
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-800 font-medium">
          💡 <strong>Good news:</strong> You can refine your Brand Guide
          anytime from Settings → Brand Guide. The AI learns and improves as
          you use the platform.
        </p>
      </div>
    </div>
  );
}
