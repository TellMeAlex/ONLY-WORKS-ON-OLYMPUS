import type { AnalyticsEvent, AnalyticsConfig } from "./types.js";
import { dirname } from "path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";

const CURRENT_VERSION = "1.0.0";

/**
 * AnalyticsData interface for the storage file format
 * Includes events, metrics, and metadata
 */
export interface AnalyticsData {
  events: AnalyticsEvent[];
  agent_metrics: Record<string, unknown>;
  matcher_metrics: Record<string, unknown>;
  total_events: number;
  first_event_timestamp?: string;
  last_event_timestamp?: string;
  version: string;
}

/**
 * AnalyticsStorage class for persistent storage of analytics data
 * Stores events to a JSON file with configurable retention and max events
 * Supports pruning old events based on retention policy
 */
export class AnalyticsStorage {
  private config: Required<AnalyticsConfig>;
  private enabled: boolean;
  private storageFilePath: string;
  private inMemoryEvents: AnalyticsEvent[] = [];

  constructor(config: Partial<AnalyticsConfig> = {}) {
    // Apply defaults
    this.config = {
      enabled: config.enabled ?? true,
      storage_file: config.storage_file ?? "analytics.json",
      max_events: config.max_events ?? 10000,
      retention_days: config.retention_days ?? 90,
      auto_prune: config.auto_prune ?? true,
    };

    // Determine if storage is enabled
    this.enabled = this.config.enabled;
    this.storageFilePath = this.config.storage_file;

    // Load existing data on initialization
    this.loadFromFile();
  }

  /**
   * Records an analytics event to storage
   * Triggers automatic pruning if enabled
   */
  recordEvent(event: AnalyticsEvent): void {
    if (!this.enabled) {
      return;
    }

    try {
      // Add event to in-memory list
      this.inMemoryEvents.push(event);

      // Auto-prune if enabled
      if (this.config.auto_prune) {
        this.pruneEvents();
      }

      // Write to file
      this.saveToFile();
    } catch (error: unknown) {
      // Log error but don't disrupt routing logic
      // This ensures analytics failures don't impact agent selection
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Analytics] Failed to record event: ${message}`);
    }
  }

  /**
   * Retrieves all stored events
   */
  getAllEvents(): AnalyticsEvent[] {
    if (!this.enabled) {
      return [];
    }

    return [...this.inMemoryEvents];
  }

  /**
   * Retrieves events within a date range
   */
  getEventsByDateRange(startDate: Date, endDate: Date): AnalyticsEvent[] {
    if (!this.enabled) {
      return [];
    }

    const start = startDate.getTime();
    const end = endDate.getTime();

    return this.inMemoryEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Retrieves events for a specific agent
   */
  getEventsByAgent(agentName: string): AnalyticsEvent[] {
    if (!this.enabled) {
      return [];
    }

    return this.inMemoryEvents.filter((event) => {
      return (
        event.type === "routing_decision" && event.target_agent === agentName
      );
    });
  }

  /**
   * Retrieves events for a specific matcher type
   */
  getEventsByMatcherType(matcherType: string): AnalyticsEvent[] {
    if (!this.enabled) {
      return [];
    }

    return this.inMemoryEvents.filter((event) => {
      return (
        event.type === "routing_decision" && event.matcher_type === matcherType
      );
    });
  }

  /**
   * Retrieves unmatched request events
   */
  getUnmatchedRequests(): AnalyticsEvent[] {
    if (!this.enabled) {
      return [];
    }

    return this.inMemoryEvents.filter((event) => {
      return event.type === "unmatched_request";
    });
  }

  /**
   * Returns the total count of stored events
   */
  getEventCount(): number {
    if (!this.enabled) {
      return 0;
    }

    return this.inMemoryEvents.length;
  }

  /**
   * Prunes events based on retention days and max_events limit
   * Removes events older than retention_days
   * Removes excess events if count exceeds max_events
   */
  pruneEvents(): void {
    if (!this.enabled || this.inMemoryEvents.length === 0) {
      return;
    }

    const now = Date.now();
    const retentionMs = this.config.retention_days * 24 * 60 * 60 * 1000;
    const retentionThreshold = now - retentionMs;

    // Filter out events older than retention period
    const afterRetention = this.inMemoryEvents.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= retentionThreshold;
    });

    // If still too many events, remove oldest ones
    if (afterRetention.length > this.config.max_events) {
      const excessCount = afterRetention.length - this.config.max_events;
      afterRetention.splice(0, excessCount);
    }

    this.inMemoryEvents = afterRetention;
  }

  /**
   * Clears all stored events
   */
  clear(): void {
    if (!this.enabled) {
      return;
    }

    try {
      this.inMemoryEvents = [];
      this.saveToFile();
    } catch {
      // Silently fail to avoid disrupting routing logic
    }
  }

  /**
   * Exports all data in AnalyticsData format
   */
  exportData(): AnalyticsData {
    const now = new Date().toISOString();

    // Sort events by timestamp
    const sortedEvents = [...this.inMemoryEvents].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );

    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const firstTimestamp = firstEvent?.timestamp;
    const lastTimestamp = lastEvent?.timestamp;

    return {
      events: sortedEvents,
      agent_metrics: {},
      matcher_metrics: {},
      total_events: sortedEvents.length,
      first_event_timestamp: firstTimestamp,
      last_event_timestamp: lastTimestamp,
      version: CURRENT_VERSION,
    };
  }

  /**
   * Checks if storage is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Loads events from the storage file
   * Populates in-memory cache with existing data
   */
  private loadFromFile(): void {
    if (!this.enabled) {
      return;
    }

    try {
      const fileExists = existsSync(this.storageFilePath);
      if (!fileExists) {
        // No existing file, start with empty data
        this.inMemoryEvents = [];
        return;
      }

      // Read file synchronously
      const content = readFileSync(this.storageFilePath, "utf-8");

      // Parse JSON
      const data = JSON.parse(content) as AnalyticsData;

      // Extract events from stored data
      if (Array.isArray(data.events)) {
        this.inMemoryEvents = data.events;
      } else {
        this.inMemoryEvents = [];
      }

      // Auto-prune on load if enabled
      if (this.config.auto_prune) {
        this.pruneEvents();
      }
    } catch {
      // If file doesn't exist or is invalid, start fresh
      this.inMemoryEvents = [];
    }
  }

  /**
   * Saves current events to the storage file
   * Writes in AnalyticsData format with metadata
   */
  private saveToFile(): void {
    if (!this.enabled) {
      return;
    }

    try {
      // Ensure parent directory exists
      const dir = dirname(this.storageFilePath);
      try {
        mkdirSync(dir, { recursive: true });
      } catch {
        // Directory might already exist, ignore error
      }

      // Export data and write to file
      const data = this.exportData();
      const json = JSON.stringify(data, null, 2);
      writeFileSync(this.storageFilePath, json, "utf-8");
    } catch {
      // Silently fail to avoid disrupting routing logic
      // Error is swallowed per performance pattern - minimal overhead
    }
  }
}
