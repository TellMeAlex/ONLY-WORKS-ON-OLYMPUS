import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Hades Meta-Agent - Architecture Guardian
 *
 * Specialized routing for Olimpus and oh-my-opencode architecture:
 * - Architecture analysis → oracle
 * - Olimpus file changes → prometheus
 * - oh-my-opencode integration → oracle
 * - Agent modification → prometheus
 * - Implementation → sisyphus
 * - Codebase search → explore
 * - Documentation → librarian
 * - General Olimpus topics → oracle
 * - Fallback → oracle
 *
 * Hades reads and proposes changes, never implements directly.
 * After proposing, offers delegation to the appropriate agent.
 */

export const hades: MetaAgentDef = {
  base_model: "",
  description:
    "Architecture guardian — analyzes Olimpus and oh-my-opencode structure, proposes changes, delegates implementation",
  mode: "subagent",
  color: "#8B0000",
  hidden: true,
  permission: {
    edit: "deny",
    bash: "deny",
    webfetch: "deny",
    task: "allow",
    doom_loop: "deny",
    external_directory: "deny",
  },
  prompt_template:
    "You are Hades, the architecture guardian for the Olimpus plugin system.\n\n" +
    "Your role is to understand, protect, and evolve the Olimpus and oh-my-opencode architecture.\n" +
    "You NEVER implement directly — you analyze, propose, and delegate.\n\n" +
    "Olimpus architecture:\n" +
    "- Config system: Zod v4 schemas, JSONC loading, deep merge\n" +
    "- Routing engine: 5 matcher types, first-match-wins\n" +
    "- Meta-agent registry: circular detection, max depth\n" +
    "- Plugin wrapper: interface merging with oh-my-opencode\n" +
    "- Skill system: namespace prefixing, YAML frontmatter\n\n" +
    "After analysis, always offer to delegate implementation to the appropriate agent.",
  delegates_to: ["oracle", "prometheus", "sisyphus", "explore", "librarian"],
  routing_rules: [
    {
      matcher: {
        type: "keyword",
        keywords: [
          "architecture",
          "how does",
          "explain",
          "understand",
          "internals",
          "design",
          "structure",
        ],
        mode: "any",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "OLIMPUS ARCHITECTURE ANALYSIS\n\n" +
          "You are analyzing the Olimpus meta-orchestrator plugin architecture.\n\n" +
          "Key Olimpus files:\n" +
          "- src/index.ts: Plugin entry point, orchestrates all components\n" +
          "- src/agents/routing.ts: 5 matcher types (keyword, complexity, regex, project_context, always)\n" +
          "- src/agents/registry.ts: MetaAgentRegistry with circular detection\n" +
          "- src/agents/meta-agent.ts: Factory producing AgentConfig from MetaAgentDef\n" +
          "- src/config/schema.ts: 27 Zod v4 schemas for validation\n" +
          "- src/config/loader.ts: JSONC config loading and merging\n" +
          "- src/plugin/wrapper.ts: Plugin interface merging with oh-my-opencode\n\n" +
          "oh-my-opencode integration points:\n" +
          "- Plugin registered via @opencode-ai/plugin interface\n" +
          "- Agents registered by mutating config.agent[name] = AgentConfig\n" +
          "- Config handler chains: base OMO first, then Olimpus extension\n\n" +
          "IMPORTANT: Analyze and propose changes only. Do NOT implement directly.\n" +
          "After your analysis, offer to delegate implementation to the appropriate agent.",
      },
    },
    {
      matcher: {
        type: "regex",
        pattern:
          "(src/agents/|meta-agent|routing|registry|MetaAgentDef|RoutingRule)",
        flags: "i",
      },
      target_agent: "prometheus",
      config_overrides: {
        prompt:
          "OLIMPUS INTERNAL FILE CHANGE PROPOSAL\n\n" +
          "The request references Olimpus internal files. Create a detailed plan.\n\n" +
          "Olimpus architecture constraints:\n" +
          "- TypeScript strict mode, no 'any' types\n" +
          "- Zod v4 for all schema validation (not v3)\n" +
          "- First-match-wins routing in routing.ts (DO NOT modify)\n" +
          "- Circular detection in registry.ts (DO NOT modify)\n" +
          "- ES modules with explicit .js extensions in imports\n" +
          "- All config validated at startup via Zod\n\n" +
          "Create a plan that maintains architectural integrity.\n" +
          "IMPORTANT: Plan only, do NOT implement. Offer delegation after planning.",
      },
    },
    {
      matcher: {
        type: "regex",
        pattern:
          "(oh-my-opencode|plugin\\.interface|AgentConfig|PluginInterface|config\\.handler)",
        flags: "i",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "OH-MY-OPENCODE INTEGRATION ANALYSIS\n\n" +
          "Analyze how Olimpus integrates with oh-my-opencode.\n\n" +
          "Integration architecture:\n" +
          "- Olimpus wraps oh-my-opencode via createOlimpusWrapper()\n" +
          "- Plugin interface: @opencode-ai/plugin (PluginInput → Hooks)\n" +
          "- Agent registration: mutate config.agent[name] = AgentConfig in config handler\n" +
          "- Config handler chaining: base OMO handlers run first, then Olimpus extension\n" +
          "- AgentConfig fields: description, mode, model, prompt, permission, thinking, color, maxTokens, temperature\n" +
          "- Permissions: { edit, bash, webfetch, task, doom_loop, external_directory } each 'ask'|'allow'|'deny'\n\n" +
          "IMPORTANT: Analyze integration impacts only. Do NOT implement.\n" +
          "After analysis, offer to delegate implementation to the appropriate agent.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "add agent",
          "new agent",
          "create agent",
          "modify agent",
          "change agent",
          "update routing",
        ],
        mode: "any",
      },
      target_agent: "prometheus",
      config_overrides: {
        prompt:
          "AGENT MODIFICATION PLAN\n\n" +
          "Create a plan for modifying the Olimpus agent system.\n\n" +
          "Current meta-agents: atenea (research), hermes (jira), hades (architecture)\n" +
          "Agent definition pattern: src/agents/definitions/{name}.ts exports MetaAgentDef\n" +
          "Registration: src/index.ts imports and registers via MetaAgentRegistry\n" +
          "Schema: src/config/schema.ts defines MetaAgentSchema with Zod v4\n\n" +
          "IMPORTANT: Create the plan only. Offer delegation for implementation.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["implement", "code", "write", "fix", "update file", "edit"],
        mode: "any",
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "OLIMPUS IMPLEMENTATION TASK\n\n" +
          "Implement changes to the Olimpus codebase.\n\n" +
          "Conventions:\n" +
          "- TypeScript strict mode, no 'any' types (use 'unknown' + type guard)\n" +
          "- Zod v4 for schemas (not v3)\n" +
          "- ES modules with explicit .js extensions\n" +
          "- camelCase for functions/vars, PascalCase for types/classes\n" +
          "- Return null for optional routing results (not throwing)\n" +
          "- Validate Zod schemas at startup\n\n" +
          "After implementing, run: bun run typecheck && bun run build && bun test",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "find",
          "search",
          "where is",
          "look for",
          "pattern",
          "usage",
        ],
        mode: "any",
      },
      target_agent: "explore",
      config_overrides: {
        prompt:
          "Search the Olimpus codebase for the requested pattern or symbol.\n\n" +
          "Key directories:\n" +
          "- src/agents/: Routing engine, registry, meta-agent factory, definitions\n" +
          "- src/config/: Zod schemas, JSONC loader, OMO translator\n" +
          "- src/plugin/: Interface wrapper and merging\n" +
          "- src/skills/: Skill loading and namespace prefixing",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "docs",
          "documentation",
          "api",
          "reference",
          "example",
          "how to",
        ],
        mode: "any",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "Research documentation for the requested topic.\n\n" +
          "Olimpus documentation:\n" +
          "- example/olimpus.jsonc: Full configuration example\n" +
          "- README.md: Project overview and API reference\n" +
          "- AGENTS.md files: Per-directory knowledge bases\n" +
          "- assets/olimpus.schema.json: JSON Schema for IDE validation",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["olimpus", "meta-agent", "plugin", "wrapper", "routing"],
        mode: "any",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "OLIMPUS GENERAL CONSULTATION\n\n" +
          "Analyze the Olimpus-related topic.\n\n" +
          "Olimpus is a meta-orchestrator plugin for oh-my-opencode that routes requests " +
          "to specialized agents using 5 matcher types (keyword, complexity, regex, project_context, always).\n\n" +
          "Core components: config system, routing engine, meta-agent registry, plugin wrapper, skill system.\n" +
          "Built with: Bun, TypeScript strict, Zod v4, no 'any' types.\n\n" +
          "IMPORTANT: Analyze and advise only. Do NOT implement directly.\n" +
          "After analysis, offer to delegate to the appropriate agent.",
      },
    },
    {
      matcher: { type: "always" },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "OLIMPUS ARCHITECTURE GUARDIAN (FALLBACK)\n\n" +
          "You are Hades, the architecture guardian for the Olimpus plugin system.\n" +
          "Analyze the request in the context of Olimpus architecture.\n\n" +
          "If the request is about Olimpus internals, analyze and propose.\n" +
          "If unclear, ask for clarification about what aspect of Olimpus needs attention.\n\n" +
          "IMPORTANT: Never implement directly. Propose changes and offer delegation.",
      },
    },
  ],
};
