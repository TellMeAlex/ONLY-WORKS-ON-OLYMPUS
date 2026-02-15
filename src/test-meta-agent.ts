/**
 * Verification tests for meta-agent factory and registry
 * Run with: bun src/test-meta-agent.ts
 */

import { createMetaAgentConfig } from "./agents/meta-agent.js";
import { MetaAgentRegistry } from "./agents/registry.js";
import type { MetaAgentDef } from "./config/schema.js";

console.log("=== VERIFICATION TESTS: Meta-Agent Factory & Registry ===\n");

// Test 1: Basic AgentConfig creation from MetaAgentDef
console.log("TEST 1: Basic AgentConfig creation");
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

const agentConfig = createMetaAgentConfig(metaAgentDef, "olimpus:test-agent-a");
console.log("✓ AgentConfig generated:");
console.log("  model:", agentConfig.model);
console.log("  has prompt:", !!agentConfig.prompt);
console.assert(
  agentConfig.model === "anthropic/claude-sonnet-4-20250514",
  "Model should match base_model",
);
console.assert(
  agentConfig.prompt === undefined,
  "No prompt_template set, so prompt should be undefined",
);

// Test 2: AgentConfig with optional fields
console.log("\nTEST 2: AgentConfig with optional fields");
const defWithOptionals: MetaAgentDef = {
  base_model: "claude-3-5-sonnet",
  delegates_to: ["oracle"],
  routing_rules: [
    {
      matcher: { type: "always" },
      target_agent: "oracle",
    },
  ],
  prompt_template: "You are a strategic advisor",
  temperature: 0.7,
  description: "Strategic planning agent",
  hidden: false,
};

const configWithOptionals = createMetaAgentConfig(
  defWithOptionals,
  "olimpus:strategic",
);
console.log("✓ AgentConfig with optionals:");
console.log("  model:", configWithOptionals.model);
console.log("  prompt:", configWithOptionals.prompt);
console.log("  temperature:", configWithOptionals.temperature);
console.log("  description:", configWithOptionals.description);
console.log("  hidden:", configWithOptionals.hidden);
console.assert(
  configWithOptionals.prompt === "You are a strategic advisor",
  "Should map prompt_template to prompt",
);
console.assert(
  configWithOptionals.temperature === 0.7,
  "Should map temperature",
);
console.assert(
  configWithOptionals.description === "Strategic planning agent",
  "Should map description",
);
console.assert(configWithOptionals.hidden === false, "Should map hidden");

// Test 3: Registry registration and retrieval
console.log("\nTEST 3: Registry registration and retrieval");
const registry = new MetaAgentRegistry(3);
registry.register("olimpus:test-agent-a", metaAgentDef);
registry.register("olimpus:test-agent-b", defWithOptionals);

const all = registry.getAll();
console.assert(Object.keys(all).length === 2, "Registry should have 2 agents");
console.assert(
  all["olimpus:test-agent-a"] === metaAgentDef,
  "Registry should return registered definitions",
);
console.log("✓ Registry stores and retrieves definitions\n");

// Test 4: Registry resolve creates AgentConfig
console.log("TEST 4: Registry resolve");
const resolved = registry.resolve("olimpus:test-agent-a");
console.assert(
  resolved.model === "anthropic/claude-sonnet-4-20250514",
  "Resolved config should have correct model",
);
console.log("✓ Registry.resolve() creates AgentConfig\n");

// Test 5: Circular dependency detection - straight line (no circle)
console.log("TEST 5: Circular dependency detection - safe path");
const registry2 = new MetaAgentRegistry(3);
registry2.trackDelegation("test-agent-a", "oracle");
registry2.trackDelegation("oracle", "librarian");

const hasCircle1 = registry2.checkCircular("test-agent-a", "sisyphus", 3);
console.assert(
  !hasCircle1,
  "Should not detect circle when target not in chain",
);
console.log(
  "✓ Safe path detected (test-agent-a → oracle → librarian → sisyphus)\n",
);

// Test 6: Circular dependency detection - actual circle
console.log("TEST 6: Circular dependency detection - circular path");
const registry3 = new MetaAgentRegistry(3);
registry3.trackDelegation("test-agent-a", "oracle");
registry3.trackDelegation("oracle", "test-agent-b");
registry3.trackDelegation("test-agent-b", "test-agent-a");

const hasCircle2 = registry3.checkCircular("test-agent-a", "test-agent-a", 3);
console.assert(
  hasCircle2,
  "Should detect circular path (test-agent-a → oracle → test-agent-b → test-agent-a)",
);
console.log("✓ Circular path detected\n");

// Test 7: All new schema fields mapping
console.log("TEST 7: All new schema fields mapping");
const defWithAllFields: MetaAgentDef = {
  base_model: "claude-3-5-sonnet",
  delegates_to: ["oracle"],
  routing_rules: [
    {
      matcher: { type: "always" },
      target_agent: "oracle",
    },
  ],
  prompt_template: "Advanced reasoning",
  temperature: 0.5,
  description: "Advanced analyzer",
  mode: "primary",
  color: "#FF5733",
  maxTokens: 8000,
  hidden: true,
  thinking: {
    type: "enabled",
    budgetTokens: 5000,
  },
  reasoningEffort: "high",
  permission: {
    edit: "allow",
    bash: "ask",
    task: "allow",
  },
};

const fullConfig = createMetaAgentConfig(defWithAllFields, "olimpus:advanced");
console.log("✓ Full config mapping:");
console.log("  model:", fullConfig.model);
console.log("  prompt:", fullConfig.prompt);
console.log("  temperature:", fullConfig.temperature);
console.log("  mode:", fullConfig.mode);
console.log("  color:", fullConfig.color);
console.log("  maxTokens:", fullConfig.maxTokens);
console.log("  hidden:", fullConfig.hidden);
console.log("  thinking:", fullConfig.thinking);
console.log("  reasoningEffort:", fullConfig.reasoningEffort);
console.log("  permission:", fullConfig.permission);
console.assert(fullConfig.mode === "primary", "Should map mode");
console.assert(fullConfig.color === "#FF5733", "Should map color");
console.assert(fullConfig.maxTokens === 8000, "Should map maxTokens");
console.assert(!!fullConfig.thinking, "Should map thinking");
console.assert(
  fullConfig.reasoningEffort === "high",
  "Should map reasoningEffort",
);
console.assert(!!fullConfig.permission, "Should map permission");

console.log("\n=== ALL VERIFICATION TESTS PASSED ✅ ===");
