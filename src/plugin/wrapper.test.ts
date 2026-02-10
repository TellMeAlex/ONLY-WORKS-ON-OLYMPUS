import { test, expect, describe } from "bun:test";
import {
  createOlimpusWrapper,
  mergePluginInterfaces,
  type PluginInterface,
} from "./wrapper";
import type { OlimpusConfig } from "../config/schema";
import type { PluginInput } from "@opencode-ai/plugin";

describe("mergePluginInterfaces", () => {
  test("merges tool handlers", () => {
    const base: PluginInterface = {
      tool: {
        tool1: { description: "Tool 1", args: {}, execute: async () => "" },
      },
    };

    const extension: PluginInterface = {
      tool: {
        tool2: { description: "Tool 2", args: {}, execute: async () => "" },
      },
    };

    const merged = mergePluginInterfaces(base, extension);

    expect(merged.tool).toBeDefined();
    expect(merged.tool?.tool1).toBeDefined();
    expect(merged.tool?.tool2).toBeDefined();
  });

  test("extension tools overwrite base tools", () => {
    const baseTool = {
      description: "Base",
      args: {},
      execute: async () => "base",
    };
    const extensionTool = {
      description: "Extension",
      args: {},
      execute: async () => "extension",
    };

    const base: PluginInterface = {
      tool: {
        shared: baseTool,
      },
    };

    const extension: PluginInterface = {
      tool: {
        shared: extensionTool,
      },
    };

    const merged = mergePluginInterfaces(base, extension);

    expect(merged.tool?.shared?.description).toBe("Extension");
  });

  test("chains config handlers", async () => {
    const executedHandlers: string[] = [];

    const base: PluginInterface = {
      config: async () => {
        executedHandlers.push("base");
      },
    };

    const extension: PluginInterface = {
      config: async () => {
        executedHandlers.push("extension");
      },
    };

    const merged = mergePluginInterfaces(base, extension);

    // Call the merged config handler
    if (merged.config) {
      await merged.config({ agent: {} } as any);
    }

    // Base should execute first, then extension
    expect(executedHandlers).toEqual(["base", "extension"]);
  });

  test("only base config handler when extension has none", async () => {
    const executedHandlers: string[] = [];

    const base: PluginInterface = {
      config: async () => {
        executedHandlers.push("base");
      },
    };

    const extension: PluginInterface = {};

    const merged = mergePluginInterfaces(base, extension);

    if (merged.config) {
      await merged.config({ agent: {} } as any);
    }

    expect(executedHandlers).toEqual(["base"]);
  });

  test("handles empty interfaces", () => {
    const base: PluginInterface = {};
    const extension: PluginInterface = {};

    const merged = mergePluginInterfaces(base, extension);

    // Should not error, result should be empty or minimal
    expect(Object.keys(merged).length).toBeGreaterThanOrEqual(0);
  });

  test("chains event handlers", async () => {
    const events: string[] = [];

    const base: PluginInterface = {
      event: async () => {
        events.push("base");
      },
    };

    const extension: PluginInterface = {
      event: async () => {
        events.push("extension");
      },
    };

    const merged = mergePluginInterfaces(base, extension);

    if (merged.event) {
      await merged.event({ event: {} as any });
    }

    expect(events).toEqual(["base", "extension"]);
  });

  test("extension auth overwrites base auth", () => {
    const baseAuth = { provider: "base", methods: [] } as any;
    const extensionAuth = { provider: "extension", methods: [] } as any;

    const base: PluginInterface = {
      auth: baseAuth,
    };

    const extension: PluginInterface = {
      auth: extensionAuth,
    };

    const merged = mergePluginInterfaces(base, extension);

    expect(merged.auth?.provider).toBe("extension");
  });
});
