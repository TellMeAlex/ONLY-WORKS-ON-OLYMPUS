import type { OlimpusConfig } from "$lib/types";
import { OlimpusConfigSchema } from "@olimpus/types";

export interface ConfigPersistence {
  load(): Promise<OlimpusConfig>;
  save(config: OlimpusConfig): Promise<void>;
  isAvailable(): Promise<boolean>;
  getMode(): "connected" | "standalone";
  scheduleAutoSave?(config: OlimpusConfig): void;
}

export class ConnectedPersistence implements ConfigPersistence {
  private baseUrl = "http://localhost:3000";

  getMode(): "connected" {
    return "connected";
  }

  async load(): Promise<OlimpusConfig> {
    const res = await fetch(`${this.baseUrl}/api/config`);
    if (!res.ok) throw new Error("Failed to load config");
    const data = await res.json();
    return OlimpusConfigSchema.parse(data);
  }

  async save(config: OlimpusConfig): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to save config");
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export class StandalonePersistence implements ConfigPersistence {
  private key = "olimpus-config";
  private timer: ReturnType<typeof setTimeout> | null = null;

  getMode(): "standalone" {
    return "standalone";
  }

  async load(): Promise<OlimpusConfig> {
    const raw = localStorage.getItem(this.key);
    if (!raw) throw new Error("No config in localStorage");
    return OlimpusConfigSchema.parse(JSON.parse(raw));
  }

  async save(config: OlimpusConfig): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(config));
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  scheduleAutoSave(config: OlimpusConfig): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.save(config);
    }, 2000);
  }
}

export async function createPersistence(): Promise<ConfigPersistence> {
  const connected = new ConnectedPersistence();
  if (await connected.isAvailable()) return connected;
  return new StandalonePersistence();
}
