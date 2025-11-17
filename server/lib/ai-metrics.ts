/**
 * AI Metrics Tracking
 * Collects performance and quality metrics for AI generation pipeline
 */

export interface AIGenerationMetric {
  id: string;
  timestamp: string;
  brandId?: string;
  agentType: 'doc' | 'design' | 'advisor';
  provider: 'openai' | 'claude' | 'unknown';

  // Timing metrics (milliseconds)
  totalDuration: number;
  providerLatency: number;        // Time to get response from API
  bfsCalculationTime: number;     // Time to calculate BFS
  linterCheckTime: number;        // Time to run linter

  // Result metrics
  contentLength: number;
  bfsScore?: number;
  linterPassed: boolean;
  complianceIssuesCount: number;

  // Status
  success: boolean;
  error?: string;

  // Additional context
  inputLength: number;
  modelUsed?: string;
  regenerationAttempt: number;
  userAgent?: string;
  ip?: string;
}

export interface AIMetricsSnapshot {
  agentType: 'doc' | 'design' | 'advisor' | 'all';
  timeRange: {
    start: string;
    end: string;
  };

  // Count and rate metrics
  totalRequests: number;
  successRate: number;              // 0-1
  failureRate: number;              // 0-1

  // Latency metrics (percentiles)
  latencyP50: number;              // 50th percentile
  latencyP95: number;              // 95th percentile
  latencyP99: number;              // 99th percentile
  averageLatency: number;
  maxLatency: number;
  minLatency: number;

  // Component timing
  averageProviderLatency: number;
  averageBFSTime: number;
  averageLinterTime: number;

  // Quality metrics
  averageBFSScore: number;
  bfsPassRate: number;             // % of generations meeting BFS threshold
  compliancePassRate: number;      // % passing linter checks

  // Provider breakdown
  byProvider: {
    openai: { requestCount: number; avgLatency: number; successRate: number };
    claude: { requestCount: number; avgLatency: number; successRate: number };
  };
}

class AIMetricsService {
  private metrics: AIGenerationMetric[] = [];
  private readonly MAX_METRICS = 10000;

  /**
   * Record a generation metric
   */
  recordMetric(metric: AIGenerationMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow requests
    if (metric.totalDuration > 5000) {
      console.warn(`Slow AI request: ${metric.agentType} took ${metric.totalDuration}ms`, {
        provider: metric.provider,
        bfsScore: metric.bfsScore,
        success: metric.success
      });
    }

    // Log failures
    if (!metric.success) {
      console.error(`AI generation failed: ${metric.agentType}`, {
        provider: metric.provider,
        error: metric.error,
        duration: metric.totalDuration
      });
    }
  }

  /**
   * Get metrics snapshot for analysis and dashboards
   */
  getSnapshot(
    agentType?: 'doc' | 'design' | 'advisor',
    hoursBack: number = 24
  ): AIMetricsSnapshot {
    const cutoff = Date.now() - hoursBack * 3600000;

    const filtered = this.metrics.filter(m => {
      if (agentType && m.agentType !== agentType) return false;
      return new Date(m.timestamp).getTime() > cutoff;
    });

    if (filtered.length === 0) {
      return this.getEmptySnapshot(agentType || 'all');
    }

    // Calculate latency percentiles
    const latencies = filtered.map(m => m.totalDuration).sort((a, b) => a - b);
    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    // Calculate success metrics
    const successful = filtered.filter(m => m.success).length;
    const bfsPass = filtered.filter(m => m.bfsScore && m.bfsScore >= 0.8).length;
    const linterPass = filtered.filter(m => m.linterPassed).length;

    // Provider breakdown
    const openaiMetrics = filtered.filter(m => m.provider === 'openai');
    const claudeMetrics = filtered.filter(m => m.provider === 'claude');

    return {
      agentType: agentType || 'all',
      timeRange: {
        start: new Date(cutoff).toISOString(),
        end: new Date().toISOString()
      },
      totalRequests: filtered.length,
      successRate: successful / filtered.length,
      failureRate: (filtered.length - successful) / filtered.length,
      latencyP50: latencies[p50Index] || 0,
      latencyP95: latencies[p95Index] || 0,
      latencyP99: latencies[p99Index] || 0,
      averageLatency: filtered.reduce((sum, m) => sum + m.totalDuration, 0) / filtered.length,
      maxLatency: Math.max(...latencies),
      minLatency: Math.min(...latencies),
      averageProviderLatency: filtered.reduce((sum, m) => sum + m.providerLatency, 0) / filtered.length,
      averageBFSTime: filtered.reduce((sum, m) => sum + m.bfsCalculationTime, 0) / filtered.length,
      averageLinterTime: filtered.reduce((sum, m) => sum + m.linterCheckTime, 0) / filtered.length,
      averageBFSScore: filtered.reduce((sum, m) => sum + (m.bfsScore || 0), 0) / filtered.filter(m => m.bfsScore).length,
      bfsPassRate: bfsPass / filtered.filter(m => m.bfsScore).length,
      compliancePassRate: linterPass / filtered.length,
      byProvider: {
        openai: {
          requestCount: openaiMetrics.length,
          avgLatency: openaiMetrics.length > 0
            ? openaiMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / openaiMetrics.length
            : 0,
          successRate: openaiMetrics.length > 0
            ? openaiMetrics.filter(m => m.success).length / openaiMetrics.length
            : 0
        },
        claude: {
          requestCount: claudeMetrics.length,
          avgLatency: claudeMetrics.length > 0
            ? claudeMetrics.reduce((sum, m) => sum + m.totalDuration, 0) / claudeMetrics.length
            : 0,
          successRate: claudeMetrics.length > 0
            ? claudeMetrics.filter(m => m.success).length / claudeMetrics.length
            : 0
        }
      }
    };
  }

  /**
   * Get detailed metrics for a specific time range
   */
  getDetailedMetrics(
    agentType?: 'doc' | 'design' | 'advisor',
    limit: number = 100
  ): AIGenerationMetric[] {
    let filtered = [...this.metrics];

    if (agentType) {
      filtered = filtered.filter(m => m.agentType === agentType);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get alerts based on metric thresholds
   */
  getAlerts(hoursBack: number = 1): Array<{
    severity: 'low' | 'medium' | 'high';
    type: string;
    message: string;
    metric: number;
    threshold: number;
  }> {
    const snapshot = this.getSnapshot(undefined, hoursBack);
    const alerts: Array<{
      severity: 'low' | 'medium' | 'high';
      type: string;
      message: string;
      metric: number;
      threshold: number;
    }> = [];

    // High latency alert
    if (snapshot.latencyP95 > 4000) {
      alerts.push({
        severity: 'high' as const,
        type: 'latency',
        message: 'P95 latency exceeds 4 seconds',
        metric: snapshot.latencyP95,
        threshold: 4000
      });
    }

    // Low success rate alert
    if (snapshot.successRate < 0.95) {
      alerts.push({
        severity: 'high' as const,
        type: 'error_rate',
        message: 'Success rate below 95%',
        metric: snapshot.successRate * 100,
        threshold: 95
      });
    }

    // Low BFS pass rate
    if (snapshot.bfsPassRate < 0.8) {
      alerts.push({
        severity: 'medium' as const,
        type: 'quality',
        message: 'BFS pass rate below 80%',
        metric: snapshot.bfsPassRate * 100,
        threshold: 80
      });
    }

    // Low compliance rate
    if (snapshot.compliancePassRate < 0.9) {
      alerts.push({
        severity: 'medium' as const,
        type: 'compliance',
        message: 'Compliance pass rate below 90%',
        metric: snapshot.compliancePassRate * 100,
        threshold: 90
      });
    }

    return alerts;
  }

  private getEmptySnapshot(agentType: string): AIMetricsSnapshot {
    return {
      agentType: agentType as unknown,
      timeRange: {
        start: new Date().toISOString(),
        end: new Date().toISOString()
      },
      totalRequests: 0,
      successRate: 0,
      failureRate: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: 0,
      averageProviderLatency: 0,
      averageBFSTime: 0,
      averageLinterTime: 0,
      averageBFSScore: 0,
      bfsPassRate: 0,
      compliancePassRate: 0,
      byProvider: {
        openai: { requestCount: 0, avgLatency: 0, successRate: 0 },
        claude: { requestCount: 0, avgLatency: 0, successRate: 0 }
      }
    };
  }
}

export const aiMetricsService = new AIMetricsService();
