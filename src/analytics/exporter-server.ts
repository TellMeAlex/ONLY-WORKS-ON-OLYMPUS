/**
 * MetricsExportServer - HTTP server for exporting performance metrics
 *
 * Provides a configurable HTTP server that serves metrics in Prometheus format
 * for monitoring systems like Prometheus, Datadog, or custom dashboards.
 *
 * Usage:
 *   const server = new MetricsExportServer(collector, { port: 9090 });
 *   await server.start();
 *   // Metrics available at http://localhost:9090/metrics
 *   await server.stop();
 */

import type { PerformanceMetrics } from "./types.js";
import { PerformanceMetricsCollector } from "./metrics.js";
import { PrometheusMetricsFormatter, type PrometheusFormatterOptions } from "./prometheus.js";

/**
 * Default server port for metrics endpoint
 */
const DEFAULT_PORT = 9090;

/**
 * Default metrics endpoint path
 */
const DEFAULT_METRICS_PATH = "/metrics";

/**
 * MetricsExportServer configuration
 */
export interface MetricsExportServerConfig {
  /**
   * Port to listen on
   * @default 9090
   */
  port?: number;

  /**
   * Path for metrics endpoint
   * @default "/metrics"
   */
  metricsPath?: string;

  /**
   * Hostname to bind to
   * @default "127.0.0.1"
   */
  hostname?: string;

  /**
   * Prometheus formatter options
   */
  formatterOptions?: Partial<PrometheusFormatterOptions>;

  /**
   * Include Content-Type header in responses
   * @default true
   */
  includeContentType?: boolean;

  /**
   * Add CORS headers to responses
   * @default false
   */
  enableCors?: boolean;

  /**
   * Custom request handler for the metrics endpoint
   * If provided, will be called instead of default handler
   */
  customHandler?: (metrics: PerformanceMetrics) => Response;
}

/**
 * Server status information
 */
export interface ServerStatus {
  /**
   * Whether the server is running
   */
  running: boolean;

  /**
   * Port the server is listening on
   */
  port: number;

  /**
   * Hostname the server is bound to
   */
  hostname: string;

  /**
   * Metrics endpoint path
   */
  metricsPath: string;

  /**
   * Server URL
   */
  url: string;

  /**
   * Uptime in seconds
   */
  uptime: number;
}

/**
 * MetricsExportServer class for serving performance metrics via HTTP
 * Uses Bun.serve() to provide a lightweight, performant metrics endpoint
 */
export class MetricsExportServer {
  private config: Omit<Required<MetricsExportServerConfig>, 'customHandler'> & Pick<MetricsExportServerConfig, 'customHandler'>;
  private collector: PerformanceMetricsCollector;
  private formatter: PrometheusMetricsFormatter;
  private server: ReturnType<typeof Bun.serve> | null = null;
  private startTime: number = 0;
  private enabled: boolean;

  /**
   * Creates a new MetricsExportServer instance
   * @param collector - PerformanceMetricsCollector instance for metrics data
   * @param config - Server configuration options
   */
  constructor(
    collector: PerformanceMetricsCollector,
    config: MetricsExportServerConfig = {},
  ) {
    // Apply defaults
    this.config = {
      port: config.port ?? DEFAULT_PORT,
      metricsPath: config.metricsPath ?? DEFAULT_METRICS_PATH,
      hostname: config.hostname ?? "127.0.0.1",
      formatterOptions: config.formatterOptions ?? {},
      includeContentType: config.includeContentType ?? true,
      enableCors: config.enableCors ?? false,
      customHandler: config.customHandler,
    };

    this.collector = collector;
    this.formatter = new PrometheusMetricsFormatter(this.config.formatterOptions);
    this.enabled = true;
  }

  /**
   * Starts the metrics server
   * @throws Error if server is already running or fails to start
   */
  async start(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    if (this.server !== null) {
      throw new Error("MetricsExportServer is already running");
    }

    try {
      this.startTime = Date.now();
      this.server = Bun.serve({
        hostname: this.config.hostname,
        port: this.config.port,
        fetch: this.handleRequest.bind(this),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start MetricsExportServer: ${message}`);
    }
  }

  /**
   * Stops the metrics server
   */
  async stop(): Promise<void> {
    if (this.server === null) {
      return;
    }

    try {
      this.server.stop();
      this.server = null;
    } catch {
      // Silently fail to avoid disrupting application shutdown
    }
  }

  /**
   * Gets the current server status
   * @returns Server status information
   */
  getStatus(): ServerStatus {
    const running = this.server !== null;
    const uptime = running ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    return {
      running,
      port: this.config.port,
      hostname: this.config.hostname,
      metricsPath: this.config.metricsPath,
      url: `http://${this.config.hostname}:${this.config.port}${this.config.metricsPath}`,
      uptime,
    };
  }

  /**
   * Checks if the server is running
   * @returns Whether the server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Gets the server URL
   * @returns Full URL to the metrics endpoint
   */
  getServerUrl(): string {
    return `http://${this.config.hostname}:${this.config.port}${this.config.metricsPath}`;
  }

  /**
   * Gets metrics endpoint path
   * @returns Metrics endpoint path
   */
  getMetricsPath(): string {
    return this.config.metricsPath;
  }

  /**
   * Gets server port
   * @returns Server port
   */
  getPort(): number {
    return this.config.port;
  }

  /**
   * Gets server hostname
   * @returns Server hostname
   */
  getHostname(): string {
    return this.config.hostname;
  }

  /**
   * Gets the metrics collector instance
   * @returns PerformanceMetricsCollector instance
   */
  getCollector(): PerformanceMetricsCollector {
    return this.collector;
  }

  /**
   * Gets the Prometheus formatter instance
   * @returns PrometheusMetricsFormatter instance
   */
  getFormatter(): PrometheusMetricsFormatter {
    return this.formatter;
  }

  /**
   * Updates the server configuration
   * Note: Port and hostname changes require a restart to take effect
   * @param config - New configuration options (partial)
   */
  updateConfig(config: Partial<MetricsExportServerConfig>): void {
    if (config.port !== undefined) {
      this.config.port = config.port;
    }
    if (config.metricsPath !== undefined) {
      this.config.metricsPath = config.metricsPath;
    }
    if (config.hostname !== undefined) {
      this.config.hostname = config.hostname;
    }
    if (config.formatterOptions !== undefined) {
      this.config.formatterOptions = config.formatterOptions;
      this.formatter.updateOptions(config.formatterOptions);
    }
    if (config.includeContentType !== undefined) {
      this.config.includeContentType = config.includeContentType;
    }
    if (config.enableCors !== undefined) {
      this.config.enableCors = config.enableCors;
    }
    if (config.customHandler !== undefined) {
      this.config.customHandler = config.customHandler;
    }
  }

  /**
   * Checks if metrics export is enabled
   * @returns Whether metrics export is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables metrics export
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disables metrics export
   * Does not stop the server if it's running
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Handles incoming HTTP requests
   * @param req - Incoming request
   * @returns HTTP response
   */
  private handleRequest(req: Request): Response {
    try {
      const url = new URL(req.url);

      // Check if path matches metrics endpoint
      if (url.pathname === this.config.metricsPath) {
        return this.handleMetricsRequest(req);
      }

      // Health check endpoint
      if (url.pathname === "/health") {
        return this.handleHealthRequest();
      }

      // Root endpoint with usage info
      if (url.pathname === "/") {
        return this.handleRootRequest();
      }

      // 404 for unknown paths
      return this.createResponse("Not Found", 404);
    } catch {
      return this.createResponse("Internal Server Error", 500);
    }
  }

  /**
   * Handles requests to the metrics endpoint
   * @param req - Incoming request
   * @returns HTTP response with metrics data
   */
  private handleMetricsRequest(req: Request): Response {
    try {
      // Only respond to GET requests
      if (req.method !== "GET") {
        return this.createResponse("Method Not Allowed", 405, {
          Allow: "GET",
        });
      }

      // Get metrics from collector
      const metrics = this.collector.getMetrics();

      // Use custom handler if provided
      if (this.config.customHandler) {
        return this.config.customHandler(metrics);
      }

      // Format metrics as Prometheus text
      const prometheusText = this.formatter.format(metrics);

      return this.createResponse(prometheusText, 200, {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      });
    } catch {
      return this.createResponse("Failed to generate metrics", 500);
    }
  }

  /**
   * Handles health check requests
   * @returns HTTP response with health status
   */
  private handleHealthRequest(): Response {
    const status = this.getStatus();
    const healthData = {
      status: status.running ? "healthy" : "unhealthy",
      uptime: status.uptime,
      timestamp: new Date().toISOString(),
    };

    return this.createResponse(JSON.stringify(healthData, null, 2), 200, {
      "Content-Type": "application/json",
    });
  }

  /**
   * Handles requests to the root path
   * @returns HTTP response with usage information
   */
  private handleRootRequest(): Response {
    const status = this.getStatus();
    const usageInfo = {
      name: "MetricsExportServer",
      version: "1.0.0",
      endpoints: {
        metrics: status.metricsPath,
        health: "/health",
      },
      status,
      prometheus: {
        format: "Prometheus exposition format",
        scrape_interval: "Recommended: 15s-60s",
      },
    };

    return this.createResponse(JSON.stringify(usageInfo, null, 2), 200, {
      "Content-Type": "application/json",
    });
  }

  /**
   * Creates an HTTP response with appropriate headers
   * @param body - Response body
   * @param status - HTTP status code
   * @param additionalHeaders - Additional headers to include
   * @returns HTTP response
   */
  private createResponse(
    body: string,
    status: number = 200,
    additionalHeaders: Record<string, string> = {},
  ): Response {
    const headers: Record<string, string> = {};

    // Add Content-Type if enabled
    if (this.config.includeContentType && status !== 204) {
      if (!additionalHeaders["Content-Type"]) {
        headers["Content-Type"] = "text/plain; charset=utf-8";
      }
    }

    // Add CORS headers if enabled
    if (this.config.enableCors) {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Content-Type";
    }

    // Add additional headers
    Object.assign(headers, additionalHeaders);

    return new Response(body, { status, headers });
  }

  /**
   * Restarts the server with current configuration
   * Useful for applying configuration changes
   * @throws Error if server is not running or restart fails
   */
  async restart(): Promise<void> {
    const wasRunning = this.server !== null;

    await this.stop();

    if (wasRunning && this.enabled) {
      await this.start();
    }
  }
}

/**
 * Convenience function to create and start a metrics server
 * @param collector - PerformanceMetricsCollector instance
 * @param config - Server configuration options
 * @returns MetricsExportServer instance (already started)
 */
export async function createMetricsExportServer(
  collector: PerformanceMetricsCollector,
  config?: MetricsExportServerConfig,
): Promise<MetricsExportServer> {
  const server = new MetricsExportServer(collector, config);
  await server.start();
  return server;
}

/**
 * Convenience function to create a metrics server (not auto-started)
 * @param collector - PerformanceMetricsCollector instance
 * @param config - Server configuration options
 * @returns MetricsExportServer instance
 */
export function createMetricsExportServerStopped(
  collector: PerformanceMetricsCollector,
  config?: MetricsExportServerConfig,
): MetricsExportServer {
  return new MetricsExportServer(collector, config);
}
