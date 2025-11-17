import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Search,
  ChevronDown,
  Check,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface Message {
  id: string;
  sender: "client" | "agency";
  content: string;
  timestamp: string;
  read: boolean;
  isAnswer?: boolean;
}

interface QAThread {
  id: string;
  question: string;
  status: "answered" | "pending";
  messages: Message[];
  createdAt: string;
  category?: string;
}

interface ClientQAChatProps {
  clientId: string;
  agencyName: string;
  className?: string;
}

export function ClientQAChat({
  clientId,
  agencyName,
  className,
}: ClientQAChatProps) {
  const [threads, setThreads] = useState<QAThread[]>([
    {
      id: "1",
      question: "Why posting at 2 PM? I thought morning is better?",
      status: "answered",
      category: "Strategy",
      createdAt: "2024-11-10T10:00:00Z",
      messages: [
        {
          id: "m1",
          sender: "client",
          content: "Why posting at 2 PM? I thought morning is better?",
          timestamp: "2024-11-10T10:00:00Z",
          read: true,
        },
        {
          id: "m2",
          sender: "agency",
          content:
            "Great question! Our data shows 2 PM = +40% engagement for your audience. Here's why: Your followers are most active during lunch breaks and early afternoon. We analyzed 3 months of data and found peak engagement windows at 2-3 PM on weekdays.",
          timestamp: "2024-11-10T14:30:00Z",
          read: true,
          isAnswer: true,
        },
      ],
    },
  ]);

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread, threads]);

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;

    const newThread: QAThread = {
      id: `thread-${Date.now()}`,
      question: newQuestion,
      status: "pending",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "client",
          content: newQuestion,
          timestamp: new Date().toISOString(),
          read: false,
        },
      ],
    };

    setThreads([newThread, ...threads]);
    setActiveThread(newThread.id);
    setNewQuestion("");

    // Track analytics
    if (window.posthog) {
      window.posthog.capture("client_question_asked", {
        question: newQuestion,
      });
    }
  };

  const filteredThreads = threads.filter((thread) =>
    thread.question.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeThreadData = threads.find((t) => t.id === activeThread);
  const pendingCount = threads.filter((t) => t.status === "pending").length;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Questions & Answers
            </CardTitle>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600">
            Ask your {agencyName} team anything about your content strategy
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex gap-4 overflow-hidden">
          {/* Threads List */}
          <div className="w-80 flex-shrink-0 flex flex-col border-r">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* New Question Form */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                  placeholder="Ask a question..."
                  className="flex-1"
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!newQuestion.trim()}
                  size="sm"
                  className="gap-1"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No questions yet</p>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThread(thread.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      activeThread === thread.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm text-slate-900 line-clamp-2">
                        {thread.question}
                      </p>
                      {thread.status === "answered" ? (
                        <CheckCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </span>
                      {thread.category && (
                        <>
                          <span>•</span>
                          <span>{thread.category}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col">
            {activeThreadData ? (
              <>
                {/* Thread Header */}
                <div className="pb-4 border-b mb-4">
                  <h3 className="font-bold text-slate-900 mb-1">
                    {activeThreadData.question}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      Asked{" "}
                      {new Date(
                        activeThreadData.createdAt,
                      ).toLocaleDateString()}
                    </span>
                    {activeThreadData.status === "answered" && (
                      <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
                        <Check className="h-3 w-3" />
                        Answered
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {activeThreadData.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === "client"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-4",
                          message.sender === "client"
                            ? "bg-indigo-600 text-white"
                            : message.isAnswer
                              ? "bg-green-50 border border-green-200"
                              : "bg-slate-100",
                        )}
                      >
                        {message.isAnswer && (
                          <Badge className="mb-2 bg-green-600">Answer</Badge>
                        )}
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            message.sender === "client"
                              ? "text-white"
                              : "text-slate-900",
                          )}
                        >
                          {message.content}
                        </p>
                        <div
                          className={cn(
                            "flex items-center justify-between mt-2 text-xs",
                            message.sender === "client"
                              ? "text-indigo-200"
                              : "text-slate-500",
                          )}
                        >
                          <span>
                            {new Date(message.timestamp).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {message.sender === "client" &&
                            (message.read ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Status Message */}
                {activeThreadData.status === "pending" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-amber-900 text-sm">
                      💬 Your question has been sent to {agencyName}. They'll
                      respond within 24 hours.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">
                    Select a question to view the conversation
                  </p>
                  <p className="text-sm mt-1">
                    Or ask a new question to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Common Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              {
                q: "How often will you post?",
                a: "We post 3-5 times per week based on your plan.",
              },
              {
                q: "Can I see analytics?",
                a: "Yes! Check the Analytics tab for detailed metrics.",
              },
              {
                q: "How do I upload my own images?",
                a: "Go to Upload Assets tab to add media.",
              },
            ].map((faq, idx) => (
              <details key={idx} className="group">
                <summary className="flex items-center justify-between cursor-pointer p-3 hover:bg-slate-50 rounded-lg">
                  <span className="font-medium text-sm text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-sm text-slate-600 p-3 pt-0">{faq.a}</p>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
