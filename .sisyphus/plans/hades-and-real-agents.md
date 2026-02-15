# Hades Meta-Agent + Convert All Meta-Agents to Real Agents

## TL;DR

> **Quick Summary**: Create the Hades meta-agent (architecture guardian for Olimpus + oh-my-opencode), then convert all 3 meta-agents (Hermes, Atenea, Hades) from delegation-prompt routers into real agents with proper AgentConfig (permissions, mode, thinking, color, description).
> 
> **Deliverables**:
> - `src/agents/definitions/hades.ts` — New Hades meta-agent definition
> - `src/config/schema.ts` — Extended MetaAgentSchema with real agent fields
> - `src/agents/meta-agent.ts` — Overhauled factory producing full AgentConfig
> - `src/index.ts` — Updated registration to produce real agents at startup
> - `src/plugin/wrapper.ts` — Fixed stub in createOlimpusExtension
> - `src/agents/definitions/index.ts` — Re-export hades
> - `example/olimpus.jsonc` — Updated documentation
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

---

## Context

### Original Request
User wants to:
1. Create Hades meta-agent as architecture guardian that understands both Olimpus and oh-my-opencode
2. Convert ALL meta-agents (Hermes, Atenea, Hades) to real agents with full AgentConfig

### Interview Summary
**Key Discussions**:
- **Hades behavior**: READ + PROPOSE changes, then offer delegation to Sisyphus if user confirms
- **Hades scope**: Knows both Olimpus AND oh-my-opencode architecture
- **Hades triggers**: Keywords (olimpus, meta-agent, routing, plugin, architecture) + regex for critical files (src/agents/, src/config/schema.ts)
- **Permissions model**: Restrictive — Hades: all deny except task. Atenea: edit deny, webfetch allow. Hermes: webfetch allow, bash ask.
- **Real agent motivation**: Only via routing (not UI), but with real prompts, permissions, and config (not delegation prompts)
- **Order**: Create Hades as meta-agent first, then convert all 3 together

**Research Findings**:
- oh-my-opencode AgentConfig: `{ description, mode, model, prompt, permission, thinking, color, maxTokens, temperature, tools, disabled_tools }`
- Permissions: `{ edit, bash, webfetch, task, doom_loop, external_directory }` each `"ask" | "allow" | "deny"`
- Registration: mutate `config.agent[name] = agentConfig` in config handler
- Current `createMetaAgentConfig()` produces delegation prompts only — needs overhaul
- Current `createOlimpusExtension()` in wrapper.ts is a STUB doing nothing
- Current registration in `src/index.ts:67-86` uses empty prompt routing context — wrong approach for real agents
- `project_context` matcher does NOT support path regex — only exact file existence checks

### Metis Review
**Identified Gaps** (addressed):
- Hades self-triggering loop → Will add note in prompt to skip self-analysis
- Schema breaking changes → All new fields optional with defaults
- Registration timing → Verified: config handler chains correctly (base OMO first, then Olimpus)
- Permission inheritance → Will set explicit defaults per agent, not rely on OMO defaults
- `project_context` doesn't support path regex → Use `regex` matcher on prompt text instead

---

## Work Objectives

### Core Objective
Create Hades as architecture guardian meta-agent, then transform the meta-agent system from "delegation prompt generators" to "real agent config producers" with proper permissions, modes, and system prompts.

### Concrete Deliverables
- `src/agents/definitions/hades.ts` — Hades MetaAgentDef
- `src/agents/definitions/index.ts` — Re-export hades
- `src/config/schema.ts` — MetaAgentSchema expanded with optional real-agent fields
- `src/agents/meta-agent.ts` — `createMetaAgentConfig()` returns full AgentConfig
- `src/index.ts` — Registration loop produces real agents (not routing-dependent)
- `src/plugin/wrapper.ts` — Fix `createOlimpusExtension` stub + remove `any` type
- `example/olimpus.jsonc` — Hades documentation + permission examples

### Definition of Done
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run build` succeeds
- [ ] `bun test` passes (existing tests don't break)
- [ ] All 3 agents (hermes, atenea, hades) register as real AgentConfig objects
- [ ] Each agent has: description, mode, prompt, permission, color
- [ ] No `any` types in modified files
- [ ] Existing Hermes/Atenea routing rules preserved

### Must Have
- Hades meta-agent with architecture guardian role
- All 3 agents produce full AgentConfig (not delegation prompts)
- Restrictive permissions per agent
- Backward compatibility (existing olimpus.jsonc configs still validate)

### Must NOT Have (Guardrails)
- NO new matcher types (use existing 5)
- NO UI-visible agents (mode: "subagent" for all, hidden: true)
- NO modifications to routing.ts or registry.ts logic
- NO refactoring of unrelated code
- NO test suite creation (only verify existing tests pass)
- NO JSDoc spam (code should be self-documenting)
- NO utility functions for one-time transforms
- NO telemetry or logging beyond existing patterns

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks verified by running commands. No manual testing.

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: Tests-after (verify existing pass, no new test suite)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Verification for each task uses:
- `bun run typecheck` — Type safety
- `bun run build` — Compilation
- `bun test` — Existing tests pass

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Create hades.ts meta-agent definition [no dependencies]
└── Task 2: Extend MetaAgentSchema in schema.ts [no dependencies]

Wave 2 (After Wave 1):
├── Task 3: Overhaul createMetaAgentConfig() [depends: 1, 2]
├── Task 4: Fix createOlimpusExtension stub [depends: 2]
└── Task 5: Update registration in index.ts [depends: 1, 3]

Wave 3 (After Wave 2):
└── Task 6: Update example/olimpus.jsonc + final verification [depends: all]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 5 | 2 |
| 2 | None | 3, 4 | 1 |
| 3 | 1, 2 | 5 | 4 |
| 4 | 2 | 6 | 3 |
| 5 | 1, 3 | 6 | 4 |
| 6 | All | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | task(category="quick", load_skills=["typescript"], run_in_background=false) |
| 2 | 3, 4, 5 | task(category="unspecified-high", load_skills=["typescript"], run_in_background=false) |
| 3 | 6 | task(category="quick", load_skills=[], run_in_background=false) |

---

## TODOs

- [ ] 1. Create Hades Meta-Agent Definition

  **What to do**:
  - Create `src/agents/definitions/hades.ts` exporting `hades: MetaAgentDef`
  - Follow exact structure from `src/agents/definitions/hermes.ts`
  - Add `export { hades } from "./hades.js"` to `src/agents/definitions/index.ts`
  
  **Hades Definition**:
  - `base_model: ""` (inherited from system)
  - `delegates_to: ["oracle", "prometheus", "sisyphus", "explore", "librarian"]`
  - Routing rules (in priority order):
    1. **Architecture analysis** — keyword matcher: `["architecture", "how does", "explain", "understand", "internals", "design", "structure"]` → oracle
    2. **Olimpus file references** — regex matcher: `(src/agents/|meta-agent|routing|registry|MetaAgentDef|RoutingRule)` → prometheus
    3. **oh-my-opencode integration** — regex matcher: `(oh-my-opencode|plugin.interface|AgentConfig|PluginInterface|config.handler)` → oracle
    4. **Agent modification** — keyword matcher: `["add agent", "new agent", "create agent", "modify agent", "change agent", "update routing"]` → prometheus
    5. **Implementation** — keyword matcher: `["implement", "code", "write", "fix", "update file", "edit"]` → sisyphus
    6. **Codebase search** — keyword matcher: `["find", "search", "where is", "look for", "pattern", "usage"]` → explore
    7. **Documentation** — keyword matcher: `["docs", "documentation", "api", "reference", "example", "how to"]` → librarian
    8. **Olimpus mentions** — keyword matcher: `["olimpus", "meta-agent", "plugin", "wrapper", "routing"]` → oracle
    9. **Fallback** — always matcher → oracle
  
  - Each routing rule `config_overrides.prompt` should include:
    - Context about Olimpus architecture (key files, patterns)
    - Context about oh-my-opencode integration points
    - Instruction: analyze + propose changes, don't implement directly
    - Instruction: after proposing, offer delegation to appropriate agent

  **Must NOT do**:
  - Do NOT add new matcher types
  - Do NOT create a skill file (inline knowledge in prompts for now)
  - Do NOT touch routing.ts or registry.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation following established pattern
  - **Skills**: [`typescript`]
    - `typescript`: MetaAgentDef type compliance, strict mode

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 5
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/agents/definitions/hermes.ts:1-124` — Exact structure to replicate: import, JSDoc, MetaAgentDef export, routing_rules array
  - `src/agents/definitions/atenea.ts:1-148` — More complex routing rules example with regex matchers and multi-line prompt strings
  - `src/agents/definitions/index.ts:1-2` — Re-export pattern: `export { name } from "./name.js"`

  **API/Type References** (contracts to implement against):
  - `src/config/schema.ts:79-85` — MetaAgentSchema: base_model, delegates_to, routing_rules, prompt_template, temperature
  - `src/config/schema.ts:6-17` — BUILTIN_AGENT_NAMES: valid values for delegates_to and target_agent
  - `src/config/schema.ts:62-73` — RoutingRuleSchema: matcher + target_agent + config_overrides

  **Acceptance Criteria**:

  - [ ] File `src/agents/definitions/hades.ts` exists and exports `hades` const
  - [ ] File `src/agents/definitions/index.ts` has 3 exports: atenea, hermes, hades
  - [ ] `bun run typecheck` passes with zero errors

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Hades definition compiles correctly
    Tool: Bash
    Preconditions: Source files exist
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Assert: no errors mentioning hades.ts
    Expected Result: Clean typecheck
    Evidence: Terminal output captured

  Scenario: Index re-exports all 3 agents
    Tool: Bash
    Preconditions: hades.ts created
    Steps:
      1. Run: grep -c "export" src/agents/definitions/index.ts
      2. Assert: output is "3"
    Expected Result: Three export statements
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `feat(agents): add hades meta-agent as architecture guardian`
  - Files: `src/agents/definitions/hades.ts`, `src/agents/definitions/index.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 2. Extend MetaAgentSchema with Real Agent Fields

  **What to do**:
  - Add optional fields to `MetaAgentSchema` in `src/config/schema.ts` for real agent support:
    ```typescript
    // New optional fields for real agent conversion
    description: z.string().optional(),
    mode: z.enum(["subagent", "primary", "all"]).optional(),
    color: z.string().regex(/#[0-9A-Fa-f]{6}/).optional(),
    maxTokens: z.number().optional(),
    hidden: z.boolean().optional(),
    thinking: z.object({
      type: z.enum(["enabled", "disabled"]),
      budgetTokens: z.number().optional(),
    }).optional(),
    reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
    permission: z.object({
      edit: z.enum(["ask", "allow", "deny"]).optional(),
      bash: z.enum(["ask", "allow", "deny"]).optional(),
      webfetch: z.enum(["ask", "allow", "deny"]).optional(),
      task: z.enum(["ask", "allow", "deny"]).optional(),
      doom_loop: z.enum(["ask", "allow", "deny"]).optional(),
      external_directory: z.enum(["ask", "allow", "deny"]).optional(),
    }).optional(),
    ```
  - ALL new fields must be `.optional()` for backward compatibility
  - Existing fields (base_model, delegates_to, routing_rules, prompt_template, temperature) remain UNCHANGED
  - The inferred `MetaAgentDef` type will automatically include new fields via `z.infer`

  **Must NOT do**:
  - Do NOT remove or rename existing schema fields
  - Do NOT make any new field required
  - Do NOT change BUILTIN_AGENT_NAMES
  - Do NOT modify MatcherSchema or RoutingRuleSchema

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file modification, adding optional Zod fields
  - **Skills**: [`typescript`, `zod-4`]
    - `typescript`: Type safety, strict mode
    - `zod-4`: Zod v4 schema syntax (breaking changes from v3)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/config/schema.ts:79-85` — Current MetaAgentSchema definition to extend
  - `src/config/schema.ts:92-100` — AgentOverrideSchema pattern (shows how optional fields are structured)
  - `src/config/schema.ts:23-56` — Matcher schemas showing Zod v4 discriminated union pattern

  **API/Type References**:
  - oh-my-opencode `src/config/schema/agent-overrides.ts` — Full AgentOverrideConfig with ALL fields (model, prompt, temperature, maxTokens, permission, thinking, reasoningEffort, tools, color, description, mode)
  - oh-my-opencode `src/config/schema/internal/permission.ts` — AgentPermission: edit, bash, webfetch, task, doom_loop, external_directory

  **Documentation References**:
  - Zod v4 docs: object schema with optional fields

  **WHY Each Reference Matters**:
  - `schema.ts:79-85`: This is the EXACT code being modified — shows current shape
  - `AgentOverrideConfig`: Source of truth for what fields oh-my-opencode accepts
  - `permission.ts`: Exact permission field names and value types

  **Acceptance Criteria**:

  - [ ] MetaAgentSchema includes all new optional fields
  - [ ] `MetaAgentDef` type (inferred) includes description, mode, color, permission, etc.
  - [ ] Existing hermes/atenea definitions still validate (no breakage)
  - [ ] `bun run typecheck` passes
  - [ ] `bun run build` succeeds

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Schema validates existing definitions without new fields
    Tool: Bash
    Preconditions: schema.ts modified
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Assert: no errors in schema.ts, hermes.ts, atenea.ts
    Expected Result: Backward compatible
    Evidence: Terminal output

  Scenario: Build succeeds with new schema
    Tool: Bash
    Steps:
      1. Run: bun run build
      2. Assert: exit code 0
    Expected Result: Clean build
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `feat(schema): extend MetaAgentSchema with real agent fields (permission, mode, thinking)`
  - Files: `src/config/schema.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 3. Overhaul createMetaAgentConfig() to Produce Full AgentConfig

  **What to do**:
  - Rewrite `createMetaAgentConfig()` in `src/agents/meta-agent.ts` to produce full AgentConfig
  - The function currently:
    1. Evaluates routing rules to find a target agent
    2. Builds a delegation prompt ("use task tool to delegate to X")
    3. Returns minimal AgentConfig: `{ model, prompt: delegationPrompt, temperature }`
  - The function SHOULD:
    1. Accept the MetaAgentDef (which now has permission, mode, description, etc.)
    2. Build a REAL system prompt from the MetaAgentDef (not a delegation prompt)
    3. Return full AgentConfig with all fields mapped
  - **CRITICAL CHANGE**: The function should NOT depend on routing context anymore for producing the base AgentConfig. Routing rules define the meta-agent's behavior, but the AgentConfig is the agent's identity.
  
  **New function signature** (same name, different internals):
  ```typescript
  export function createMetaAgentConfig(
    def: MetaAgentDef,
    metaAgentName: string
  ): AgentConfig {
    // Build system prompt from def.prompt_template or generate from routing rules
    // Map all MetaAgentDef fields to AgentConfig fields
    // Return complete AgentConfig
  }
  ```

  **Field mapping**:
  - `def.base_model` → `agentConfig.model`
  - `def.prompt_template` → `agentConfig.prompt` (or generate from routing rules if absent)
  - `def.temperature` → `agentConfig.temperature`
  - `def.description` → `agentConfig.description`
  - `def.mode` → `agentConfig.mode` (default: `"subagent"`)
  - `def.color` → `agentConfig.color`
  - `def.maxTokens` → `agentConfig.maxTokens`
  - `def.hidden` → `agentConfig.hidden` (default: `true`)
  - `def.permission` → `agentConfig.permission`
  - `def.thinking` → `agentConfig.thinking`
  - `def.reasoningEffort` → `agentConfig.reasoningEffort`

  **Default permissions per built-in agent** (applied when def.permission is undefined):
  - Hades: `{ edit: "deny", bash: "deny", webfetch: "deny", task: "allow", doom_loop: "deny", external_directory: "deny" }`
  - Atenea: `{ edit: "deny", bash: "ask", webfetch: "allow", task: "allow", doom_loop: "deny", external_directory: "deny" }`
  - Hermes: `{ edit: "deny", bash: "ask", webfetch: "allow", task: "allow", doom_loop: "deny", external_directory: "deny" }`

  **Note**: These defaults are NOT hardcoded in `createMetaAgentConfig()`. They are set in each agent's definition file (hades.ts, atenea.ts, hermes.ts). The factory just maps `def.permission` → `agentConfig.permission`.

  - Remove `buildDelegationPrompt()` function (no longer needed)
  - Remove `RoutingContext` parameter from `createMetaAgentConfig` (no longer needed)
  - Keep the `evaluateRoutingRules` import for potential future use, but the factory no longer calls it

  **Must NOT do**:
  - Do NOT hardcode per-agent defaults in the factory (put them in definition files)
  - Do NOT change routing.ts
  - Do NOT change registry.ts
  - Do NOT add error handling beyond what exists

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core factory rewrite affecting all agents, needs careful field mapping
  - **Skills**: [`typescript`]
    - `typescript`: AgentConfig type compliance, strict mode, no `any`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/agents/meta-agent.ts:1-87` — Current implementation to rewrite (full file)
  - oh-my-opencode `src/agents/explore.ts` — Working example of AgentConfig creation with description, mode, model, temperature, prompt, permissions
  - oh-my-opencode `src/agents/librarian.ts` — Another AgentConfig example with tool restrictions

  **API/Type References**:
  - `@opencode-ai/sdk` AgentConfig type — Target output shape
  - `src/config/schema.ts:79-85+new fields` — MetaAgentDef input shape (after Task 2)

  **WHY Each Reference Matters**:
  - `meta-agent.ts`: This IS the file being rewritten — understand current flow before changing
  - `explore.ts/librarian.ts`: These show WORKING AgentConfig objects that oh-my-opencode accepts
  - `AgentConfig type`: Must match exactly or registration will fail silently

  **Acceptance Criteria**:

  - [ ] `createMetaAgentConfig()` no longer accepts RoutingContext parameter
  - [ ] `createMetaAgentConfig()` returns AgentConfig with description, mode, permission, prompt
  - [ ] `buildDelegationPrompt()` function removed
  - [ ] No `any` types in file
  - [ ] `bun run typecheck` passes

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Factory produces full AgentConfig
    Tool: Bash
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Assert: no errors in meta-agent.ts
    Expected Result: Type-safe AgentConfig output
    Evidence: Terminal output

  Scenario: Build succeeds with new factory
    Tool: Bash
    Steps:
      1. Run: bun run build
      2. Assert: exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `refactor(meta-agent): overhaul factory to produce full AgentConfig instead of delegation prompts`
  - Files: `src/agents/meta-agent.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 4. Update Agent Definitions with Real Agent Fields

  **What to do**:
  - Update `src/agents/definitions/hermes.ts` — add real agent fields:
    ```typescript
    export const hermes: MetaAgentDef = {
      base_model: "",
      description: "Jira issue management orchestrator — creates, updates, and queries Jira tickets using jira-issue-operations skill",
      mode: "subagent",
      color: "#F4A460",
      hidden: true,
      permission: {
        edit: "deny",
        bash: "ask",
        webfetch: "allow",
        task: "allow",
        doom_loop: "deny",
        external_directory: "deny",
      },
      delegates_to: [...],  // unchanged
      routing_rules: [...], // unchanged
    };
    ```
  - Update `src/agents/definitions/atenea.ts` — add real agent fields:
    ```typescript
    export const atenea: MetaAgentDef = {
      base_model: "",
      description: "Framework & component research orchestrator — investigates Inditex ecosystem and external libraries",
      mode: "subagent",
      color: "#E8A317",
      hidden: true,
      permission: {
        edit: "deny",
        bash: "ask",
        webfetch: "allow",
        task: "allow",
        doom_loop: "deny",
        external_directory: "deny",
      },
      delegates_to: [...],  // unchanged
      routing_rules: [...], // unchanged
    };
    ```
  - Update `src/agents/definitions/hades.ts` — add real agent fields:
    ```typescript
    export const hades: MetaAgentDef = {
      base_model: "",
      description: "Architecture guardian — understands Olimpus and oh-my-opencode internals, proposes changes maintaining architectural integrity",
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
      delegates_to: [...],  // unchanged
      routing_rules: [...], // unchanged
    };
    ```
  - Add `prompt_template` field to each agent with a REAL system prompt (not delegation instruction):
    - **Hermes prompt_template**: Identity as Jira specialist, skills to use, output format
    - **Atenea prompt_template**: Identity as research specialist, Inditex priority, research documentation format
    - **Hades prompt_template**: Identity as architecture guardian, dual-scope knowledge, propose-don't-implement instruction, handoff protocol

  **Must NOT do**:
  - Do NOT change routing_rules or delegates_to arrays
  - Do NOT change config_overrides in routing rules
  - Do NOT add fields not defined in the schema

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 3 files to update with careful prompt design
  - **Skills**: [`typescript`]
    - `typescript`: MetaAgentDef type compliance

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/agents/definitions/hermes.ts:1-124` — Current Hermes to update (keep routing, add fields)
  - `src/agents/definitions/atenea.ts:1-148` — Current Atenea to update (keep routing, add fields)
  - oh-my-opencode `src/agents/explore.ts` — Example of complete agent with description, mode, permissions

  **API/Type References**:
  - `src/config/schema.ts` (after Task 2) — MetaAgentDef with new optional fields

  **WHY Each Reference Matters**:
  - `hermes.ts/atenea.ts`: Files being modified — must preserve routing_rules
  - `explore.ts`: Shows what a "real" agent config looks like in oh-my-opencode

  **Acceptance Criteria**:

  - [ ] All 3 definition files have: description, mode, color, hidden, permission fields
  - [ ] All 3 definition files have prompt_template with real system prompts
  - [ ] Routing rules in all 3 files are UNCHANGED
  - [ ] `bun run typecheck` passes
  - [ ] `bun run build` succeeds

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All definitions compile with new fields
    Tool: Bash
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Assert: no errors in hermes.ts, atenea.ts, hades.ts
    Expected Result: All 3 definitions type-safe
    Evidence: Terminal output

  Scenario: Existing tests still pass
    Tool: Bash
    Steps:
      1. Run: bun test
      2. Assert: exit code 0
    Expected Result: No regressions
    Evidence: Terminal output
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(agents): add real agent fields (permissions, prompts, colors) to all meta-agent definitions`
  - Files: `src/agents/definitions/hermes.ts`, `src/agents/definitions/atenea.ts`, `src/agents/definitions/hades.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 5. Update Registration in index.ts + Fix wrapper.ts Stub

  **What to do**:

  **Part A — Fix `src/index.ts` registration**:
  - Current code (lines 67-86) calls `registry.resolve(agentName, routingContext)` with an EMPTY routing context (prompt: ""). This is the meta-agent delegation approach.
  - Change to: call `createMetaAgentConfig(def, agentName)` directly for each registered meta-agent (no routing context needed)
  - Update imports: remove RoutingContext dependency, use new factory signature
  - Register all 3 built-in agents: atenea, hermes, hades

  **Updated registration flow**:
  ```typescript
  // Import hades
  import { atenea, hermes, hades } from "./agents/definitions/index.js";

  // Register built-ins
  registry.register("atenea", atenea);
  registry.register("hermes", hermes);
  registry.register("hades", hades);

  // In config handler:
  pluginInterface.config = async (configInput: Config) => {
    if (baseConfigHandler) {
      await baseConfigHandler(configInput);
    }

    const allMetaAgents = registry.getAll();
    for (const [agentName, def] of Object.entries(allMetaAgents)) {
      const agentConfig = createMetaAgentConfig(def, agentName);
      if (agentConfig && configInput.agent) {
        configInput.agent[agentName] = agentConfig;
      }
    }
  };
  ```

  **Part B — Fix `src/plugin/wrapper.ts` stub**:
  - `createOlimpusExtension()` on line 70-81 has an `any` type parameter and does nothing
  - Either: remove the function entirely (registration is in index.ts), OR fix the `any` type
  - The stub config handler is redundant since index.ts handles registration
  - Replace `any` with proper type: `omoConfig: Record<string, unknown>`

  **Must NOT do**:
  - Do NOT change mergePluginInterfaces logic
  - Do NOT change hook chaining
  - Do NOT remove the config handler chain (base first, then extension)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core registration logic change, must understand plugin lifecycle
  - **Skills**: [`typescript`]
    - `typescript`: Config type handling, strict mode

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 3)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `src/index.ts:1-109` — Full current entry point (registration on lines 67-86)
  - `src/plugin/wrapper.ts:70-81` — Stub createOlimpusExtension to fix

  **API/Type References**:
  - `src/agents/meta-agent.ts` (after Task 3) — New createMetaAgentConfig signature
  - `src/agents/registry.ts` — MetaAgentRegistry.getAll() returns Record<string, MetaAgentDef>
  - `@opencode-ai/sdk` Config type — configInput.agent is Record<string, AgentConfig>

  **WHY Each Reference Matters**:
  - `index.ts`: File being modified — current registration pattern
  - `wrapper.ts:70-81`: The `any` type that must be fixed
  - `registry.ts`: getAll() return type determines loop variable types
  - `meta-agent.ts` new signature: Must match call sites

  **Acceptance Criteria**:

  - [ ] `src/index.ts` imports and registers hades alongside atenea and hermes
  - [ ] Config handler calls `createMetaAgentConfig(def, agentName)` without RoutingContext
  - [ ] `src/plugin/wrapper.ts` has zero `any` types
  - [ ] `bun run typecheck` passes
  - [ ] `bun run build` succeeds
  - [ ] `bun test` passes

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All 3 agents register in config handler
    Tool: Bash
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Run: bun run build
      4. Assert: exit code 0
    Expected Result: Registration compiles cleanly
    Evidence: Terminal output

  Scenario: No any types remain in wrapper.ts
    Tool: Bash
    Steps:
      1. Run: grep -n "any" src/plugin/wrapper.ts
      2. Assert: only matches in type assertions for hook chaining (lines 161-168), NOT in function parameters
    Expected Result: No untyped function parameters
    Evidence: grep output

  Scenario: Existing tests pass
    Tool: Bash
    Steps:
      1. Run: bun test
      2. Assert: exit code 0
    Expected Result: No regressions
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `refactor(registration): update agent registration to produce real AgentConfig, fix wrapper any type`
  - Files: `src/index.ts`, `src/plugin/wrapper.ts`
  - Pre-commit: `bun run typecheck && bun test`

---

- [ ] 6. Update example/olimpus.jsonc + Final Verification

  **What to do**:
  - Add Hades meta-agent documentation to `example/olimpus.jsonc`
  - Add permission configuration examples for all 3 agents
  - Add comments explaining new schema fields (description, mode, color, permission, thinking)
  - Run full verification suite

  **Must NOT do**:
  - Do NOT remove existing documentation for Hermes/Atenea
  - Do NOT change the config structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation update + verification commands
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final)
  - **Blocks**: None
  - **Blocked By**: All previous tasks

  **References**:

  **Pattern References**:
  - `example/olimpus.jsonc` — Current documentation file to extend

  **Acceptance Criteria**:

  - [ ] example/olimpus.jsonc includes Hades section with description and routing rules
  - [ ] Permission examples documented for all 3 agents
  - [ ] `bun run typecheck` passes
  - [ ] `bun run build` succeeds
  - [ ] `bun test` passes

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full build pipeline passes
    Tool: Bash
    Steps:
      1. Run: bun run typecheck
      2. Assert: exit code 0
      3. Run: bun run build
      4. Assert: exit code 0
      5. Run: bun test
      6. Assert: exit code 0
    Expected Result: Clean pipeline
    Evidence: Terminal output for all 3 commands

  Scenario: JSONC file is valid
    Tool: Bash
    Steps:
      1. Run: bun -e "import('jsonc-parser').then(p => { const fs = require('fs'); const content = fs.readFileSync('example/olimpus.jsonc', 'utf8'); const errors = []; p.parse(content, errors); console.log(errors.length === 0 ? 'VALID' : 'INVALID'); process.exit(errors.length === 0 ? 0 : 1); })"
      2. Assert: output contains "VALID"
    Expected Result: Parseable JSONC
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `docs(example): add hades meta-agent and permission examples to olimpus.jsonc`
  - Files: `example/olimpus.jsonc`
  - Pre-commit: `bun run typecheck && bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(agents): add hades meta-agent as architecture guardian` | hades.ts, index.ts (definitions) | bun run typecheck |
| 2 | `feat(schema): extend MetaAgentSchema with real agent fields` | schema.ts | bun run typecheck |
| 3 | `refactor(meta-agent): overhaul factory to produce full AgentConfig` | meta-agent.ts | bun run typecheck |
| 4 | `feat(agents): add real agent fields to all meta-agent definitions` | hermes.ts, atenea.ts, hades.ts | bun run typecheck |
| 5 | `refactor(registration): update agent registration, fix wrapper any type` | index.ts, wrapper.ts | bun run typecheck && bun test |
| 6 | `docs(example): add hades and permission examples to olimpus.jsonc` | olimpus.jsonc | bun run typecheck && bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun run typecheck  # Expected: zero errors
bun run build      # Expected: successful compilation
bun test           # Expected: all existing tests pass
```

### Final Checklist
- [ ] Hades meta-agent created with architecture guardian role
- [ ] All 3 agents (hermes, atenea, hades) have full AgentConfig fields
- [ ] createMetaAgentConfig() produces real AgentConfig (not delegation prompts)
- [ ] Registration in index.ts uses new factory without RoutingContext
- [ ] wrapper.ts has zero `any` types
- [ ] MetaAgentSchema backward compatible (existing configs still validate)
- [ ] Restrictive permissions set per agent
- [ ] All agents hidden from UI (mode: "subagent", hidden: true)
- [ ] example/olimpus.jsonc documents Hades and permission system
- [ ] Zero TypeScript errors, zero build errors, zero test failures
