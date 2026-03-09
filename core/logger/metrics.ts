export interface MetricLabels {
  [key: string]: string;
}

export interface Metrics {
  incrementCounter(name: string, labels?: MetricLabels): void;
  incrementGauge(name: string, value: number, labels?: MetricLabels): void;
  recordHistogram(name: string, value: number, labels?: MetricLabels): void;
}

class PrometheusMetrics implements Metrics {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  private getKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  incrementCounter(name: string, labels?: MetricLabels): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
  }

  incrementGauge(name: string, value: number, labels?: MetricLabels): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  getMetrics(): string {
    const lines: string[] = [];

    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    this.counters.forEach((value, key) => {
      const labelPart = key.includes('{') ? key.substring(key.indexOf('{')) : '';
      lines.push(`http_requests_total${labelPart} ${value}`);
    });

    lines.push('');
    lines.push('# HELP app_up Application uptime gauge');
    lines.push('# TYPE app_up gauge');
    this.gauges.forEach((value, key) => {
      lines.push(`${key} ${value}`);
    });

    lines.push('');
    lines.push('# HELP http_request_duration_seconds HTTP request duration');
    lines.push('# TYPE http_request_duration_seconds histogram');
    this.histograms.forEach((values, key) => {
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_count ${count}`);
    });

    return lines.join('\n');
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

class NoOpMetrics implements Metrics {
  incrementCounter(_name: string, _labels?: MetricLabels): void {}
  incrementGauge(_name: string, _value: number, _labels?: MetricLabels): void {}
  recordHistogram(_name: string, _value: number, _labels?: MetricLabels): void {}
}

const metricsInstance: Metrics = process.env.ENABLE_METRICS === 'true' 
  ? new PrometheusMetrics() 
  : new NoOpMetrics();

export const metrics = metricsInstance;

export const MetricNames = {
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION: 'http_request_duration_seconds',
  ORDERS_CREATED: 'orders_created',
  PAYMENTS_PROCESSED: 'payments_processed',
  PAYMENTS_FAILED: 'payments_failed',
  CART_OPERATIONS: 'cart_operations',
  ACTIVE_USERS: 'active_users',
} as const;