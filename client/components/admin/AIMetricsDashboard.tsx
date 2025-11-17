import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface AIMetricsSnapshot {
  agentType: string;
  timeRange: { start: string; end: string };
  totalRequests: number;
  successRate: number;
  failureRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  averageProviderLatency: number;
  averageBFSTime: number;
  averageLinterTime: number;
  averageBFSScore: number;
  bfsPassRate: number;
  compliancePassRate: number;
  byProvider: {
    openai: { requestCount: number; avgLatency: number; successRate: number };
    claude: { requestCount: number; avgLatency: number; successRate: number };
  };
}

interface Alert {
  severity: "low" | "medium" | "high";
  type: string;
  message: string;
  metric: number;
  threshold: number;
}

interface Summary {
  current: AIMetricsSnapshot;
  daily: AIMetricsSnapshot;
  trend: { latencyTrend: string; successTrend: string; qualityTrend: string };
}

export function AIMetricsDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [summaryRes, alertsRes] = await Promise.all([
        fetch("/api/metrics/ai/summary"),
        fetch("/api/metrics/ai/alerts"),
      ]);

      if (summaryRes.ok && alertsRes.ok) {
        const summaryData = await summaryRes.json();
        const alertsData = await alertsRes.json();

        setSummary(summaryData.data);
        setAlerts(alertsData.data.alerts);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const current = summary.current;
  const daily = summary.daily;

  const latencyTrendUp = summary.trend.latencyTrend === "up";
  const successTrendUp = summary.trend.successTrend === "up";
  const qualityTrendUp = summary.trend.qualityTrend === "up";

  const providerData = [
    {
      name: "OpenAI",
      requests: current.byProvider.openai.requestCount,
      avgLatency: Math.round(current.byProvider.openai.avgLatency),
      successRate: (current.byProvider.openai.successRate * 100).toFixed(1),
    },
    {
      name: "Claude",
      requests: current.byProvider.claude.requestCount,
      avgLatency: Math.round(current.byProvider.claude.avgLatency),
      successRate: (current.byProvider.claude.successRate * 100).toFixed(1),
    },
  ];

  const qualityData = [
    {
      name: "BFS Pass Rate",
      value: Math.round(current.bfsPassRate * 100),
      fill: "#22c55e",
    },
    {
      name: "Compliance Pass Rate",
      value: Math.round(current.compliancePassRate * 100),
      fill: "#3b82f6",
    },
    {
      name: "Failed/At Risk",
      value:
        100 -
        Math.round(
          ((current.bfsPassRate + current.compliancePassRate) / 2) * 100,
        ),
      fill: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Generation Metrics</h2>
          <p className="text-sm text-gray-600">Last updated: {lastUpdate}</p>
        </div>
        <Button onClick={loadMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                >
                  <div
                    className={cn(
                      "p-2 rounded",
                      alert.severity === "high"
                        ? "bg-red-200"
                        : alert.severity === "medium"
                          ? "bg-yellow-200"
                          : "bg-blue-200",
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        "h-4 w-4",
                        alert.severity === "high"
                          ? "text-red-700"
                          : alert.severity === "medium"
                            ? "text-yellow-700"
                            : "text-blue-700",
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-gray-600">
                      Current: {alert.metric.toFixed(2)} | Threshold:{" "}
                      {alert.threshold.toFixed(2)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      alert.severity === "high" ? "destructive" : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Success Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              {successTrendUp ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className="text-3xl font-bold">
              {(current.successRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {current.totalRequests} requests in last hour
            </p>
          </CardContent>
        </Card>

        {/* Avg Latency */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              {latencyTrendUp ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className="text-3xl font-bold">
              {Math.round(current.averageLatency)}ms
            </p>
            <p className="text-xs text-gray-600 mt-2">
              P95: {Math.round(current.latencyP95)}ms
            </p>
          </CardContent>
        </Card>

        {/* BFS Pass Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">BFS Pass Rate</p>
              {qualityTrendUp ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold">
              {(current.bfsPassRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Score: {current.averageBFSScore.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Compliance Pass Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">Compliance</p>
              {current.compliancePassRate >= 0.9 ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <p className="text-3xl font-bold">
              {(current.compliancePassRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-2">Passing linter checks</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="timing">Timing Breakdown</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Latency Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Latency (ms)",
                      P50: current.latencyP50,
                      P95: current.latencyP95,
                      P99: current.latencyP99,
                      avg: current.averageLatency,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="P50" fill="#3b82f6" />
                  <Bar dataKey="P95" fill="#f59e0b" />
                  <Bar dataKey="P99" fill="#ef4444" />
                  <Bar dataKey="avg" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">BFS Pass Rate</p>
                  <p className="text-lg font-semibold">
                    {(current.bfsPassRate * 100).toFixed(1)}%
                    <span className="text-xs text-gray-600 ml-2">
                      (24h: {(daily.bfsPassRate * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Compliance Pass Rate
                  </p>
                  <p className="text-lg font-semibold">
                    {(current.compliancePassRate * 100).toFixed(1)}%
                    <span className="text-xs text-gray-600 ml-2">
                      (24h: {(daily.compliancePassRate * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg BFS Score</p>
                  <p className="text-lg font-semibold">
                    {current.averageBFSScore.toFixed(2)}
                    <span className="text-xs text-gray-600 ml-2">
                      (24h: {daily.averageBFSScore.toFixed(2)})
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={providerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: "Requests",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: "Latency (ms)",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="requests" fill="#3b82f6" />
                  <Bar yAxisId="right" dataKey="avgLatency" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Provider Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {providerData.map((provider) => (
              <Card key={provider.name}>
                <CardHeader>
                  <CardTitle>{provider.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requests</span>
                    <span className="font-semibold">{provider.requests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Latency</span>
                    <span className="font-semibold">
                      {provider.avgLatency}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold">
                      {provider.successRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Timing Breakdown Tab */}
        <TabsContent value="timing">
          <Card>
            <CardHeader>
              <CardTitle>Generation Pipeline Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      stage: "Timing",
                      "AI Provider": Math.round(current.averageProviderLatency),
                      "BFS Calculation": Math.round(current.averageBFSTime),
                      "Linter Check": Math.round(current.averageLinterTime),
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis
                    label={{
                      value: "Time (ms)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="AI Provider" fill="#3b82f6" />
                  <Bar dataKey="BFS Calculation" fill="#10b981" />
                  <Bar dataKey="Linter Check" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium">AI Provider Call</span>
                  <span className="text-lg font-semibold">
                    {Math.round(current.averageProviderLatency)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium">
                    BFS Score Calculation
                  </span>
                  <span className="text-lg font-semibold">
                    {Math.round(current.averageBFSTime)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="text-sm font-medium">Compliance Linter</span>
                  <span className="text-lg font-semibold">
                    {Math.round(current.averageLinterTime)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded font-medium">
                  <span className="text-sm">Total Average</span>
                  <span className="text-lg font-bold">
                    {Math.round(current.averageLatency)}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
