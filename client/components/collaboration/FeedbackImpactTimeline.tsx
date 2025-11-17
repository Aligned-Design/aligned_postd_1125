import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  MessageCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface FeedbackItem {
  id: string;
  postId: string;
  date: string;
  feedback: string;
  status: "acted_on" | "pending" | "planned";
  agencyResponse?: string;
  result?: {
    metric: string;
    improvement: string;
    comparison?: string;
  };
  preview?: {
    thumbnail?: string;
    caption: string;
    platform: string;
    date?: string;
  };
  nextWeekPreviewUrl?: string;
}

interface FeedbackImpactTimelineProps {
  clientId: string;
  className?: string;
}

export function FeedbackImpactTimeline({
  clientId,
  className,
}: FeedbackImpactTimelineProps) {
  const [feedbackHistory] = useState<FeedbackItem[]>([
    {
      id: "1",
      postId: "post-123",
      date: "2024-11-10",
      feedback: "Make it more casual",
      status: "acted_on",
      agencyResponse: "Updated tone + posted Nov 12",
      result: {
        metric: "Engagement",
        improvement: "+42%",
        comparison: "vs similar posts",
      },
      preview: {
        thumbnail: "/placeholder.svg",
        caption: "Behind the scenes... (casual tone applied)",
        platform: "Instagram",
        date: "2024-11-12",
      },
    },
    {
      id: "2",
      postId: "post-124",
      date: "2024-11-08",
      feedback: "Add more data",
      status: "acted_on",
      agencyResponse: "Noted! This is in our content plan for next week",
      nextWeekPreviewUrl: "/content-queue?filter=data-driven",
    },
    {
      id: "3",
      postId: "post-125",
      date: "2024-11-06",
      feedback: "Too promotional",
      status: "acted_on",
      agencyResponse: "Reduced promotional posts from 50% to 30% of mix",
      result: {
        metric: "Positive Sentiment",
        improvement: "+18%",
        comparison: "since change",
      },
    },
    {
      id: "4",
      postId: "post-126",
      date: "2024-11-15",
      feedback: "Love the storytelling approach",
      status: "pending",
      agencyResponse:
        "Thank you! We'll incorporate more storytelling in upcoming posts",
    },
  ]);

  const getStatusIcon = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "acted_on":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "planned":
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "acted_on":
        return (
          <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Acted On
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="gap-1 text-amber-700 border-amber-200"
          >
            <Clock className="h-3 w-3" />
            Under Review
          </Badge>
        );
      case "planned":
        return (
          <Badge variant="secondary" className="gap-1">
            <MessageCircle className="h-3 w-3" />
            Planned
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Feedback Impact
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            See how your feedback shaped our content strategy
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          {feedbackHistory.filter((f) => f.status === "acted_on").length} /
          {feedbackHistory.length} Acted On
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

        {feedbackHistory.map((item, idx) => (
          <div key={item.id} className="relative pl-16">
            {/* Timeline dot */}
            <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
              {getStatusIcon(item.status)}
            </div>

            <Card>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(item.status)}
                      <span className="text-sm text-slate-500">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <blockquote className="border-l-4 border-indigo-500 pl-4 mb-3">
                      <p className="text-slate-900 font-medium italic">
                        "{item.feedback}"
                      </p>
                    </blockquote>
                  </div>
                </div>

                {/* Agency Response */}
                {item.agencyResponse && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-3">
                      <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-blue-900 text-sm mb-1">
                          Agency Response
                        </h4>
                        <p className="text-blue-800 text-sm">
                          {item.agencyResponse}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result/Impact */}
                {item.result && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-green-900 text-sm mb-1">
                          Impact
                        </h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-green-900 font-bold">
                            {item.result.metric}
                          </span>
                          <span className="text-2xl font-black text-green-600">
                            {item.result.improvement}
                          </span>
                          {item.result.comparison && (
                            <span className="text-sm text-green-700">
                              {item.result.comparison}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {item.preview && (
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-slate-200 rounded-lg overflow-hidden">
                        <img
                          src={item.preview.thumbnail}
                          alt="Post preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.preview.platform}
                          </Badge>
                          {item.preview.date && (
                            <span className="text-xs text-slate-500">
                              Posted{" "}
                              {new Date(item.preview.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {item.preview.caption}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto mt-2 gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View Full Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Week Preview Link */}
                {item.nextWeekPreviewUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() =>
                      (window.location.href = item.nextWeekPreviewUrl!)
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Next Week's Preview
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      {feedbackHistory.filter((f) => f.status === "acted_on").length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 mb-1">
                  Your Voice Shapes Our Strategy
                </h3>
                <p className="text-indigo-800 text-sm leading-relaxed">
                  We've acted on{" "}
                  <strong>
                    {
                      feedbackHistory.filter((f) => f.status === "acted_on")
                        .length
                    }{" "}
                    of your {feedbackHistory.length} feedback items
                  </strong>
                  . Your insights directly improve content performance and
                  audience engagement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
