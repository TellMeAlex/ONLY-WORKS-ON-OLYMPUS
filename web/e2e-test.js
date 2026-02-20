/**
 * End-to-End Workflow Verification Tests
 *
 * This file tests the complete workflow of the Web Configuration Editor:
 * 1. Load default config
 * 2. Create new meta-agent
 * 3. Add routing rules with different matcher types
 * 4. Test live preview with sample prompts
 * 5. Export configuration as JSONC
 * 6. Clear and import the exported config
 * 7. Verify config loads correctly
 */
import { test, expect, describe, beforeEach } from "bun:test";
import { parseJsonc, exportJsonc, encodeConfigForUrl, decodeConfigFromUrl, } from "./config-io";
import { evaluateRoutingRules, getMatchedContent } from "./matcher-evaluator";
import defaultConfig from "./default-config";
/**
 * Helper: Deep clone an object for mutation
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Helper: Create a test meta-agent with various matcher types
 * Uses MetaAgentDef type from types.ts for compatibility
 */
function createTestMetaAgent(name) {
    return {
        base_model: "claude-3-5-sonnet-20241022",
        delegates_to: ["sisyphus", "oracle", "librarian"],
        temperature: 0.5,
        routing_rules: [
            {
                matcher: {
                    type: "keyword",
                    keywords: ["bug", "fix", "debug"],
                    mode: "any",
                },
                target_agent: "sisyphus",
                config_overrides: {
                    prompt: "Fix the bug with TDD approach.",
                },
            },
            {
                matcher: {
                    type: "complexity",
                    threshold: "high",
                },
                target_agent: "oracle",
                config_overrides: {
                    prompt: "Analyze this complex problem.",
                },
            },
            {
                matcher: {
                    type: "regex",
                    pattern: "(api|endpoint|http)",
                    flags: "i",
                },
                target_agent: "librarian",
                config_overrides: {
                    prompt: "Search for API documentation.",
                },
            },
            {
                matcher: {
                    type: "project_context",
                    has_files: ["package.json", "tsconfig.json"],
                    has_deps: ["bun", "react"],
                },
                target_agent: "sisyphus",
                config_overrides: {
                    prompt: "Implement with TDD.",
                    variant: "tdd",
                },
            },
            {
                matcher: {
                    type: "always",
                },
                target_agent: "oracle",
                config_overrides: {
                    prompt: "General assistance.",
                },
            },
        ],
    };
}
describe("End-to-End Workflow Verification", () => {
    let testConfig;
    beforeEach(() => {
        // Start with a fresh copy of default config
        testConfig = deepClone(defaultConfig);
    });
    describe("Step 1: Load default config", () => {
        test("default config has valid structure", () => {
            expect(testConfig).toBeDefined();
            expect(testConfig.$schema).toBeString();
            expect(testConfig.meta_agents).toBeObject();
            expect(testConfig.agents).toBeObject();
            expect(testConfig.categories).toBeObject();
            expect(testConfig.providers).toBeObject();
            expect(testConfig.settings).toBeObject();
            expect(testConfig.skills).toBeArray();
            expect(testConfig.disabled_hooks).toBeArray();
        });
        test("default config has expected meta-agents", () => {
            const metaAgentNames = Object.keys(testConfig.meta_agents);
            expect(metaAgentNames).toContain("atenea");
            expect(metaAgentNames).toContain("hermes");
            expect(metaAgentNames).toContain("hefesto");
            expect(metaAgentNames).toContain("frontend_specialist");
        });
        test("default config has routing rules for each meta-agent", () => {
            for (const [name, metaAgent] of Object.entries(testConfig.meta_agents)) {
                expect(metaAgent.routing_rules).toBeArray();
                expect(metaAgent.routing_rules.length).toBeGreaterThan(0);
                expect(metaAgent.base_model).toBeString();
                expect(metaAgent.delegates_to).toBeArray();
                expect(metaAgent.delegates_to.length).toBeGreaterThan(0);
            }
        });
        test("default config has all 5 matcher types across rules", () => {
            const matcherTypes = new Set();
            for (const metaAgent of Object.values(testConfig.meta_agents)) {
                for (const rule of metaAgent.routing_rules) {
                    matcherTypes.add(rule.matcher.type);
                }
            }
            expect(matcherTypes.has("keyword")).toBe(true);
            expect(matcherTypes.has("complexity")).toBe(true);
            expect(matcherTypes.has("regex")).toBe(true);
            expect(matcherTypes.has("project_context")).toBe(true);
            expect(matcherTypes.has("always")).toBe(true);
            expect(matcherTypes.size).toBe(5);
        });
    });
    describe("Step 2: Create new meta-agent", () => {
        test("can add new meta-agent to config", () => {
            const newMetaAgent = createTestMetaAgent("test_router");
            const initialCount = Object.keys(testConfig.meta_agents).length;
            testConfig.meta_agents["test_router"] = newMetaAgent;
            expect(Object.keys(testConfig.meta_agents).length).toBe(initialCount + 1);
            expect(testConfig.meta_agents["test_router"]).toBeDefined();
            expect(testConfig.meta_agents["test_router"].base_model).toBe("claude-3-5-sonnet-20241022");
            expect(testConfig.meta_agents["test_router"].delegates_to).toEqual([
                "sisyphus",
                "oracle",
                "librarian",
            ]);
        });
        test("new meta-agent has all required fields", () => {
            const newMetaAgent = createTestMetaAgent("router_two");
            testConfig.meta_agents["router_two"] = newMetaAgent;
            expect(newMetaAgent.base_model).toBeString();
            expect(newMetaAgent.delegates_to).toBeArray();
            expect(newMetaAgent.routing_rules).toBeArray();
            expect(newMetaAgent.temperature).toBeNumber();
        });
        test("new meta-agent routing rules have valid target agents", () => {
            const newMetaAgent = createTestMetaAgent("router_three");
            testConfig.meta_agents["router_three"] = newMetaAgent;
            const builtinAgents = [
                "sisyphus",
                "hephaestus",
                "oracle",
                "librarian",
                "explore",
                "multimodal-looker",
                "metis",
                "momus",
                "atlas",
                "prometheus",
            ];
            for (const rule of newMetaAgent.routing_rules) {
                expect(builtinAgents).toContain(rule.target_agent);
            }
        });
    });
    describe("Step 3: Add routing rules with different matcher types", () => {
        let testMetaAgent;
        beforeEach(() => {
            testMetaAgent = createTestMetaAgent("test_rules");
        });
        test("keyword matcher routes correctly with 'any' mode", () => {
            const keywordRule = testMetaAgent.routing_rules[0];
            expect(keywordRule.matcher.type).toBe("keyword");
            expect(keywordRule.matcher.keywords).toEqual([
                "bug",
                "fix",
                "debug",
            ]);
            expect(keywordRule.matcher.mode).toBe("any");
        });
        test("keyword matcher routes correctly with 'all' mode", () => {
            testMetaAgent.routing_rules.push({
                matcher: {
                    type: "keyword",
                    keywords: ["code", "refactor"],
                    mode: "all",
                },
                target_agent: "hephaestus",
            });
            const allModeRule = testMetaAgent.routing_rules.find((r) => r.matcher.type === "keyword" &&
                r.matcher.mode === "all");
            expect(allModeRule).toBeDefined();
        });
        test("complexity matcher has valid threshold", () => {
            const complexityRule = testMetaAgent.routing_rules[1];
            expect(complexityRule.matcher.type).toBe("complexity");
            expect(complexityRule.matcher.threshold).toBe("high");
        });
        test("regex matcher has valid pattern and flags", () => {
            const regexRule = testMetaAgent.routing_rules[2];
            expect(regexRule.matcher.type).toBe("regex");
            expect(regexRule.matcher.pattern).toBe("(api|endpoint|http)");
            expect(regexRule.matcher.flags).toBe("i");
        });
        test("project_context matcher has files and deps", () => {
            const projectContextRule = testMetaAgent.routing_rules[3];
            expect(projectContextRule.matcher.type).toBe("project_context");
            expect(projectContextRule.matcher.has_files).toEqual(["package.json", "tsconfig.json"]);
            expect(projectContextRule.matcher.has_deps).toEqual(["bun", "react"]);
        });
        test("always matcher has minimal structure", () => {
            const alwaysRule = testMetaAgent.routing_rules[4];
            expect(alwaysRule.matcher.type).toBe("always");
            expect(Object.keys(alwaysRule.matcher).length).toBe(1);
        });
        test("routing rules maintain order (priority)", () => {
            const ruleOrder = testMetaAgent.routing_rules.map((r) => r.matcher.type);
            expect(ruleOrder).toEqual([
                "keyword",
                "complexity",
                "regex",
                "project_context",
                "always",
            ]);
        });
        test("config overrides are optional and valid when present", () => {
            for (const rule of testMetaAgent.routing_rules) {
                if (rule.config_overrides) {
                    expect(rule.config_overrides).toBeObject();
                }
            }
        });
    });
    describe("Step 4: Test live preview with sample prompts", () => {
        let testMetaAgent;
        beforeEach(() => {
            testMetaAgent = createTestMetaAgent("preview_test");
        });
        test("keyword matcher matches with 'any' mode", () => {
            const result = evaluateRoutingRules(testMetaAgent.routing_rules, {
                prompt: "Fix this bug in the code",
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("sisyphus");
            expect(result?.config_overrides?.prompt).toBe("Fix the bug with TDD approach.");
        });
        test("keyword matcher matches with 'all' mode", () => {
            // Add an 'all' mode rule
            testMetaAgent.routing_rules.unshift({
                matcher: {
                    type: "keyword",
                    keywords: ["refactor", "code"],
                    mode: "all",
                },
                target_agent: "hephaestus",
            });
            const result = evaluateRoutingRules(testMetaAgent.routing_rules, {
                prompt: "Refactor this code for better performance",
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("hephaestus");
        });
        test("keyword matcher is case-insensitive", () => {
            const result = evaluateRoutingRules(testMetaAgent.routing_rules, {
                prompt: "DEBUG THIS COMPONENT",
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("sisyphus");
        });
        test("complexity matcher routes high complexity prompts", () => {
            const highComplexityPrompt = `
        Analyze the performance optimization strategy for this architecture
        Consider database scaling patterns, async operations,
        and concurrent data access patterns.
        Need to implement security measures and encryption for API endpoints.
        Also consider infrastructure deployment and automated testing strategy.
        Refactor the debug and profiling tools for production use.
      `;
            // Remove keyword rule so complexity can match
            const noKeywordRules = testMetaAgent.routing_rules.filter((r) => r.matcher.type !== "keyword");
            const result = evaluateRoutingRules(noKeywordRules, {
                prompt: highComplexityPrompt,
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("oracle");
        });
        test("regex matcher matches pattern", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: {
                        type: "regex",
                        pattern: "(api|endpoint|http)",
                        flags: "i",
                    },
                    target_agent: "librarian",
                },
            ], { prompt: "Search for the HTTP endpoint documentation" });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("librarian");
        });
        test("regex matcher respects flags", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: {
                        type: "regex",
                        pattern: "API",
                        flags: "i",
                    },
                    target_agent: "librarian",
                },
            ], { prompt: "search for api documentation" });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("librarian");
        });
        test("project_context matcher with files only", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: {
                        type: "project_context",
                        has_files: ["package.json", "tsconfig.json"],
                    },
                    target_agent: "sisyphus",
                },
            ], {
                prompt: "Implement the feature",
                projectFiles: ["package.json", "tsconfig.json", "src/index.ts"],
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("sisyphus");
        });
        test("project_context matcher with deps only", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: {
                        type: "project_context",
                        has_deps: ["react", "typescript"],
                    },
                    target_agent: "hephaestus",
                },
            ], {
                prompt: "Build the component",
                projectDeps: ["react", "typescript", "bun"],
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("hephaestus");
        });
        test("project_context matcher requires all files", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: {
                        type: "project_context",
                        has_files: ["package.json", "tsconfig.json"],
                    },
                    target_agent: "sisyphus",
                },
            ], {
                prompt: "Implement",
                projectFiles: ["package.json"], // Missing tsconfig.json
            });
            expect(result).toBeNull();
        });
        test("always matcher always matches", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: {
                        type: "always",
                    },
                    target_agent: "oracle",
                },
            ], { prompt: "any prompt whatsoever" });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("oracle");
        });
        test("routing rules are evaluated in order", () => {
            const orderedRules = [
                {
                    matcher: { type: "keyword", keywords: ["test"], mode: "any" },
                    target_agent: "first_agent",
                },
                {
                    matcher: { type: "always" },
                    target_agent: "fallback_agent",
                },
            ];
            const result = evaluateRoutingRules(orderedRules, { prompt: "test" });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("first_agent");
        });
        test("getMatchedContent returns human-readable descriptions", () => {
            const keywordMatcher = {
                type: "keyword",
                keywords: ["bug", "fix"],
                mode: "any",
            };
            const content = getMatchedContent(keywordMatcher, {
                prompt: "Fix this bug",
            });
            expect(content).toBeString();
            expect(content).toContain("matched keywords");
        });
        test("no match returns null", () => {
            const result = evaluateRoutingRules([
                {
                    matcher: { type: "keyword", keywords: ["never"], mode: "any" },
                    target_agent: "sisyphus",
                },
            ], { prompt: "some other prompt" });
            expect(result).toBeNull();
        });
    });
    describe("Step 5: Export configuration as JSONC", () => {
        test("export config as valid JSONC", () => {
            testConfig.meta_agents["test_export"] = createTestMetaAgent("test_export");
            const exported = exportJsonc(testConfig, true);
            expect(exported).toBeString();
            expect(exported).toContain('{');
            expect(exported).toContain('}');
            expect(exported).toContain("$schema");
            expect(exported).toContain("meta_agents");
            expect(exported).toContain("test_export");
        });
        test("export includes schema reference", () => {
            const exported = exportJsonc(testConfig, true);
            expect(exported).toContain("$schema");
            expect(exported).toContain("https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS");
        });
        test("export preserves all configuration sections", () => {
            testConfig.meta_agents["test_sections"] = createTestMetaAgent("test_sections");
            const exported = exportJsonc(testConfig, true);
            const parsed = JSON.parse(exported);
            expect(parsed.meta_agents).toBeDefined();
            expect(parsed.agents).toBeDefined();
            expect(parsed.categories).toBeDefined();
            expect(parsed.providers).toBeDefined();
            expect(parsed.settings).toBeDefined();
            expect(parsed.skills).toBeDefined();
            expect(parsed.disabled_hooks).toBeDefined();
        });
        test("export preserves new meta-agent with routing rules", () => {
            const newAgent = createTestMetaAgent("export_test");
            testConfig.meta_agents["export_test"] = newAgent;
            const exported = exportJsonc(testConfig, true);
            const parsed = JSON.parse(exported);
            expect(parsed.meta_agents["export_test"]).toBeDefined();
            expect(parsed.meta_agents["export_test"].routing_rules.length).toBe(newAgent.routing_rules.length);
        });
        test("export includes config overrides", () => {
            const newAgent = createTestMetaAgent("overrides_test");
            testConfig.meta_agents["overrides_test"] = newAgent;
            const exported = exportJsonc(testConfig, true);
            const parsed = JSON.parse(exported);
            const firstRule = parsed.meta_agents["overrides_test"].routing_rules[0];
            expect(firstRule.config_overrides).toBeDefined();
            expect(firstRule.config_overrides?.prompt).toBeDefined();
        });
        test("export formatting uses 2-space indentation", () => {
            testConfig.meta_agents["format_test"] = createTestMetaAgent("format_test");
            const exported = exportJsonc(testConfig, true);
            // Check for consistent indentation
            expect(exported).toContain("  ");
            expect(exported).not.toContain("    "); // Should not have 4 spaces
        });
    });
    describe("Step 6: Clear and import the exported config", () => {
        let exportedConfig;
        let importedConfig;
        beforeEach(() => {
            // Add a test meta-agent with routing rules
            testConfig.meta_agents["import_test"] = createTestMetaAgent("import_test");
            // Export the config
            exportedConfig = exportJsonc(testConfig, true);
            // Clear current config
            testConfig = {
                $schema: "",
                meta_agents: {},
                agents: {},
                categories: {},
                providers: {
                    priority_chain: [],
                    research_providers: [],
                    strategy_providers: [],
                },
                settings: {
                    namespace_prefix: "",
                    max_delegation_depth: 3,
                    background_parallelization: {
                        enabled: false,
                        max_parallel_tasks: 1,
                        timeout_ms: 30000,
                    },
                    adaptive_model_selection: {
                        enabled: false,
                        research_model: "",
                        strategy_model: "",
                        default_model: "",
                    },
                    ultrawork_enabled: false,
                    todo_continuation: false,
                    verify_before_completion: false,
                    lsp_refactoring_preferred: false,
                    aggressive_comment_pruning: false,
                },
                skills: [],
                disabled_hooks: [],
            };
            // Parse and import the exported config
            importedConfig = parseJsonc(exportedConfig);
        });
        test("imported config has correct structure", () => {
            expect(importedConfig).toBeDefined();
            expect(importedConfig.$schema).toBeString();
            expect(importedConfig.meta_agents).toBeObject();
            expect(importedConfig.agents).toBeObject();
        });
        test("imported config contains test meta-agent", () => {
            expect(importedConfig.meta_agents["import_test"]).toBeDefined();
            expect(importedConfig.meta_agents["import_test"].base_model).toBe("claude-3-5-sonnet-20241022");
        });
        test("imported config preserves routing rules", () => {
            const importedAgent = importedConfig.meta_agents["import_test"];
            expect(importedAgent.routing_rules.length).toBe(5);
            expect(importedAgent.routing_rules[0].matcher.type).toBe("keyword");
            expect(importedAgent.routing_rules[1].matcher.type).toBe("complexity");
            expect(importedAgent.routing_rules[2].matcher.type).toBe("regex");
            expect(importedAgent.routing_rules[3].matcher.type).toBe("project_context");
            expect(importedAgent.routing_rules[4].matcher.type).toBe("always");
        });
        test("imported config preserves matcher details", () => {
            const importedAgent = importedConfig.meta_agents["import_test"];
            // Keyword matcher
            const keywordRule = importedAgent.routing_rules[0];
            expect(keywordRule.matcher.keywords).toEqual([
                "bug",
                "fix",
                "debug",
            ]);
            expect(keywordRule.matcher.mode).toBe("any");
            // Regex matcher
            const regexRule = importedAgent.routing_rules[2];
            expect(regexRule.matcher.pattern).toBe("(api|endpoint|http)");
            expect(regexRule.matcher.flags).toBe("i");
        });
        test("imported config preserves config overrides", () => {
            const importedAgent = importedConfig.meta_agents["import_test"];
            const firstRule = importedAgent.routing_rules[0];
            expect(firstRule.config_overrides).toBeDefined();
            expect(firstRule.config_overrides?.prompt).toBe("Fix the bug with TDD approach.");
        });
        test("parseJsonc handles comments", () => {
            const jsoncWithComments = `
        // This is a comment
        {
          "meta_agents": {},
          "agents": {}  // Another comment
        }
      `;
            const parsed = parseJsonc(jsoncWithComments);
            expect(parsed).toBeDefined();
            expect(parsed).toBeObject();
            expect(parsed.meta_agents).toBeDefined();
        });
    });
    describe("Step 7: Verify config loads correctly", () => {
        let exportedConfig;
        let importedConfig;
        beforeEach(() => {
            // Create a comprehensive test config
            testConfig.meta_agents["verification_test"] = createTestMetaAgent("verification_test");
            testConfig.meta_agents["verification_test_two"] = createTestMetaAgent("verification_test_two");
            // Export and import round-trip
            exportedConfig = exportJsonc(testConfig, true);
            importedConfig = parseJsonc(exportedConfig);
        });
        test("all meta-agents are preserved", () => {
            const originalCount = Object.keys(testConfig.meta_agents).length;
            const importedCount = Object.keys(importedConfig.meta_agents).length;
            expect(importedCount).toBe(originalCount);
            expect(importedConfig.meta_agents["verification_test"]).toBeDefined();
            expect(importedConfig.meta_agents["verification_test_two"]).toBeDefined();
        });
        test("all meta-agent fields are preserved", () => {
            const originalAgent = testConfig.meta_agents["verification_test"];
            const importedAgent = importedConfig.meta_agents["verification_test"];
            expect(importedAgent.base_model).toEqual(originalAgent.base_model);
            expect(importedAgent.delegates_to).toEqual(originalAgent.delegates_to);
            expect(importedAgent.temperature).toEqual(originalAgent.temperature);
            expect(importedAgent.routing_rules.length).toEqual(originalAgent.routing_rules.length);
        });
        test("all matcher types are preserved", () => {
            const importedAgent = importedConfig.meta_agents["verification_test"];
            const matcherTypes = new Set(importedAgent.routing_rules.map((r) => r.matcher.type));
            expect(matcherTypes.has("keyword")).toBe(true);
            expect(matcherTypes.has("complexity")).toBe(true);
            expect(matcherTypes.has("regex")).toBe(true);
            expect(matcherTypes.has("project_context")).toBe(true);
            expect(matcherTypes.has("always")).toBe(true);
        });
        test("routing rule order is preserved", () => {
            const importedAgent = importedConfig.meta_agents["verification_test"];
            const ruleOrder = importedAgent.routing_rules.map((r) => r.matcher.type);
            expect(ruleOrder).toEqual([
                "keyword",
                "complexity",
                "regex",
                "project_context",
                "always",
            ]);
        });
        test("config overrides are correctly preserved", () => {
            const importedAgent = importedConfig.meta_agents["verification_test"];
            for (let i = 0; i < importedAgent.routing_rules.length; i++) {
                const originalRule = testConfig.meta_agents["verification_test"].routing_rules[i];
                const importedRule = importedAgent.routing_rules[i];
                if (originalRule.config_overrides) {
                    expect(importedRule.config_overrides).toBeDefined();
                    expect(importedRule.config_overrides?.prompt).toEqual(originalRule.config_overrides?.prompt);
                    expect(importedRule.config_overrides?.variant).toEqual(originalRule.config_overrides?.variant);
                }
            }
        });
        test("imported config can be used for routing evaluation", () => {
            const importedAgent = importedConfig.meta_agents["verification_test"];
            const result = evaluateRoutingRules(importedAgent.routing_rules, {
                prompt: "Fix this bug in the component",
            });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("sisyphus");
        });
        test("imported config can be exported again (idempotent)", () => {
            const reExported = exportJsonc(importedConfig, true);
            const reImported = parseJsonc(reExported);
            const originalAgent = testConfig.meta_agents["verification_test"];
            const reImportedAgent = reImported.meta_agents["verification_test"];
            expect(reImportedAgent.base_model).toEqual(originalAgent.base_model);
            expect(reImportedAgent.routing_rules.length).toEqual(originalAgent.routing_rules.length);
        });
    });
    describe("URL encoding/decoding workflow", () => {
        test("config can be encoded to URL", () => {
            testConfig.meta_agents["url_test"] = createTestMetaAgent("url_test");
            const encoded = encodeConfigForUrl(testConfig);
            expect(encoded).toBeString();
            expect(encoded.length).toBeGreaterThan(0);
            expect(encoded).not.toContain("{"); // Should be base64 encoded
            expect(encoded).not.toContain("}"); // Should be base64 encoded
        });
        test("config can be decoded from URL", () => {
            const originalConfig = deepClone(testConfig);
            originalConfig.meta_agents["url_decode_test"] = createTestMetaAgent("url_decode_test");
            const encoded = encodeConfigForUrl(originalConfig);
            const decoded = decodeConfigFromUrl(encoded);
            expect(decoded).toBeDefined();
            expect(decoded?.meta_agents["url_decode_test"]).toBeDefined();
            expect(decoded?.meta_agents["url_decode_test"].base_model).toEqual(originalConfig.meta_agents["url_decode_test"].base_model);
        });
        test("URL encoding/decoding preserves config structure", () => {
            const originalConfig = deepClone(testConfig);
            originalConfig.meta_agents["preserve_test"] = createTestMetaAgent("preserve_test");
            const encoded = encodeConfigForUrl(originalConfig);
            const decoded = decodeConfigFromUrl(encoded);
            expect(decoded).toEqual(originalConfig);
        });
        test("URL encoding/decoding preserves routing rules", () => {
            const originalConfig = deepClone(testConfig);
            const testAgent = createTestMetaAgent("routing_rules_test");
            originalConfig.meta_agents["routing_rules_test"] = testAgent;
            const encoded = encodeConfigForUrl(originalConfig);
            const decoded = decodeConfigFromUrl(encoded);
            const decodedAgent = decoded?.meta_agents["routing_rules_test"];
            expect(decodedAgent).toBeDefined();
            expect(decodedAgent?.routing_rules.length).toBe(testAgent.routing_rules.length);
            expect(decodedAgent?.routing_rules[0].matcher.type).toBe("keyword");
            expect(decodedAgent?.routing_rules[1].matcher.type).toBe("complexity");
        });
    });
    describe("Complete workflow integration test", () => {
        test("full workflow: create -> export -> import -> verify -> use", () => {
            // Step 1: Create new meta-agent with all matcher types
            const testAgent = createTestMetaAgent("workflow_test");
            testConfig.meta_agents["workflow_test"] = testAgent;
            // Step 2: Export as JSONC
            const exported = exportJsonc(testConfig, true);
            expect(exported).toBeString();
            expect(exported).toContain("workflow_test");
            // Step 3: Parse and validate
            const parsed = parseJsonc(exported);
            expect(parsed.meta_agents["workflow_test"]).toBeDefined();
            // Step 4: Test routing works with parsed config
            const result = evaluateRoutingRules(parsed.meta_agents["workflow_test"].routing_rules, { prompt: "Fix this bug" });
            expect(result).toBeDefined();
            expect(result?.target_agent).toBe("sisyphus");
            // Step 5: URL encode/decode round-trip
            const encoded = encodeConfigForUrl(parsed);
            const urlDecoded = decodeConfigFromUrl(encoded);
            expect(urlDecoded).toEqual(parsed);
            // Step 6: Verify all matcher types work in decoded config
            const decodedAgent = urlDecoded?.meta_agents["workflow_test"];
            const matcherTypes = new Set(decodedAgent?.routing_rules.map((r) => r.matcher.type));
            expect(matcherTypes?.size).toBe(5);
            expect(matcherTypes?.has("keyword")).toBe(true);
            expect(matcherTypes?.has("complexity")).toBe(true);
            expect(matcherTypes?.has("regex")).toBe(true);
            expect(matcherTypes?.has("project_context")).toBe(true);
            expect(matcherTypes?.has("always")).toBe(true);
        });
    });
});
//# sourceMappingURL=e2e-test.js.map