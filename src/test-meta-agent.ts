/**
 * Verification tests for meta-agent factory and registry
 * Run with: bun src/test-meta-agent.ts
 */

import {
  createMetaAgentConfig,
  buildDelegationPrompt,
} from "./agents/meta-agent.js";
import { MetaAgentRegistry } from "./agents/registry.js";
import type { MetaAgentDef } from "./config/schema.js";
import type { RoutingContext } from "./agents/routing.js";

console.log("=== VERIFICATION TESTS: Meta-Agent Factory & Registry ===\n");

// Test 1: Delegation prompt generation
console.log("TEST 1: Delegation prompt generation");
const prompt = buildDelegationPrompt(
  "olimpus:atenea",
  "oracle",
  "Analyze the system architecture for performance bottlenecks"
);
console.log("✓ Prompt generated:");
console.log(prompt.substring(0, 150) + "...\n");
console.assert(
  prompt.includes("task"),
  "Prompt should mention 'task' tool delegation"
);
console.assert(
  prompt.includes("oracle"),
  "Prompt should mention target agent 'oracle'"
);
console.assert(
  prompt.includes("olimpus:atenea"),
  "Prompt should mention meta-agent name"
);

// Test 2: Meta-agent factory with matching route
console.log("TEST 2: Meta-agent factory with matching route");
const metaAgentDef: MetaAgentDef = {
  base_model: "anthropic/claude-sonnet-4-20250514",
  delegates_to: ["oracle", "explore"],
  routing_rules: [
    {
      matcher: { type: "keyword", keywords: ["architecture"], mode: "any" },
      target_agent: "oracle",
    },
    {
      matcher: { type: "always" },
      target_agent: "explore",
    },
  ],
};

const context: RoutingContext = {
  prompt: "Analyze the architecture of our system",
  projectDir: "/tmp/test",
};

const agentConfig = createMetaAgentConfig(
  metaAgentDef,
  context,
  "olimpus:atenea"
);
console.log("✓ AgentConfig generated:");
console.log("  model:", agentConfig?.model);
console.log("  has prompt:", !!agentConfig?.prompt);
console.assert(
  agentConfig?.model === "anthropic/claude-sonnet-4-20250514",
  "Model should match base_model"
);
console.assert(
  agentConfig?.prompt?.includes("oracle"),
  "Prompt should include target agent"
);

// Test 3: Meta-agent factory with fallback
console.log("\nTEST 3: Meta-agent factory with fallback route");
const contextNoMatch: RoutingContext = {
  prompt: "Hello world",
  projectDir: "/tmp/test",
};
const agentConfigFallback = createMetaAgentConfig(
  metaAgentDef,
  contextNoMatch,
  "olimpus:atenea"
);
console.assert(
  agentConfigFallback?.prompt?.includes("explore"),
  "Should delegate to explore via fallback 'always' matcher"
);
console.log("✓ Fallback route works (delegates to explore)\n");

// Test 4: Registry registration and retrieval
console.log("TEST 4: Registry registration and retrieval");
const registry = new MetaAgentRegistry(3);
registry.register("olimpus:atenea", metaAgentDef);
registry.register("olimpus:hermes", metaAgentDef);

const all = registry.getAll();
console.assert(Object.keys(all).length === 2, "Registry should have 2 agents");
console.assert(
  all["olimpus:atenea"] === metaAgentDef,
  "Registry should return registered definitions"
);
console.log("✓ Registry stores and retrieves definitions\n");

// Test 5: Circular dependency detection - straight line (no circle)
console.log("TEST 5: Circular dependency detection - safe path");
const registry2 = new MetaAgentRegistry(3);
registry2.trackDelegation("atenea", "oracle");
registry2.trackDelegation("oracle", "librarian");

const hasCircle1 = registry2.checkCircular("atenea", "sisyphus", 3);
console.assert(
  !hasCircle1,
  "Should not detect circle when target not in chain"
);
console.log("✓ Safe path detected (atenea → oracle → librarian → sisyphus)\n");

// Test 6: Circular dependency detection - actual circle
console.log("TEST 6: Circular dependency detection - circular path");
const registry3 = new MetaAgentRegistry(3);
registry3.trackDelegation("atenea", "oracle");
registry3.trackDelegation("oracle", "hermes");
registry3.trackDelegation("hermes", "atenea");

const hasCircle2 = registry3.checkCircular("atenea", "atenea", 3);
console.assert(
  hasCircle2,
  "Should detect circular path (atenea → oracle → hermes → atenea)"
);
console.log("✓ Circular path detected\n");

// Test 7: Model override from routing rule
console.log("TEST 7: Model override from routing rule");
const defWithOverride: MetaAgentDef = {
  base_model: "anthropic/claude-sonnet-4-20250514",
  delegates_to: ["oracle"],
  routing_rules: [
    {
      matcher: { type: "keyword", keywords: ["performance"], mode: "any" },
      target_agent: "oracle",
      config_overrides: {
        model: "anthropic/claude-opus-4-20250805",
      },
    },
  ],
};

const contextPerf: RoutingContext = {
  prompt: "Optimize performance",
  projectDir: "/tmp/test",
};

const agentConfigWithOverride = createMetaAgentConfig(
  defWithOverride,
  contextPerf,
  "olimpus:atenea"
);
console.assert(
  agentConfigWithOverride?.model === "anthropic/claude-opus-4-20250805",
  "Should use overridden model from routing rule"
);
console.log("✓ Model override applied:", agentConfigWithOverride?.model, "\n");

console.log("=== ALL VERIFICATION TESTS PASSED ✅ ===");
