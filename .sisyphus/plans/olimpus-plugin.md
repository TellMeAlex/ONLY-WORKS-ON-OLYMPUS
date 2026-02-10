# Olimpus — Meta-Orchestrator Plugin for OpenCode

> **Momus Review**: OKAY (approved on first submission)
> **Note from Momus**: GitHub URL references in pattern references may return 404. The executor MUST use `node_modules/oh-my-opencode/src/` as the authoritative source for oh-my-opencode internals after `bun install` completes in Task 1.

## TL;DR

> **Quick Summary**: Build a TypeScript/Bun OpenCode plugin called Olimpus that wraps oh-my-opencode as an internal dependency, providing meta-agents (atenea, hermes, hefesto) with declarative routing rules and a unified config file (olimpus.jsonc) that replaces oh-my-opencode.json.
> 
> **Deliverables**:
> - Bun/TypeScript project scaffolding with oh-my-opencode as npm dependency
> - Config Translation Layer: reads olimpus.jsonc, translates to oh-my-opencode format internally
> - Zod v4 config schema for olimpus.jsonc (own fields + passthrough)
> - Plugin entry point: wraps OhMyOpenCodePlugin, merges PluginInterfaces
> - Meta-agent system: dynamic AgentConfig generation from declarative routing rules
> - 3 meta-agents: atenea (strategy), hermes (communication), hefesto (building)
> - Olimpus skill bundling system
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8

---

## Context

### Original Request
Build an OpenCode plugin called "Olimpus" that acts as a meta-orchestrator over oh-my-opencode. Implements meta-agents with declarative routing rules, dynamic AgentConfig generation, and a single unified config file (olimpus.jsonc).

### Interview Summary
**Key Discussions**:
- **Wrapper architecture**: Olimpus imports oh-my-opencode as npm dependency, wraps its PluginInterface
- **Config strategy**: Config Translation Layer — Olimpus reads olimpus.jsonc, reimplements oh-my-opencode's config loading internally
- **Meta-agents**: Intermediate orchestrators that delegate to oh-my-opencode's built-in agents via `task` tool
- **Routing**: Dynamic AgentConfig generation at runtime based on declarative rules in config
- **Single config**: olimpus.jsonc is the only config file; oh-my-opencode.json does NOT exist

**Research Findings**:
- oh-my-opencode v3.4.0 uses Zod v4, NOT v3 as user's original prompt assumed
- `ctx.registerAgent()` and `ctx.executeAgent()` DO NOT EXIST in the real API
- Agents are `AgentConfig` objects (`{ model, temperature?, prompt?, variant? }`) returned via `config` handler
- Agent delegation happens via `task` tool within agent sessions
- `PluginInput = { client, project, directory, worktree, serverUrl, $ }` — NOT `PluginContext`
- oh-my-opencode's `loadPluginConfig()` reads from user/project dirs, validates with Zod, merges configs

### Metis Review
**Identified Gaps** (addressed):
- **Structural coupling risk**: Mitigated via semver range in package.json + Config Translation Layer isolating internals
- **Config file hell**: Resolved — single olimpus.jsonc, no oh-my-opencode.json
- **Agent registration timing**: OhMyOpenCodePlugin called FIRST, meta-agents added AFTER
- **Circular dependencies**: Max 3 delegation levels + detection logic
- **Naming conflicts**: Meta-agents use `olimpus:` prefix namespace

---

## Work Objectives

### Core Objective
Create an OpenCode plugin that wraps oh-my-opencode internally, providing a unified configuration layer (olimpus.jsonc) and meta-agents that dynamically generate AgentConfigs based on declarative routing rules.

### Concrete Deliverables
- `package.json` with bun, typescript, zod v4, oh-my-opencode dependency
- `tsconfig.json` configured for Bun runtime
- `src/index.ts` — Plugin entry point exporting OlimpusPlugin
- `src/config/schema.ts` — Zod v4 schema for olimpus.jsonc
- `src/config/loader.ts` — Config loader (reads olimpus.jsonc, validates, splits)
- `src/config/translator.ts` — Config Translation Layer (OMO format generation)
- `src/plugin/wrapper.ts` — OhMyOpenCodePlugin wrapper + PluginInterface merger
- `src/agents/meta-agent.ts` — Meta-agent factory (dynamic AgentConfig generation)
- `src/agents/routing.ts` — Routing rule evaluator (matchers + resolution)
- `src/agents/registry.ts` — Meta-agent registry with delegation tracking
- `src/agents/definitions/atenea.ts` — Atenea meta-agent definition
- `src/agents/definitions/hermes.ts` — Hermes meta-agent definition
- `src/agents/definitions/hefesto.ts` — Hefesto meta-agent definition
- `src/skills/loader.ts` — Olimpus skill bundling system
- `olimpus.jsonc` — Example/default configuration file
- `README.md` — Setup and usage documentation

### Definition of Done
- [ ] `bun run build` produces working output
- [ ] Plugin loads in OpenCode when configured as `"plugin": ["olimpus"]`
- [ ] olimpus.jsonc is the ONLY config file needed (no oh-my-opencode.json)
- [ ] Meta-agents appear as selectable agents in OpenCode
- [ ] oh-my-opencode base agents also appear (merged config)
- [ ] Routing rules dynamically determine AgentConfig properties

### Must Have
- oh-my-opencode as npm dependency (NOT separate plugin)
- Single config file: olimpus.jsonc
- Config Translation Layer that converts Olimpus config → oh-my-opencode format
- Meta-agents with `olimpus:` namespace prefix
- Dynamic AgentConfig generation from routing rules
- Zod v4 schemas (matching oh-my-opencode)
- PluginInterface merger (oh-my-opencode base + Olimpus extensions)
- Circular delegation detection (max 3 levels)

### Must NOT Have (Guardrails)
- ❌ NO `oh-my-opencode.json` file — config lives ONLY in olimpus.jsonc
- ❌ NO `ctx.registerAgent()` or `ctx.executeAgent()` calls — these APIs don't exist
- ❌ NO Zod v3 syntax — use v4 exclusively
- ❌ NO direct agent handler functions — agents are AgentConfig objects, not runtime handlers
- ❌ NO `"plugin": ["oh-my-opencode"]` in opencode.jsonc — only `"olimpus"` appears
- ❌ NO temp files for config passing — Config Translation Layer works in-memory
- ❌ NO unit tests (per user decision — deferred)
- ❌ NO over-abstraction — keep it simple, no unnecessary design patterns
- ❌ NO AI-generated JSDoc spam — minimal documentation, code should be self-documenting

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **Automated tests**: NONE (user decision: sin tests por ahora)
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Without TDD, QA scenarios are the PRIMARY verification method.
> The executing agent DIRECTLY verifies each deliverable by running it.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Build/Compile** | Bash (bun) | `bun run build` → exit code 0, output exists |
| **Config/Schema** | Bash (bun REPL) | Import schema, validate sample config, assert no errors |
| **Plugin Loading** | Bash (bun) | Import plugin, call with mock PluginInput, assert PluginInterface shape |
| **Type Checking** | Bash (bun) | `bunx tsc --noEmit` → 0 errors |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Project scaffolding (package.json, tsconfig, directory structure)
└── (solo task — foundation for everything)

Wave 2 (After Wave 1):
├── Task 2: Zod v4 config schema (olimpus.jsonc structure)
├── Task 3: Config loader + translator (read & convert)
└── (Task 3 depends on Task 2's schema)

Wave 3 (After Wave 2):
├── Task 4: Plugin wrapper (oh-my-opencode integration + PluginInterface merge)
└── Task 5: Routing rule evaluator (matchers + resolution engine)

Wave 4 (After Wave 3):
├── Task 6: Meta-agent factory + registry (dynamic AgentConfig generation)
└── (depends on Task 4 wrapper + Task 5 routing)

Wave 5 (After Wave 4):
├── Task 7: Meta-agent definitions (atenea, hermes, hefesto)
├── Task 8: Skill bundling system
└── (7 and 8 can run in parallel)

Wave 6 (After Wave 5):
├── Task 9: Plugin entry point (src/index.ts — wires everything together)
└── Task 10: Example config + README

Wave 7 (Final):
└── Task 11: Integration verification (full build + type check + import test)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 5, 6, 7, 8, 9 | None (foundation) |
| 2 | 1 | 3, 6 | — |
| 3 | 2 | 4, 9 | — |
| 4 | 3 | 6, 9 | 5 |
| 5 | 1 | 6 | 4 |
| 6 | 4, 5 | 7, 9 | — |
| 7 | 6 | 9 | 8 |
| 8 | 1 | 9 | 7 |
| 9 | 3, 4, 6, 7, 8 | 10, 11 | — |
| 10 | 9 | 11 | — |
| 11 | 9, 10 | None (final) | — |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick") |
| 2 | 2, 3 | task(category="unspecified-low") — sequential |
| 3 | 4, 5 | task(category="deep") — can parallelize |
| 4 | 6 | task(category="deep") |
| 5 | 7, 8 | task(category="unspecified-low") — parallel |
| 6 | 9 | task(category="unspecified-high") |
| 7 | 10, 11 | task(category="quick") |

---

## TODOs

### Task 1: Project Scaffolding

- [x] 1. Initialize Bun/TypeScript project with oh-my-opencode dependency

  **What to do**:
  - Run `bun init` in project root
  - Configure `package.json`:
    - `name`: `olimpus`
    - `main`: `dist/index.js`
    - `types`: `dist/index.d.ts`
    - `scripts`: `{ "build": "bun build src/index.ts --outdir dist --target bun", "typecheck": "bunx tsc --noEmit" }`
    - `dependencies`: `{ "oh-my-opencode": "^3.4.0", "@opencode-ai/plugin": "^1.1.19", "@opencode-ai/sdk": "^1.1.19", "zod": "^4.1.8", "jsonc-parser": "^3.3.1" }`
    - `peerDependencies`: `{ "@opencode-ai/plugin": "^1.1.19", "@opencode-ai/sdk": "^1.1.19" }`
  - Configure `tsconfig.json`:
    - `target`: `ESNext`
    - `module`: `ESNext`
    - `moduleResolution`: `bundler`
    - `strict`: `true`
    - `types`: `["bun-types"]`
    - `outDir`: `dist`
    - `rootDir`: `src`
    - `declaration`: `true`
  - Create directory structure:
    ```
    src/
    ├── config/
    ├── plugin/
    ├── agents/
    │   └── definitions/
    └── skills/
    ```
  - Run `bun install`

  **Must NOT do**:
  - Do NOT install oh-my-opencode globally
  - Do NOT create oh-my-opencode.json
  - Do NOT add test frameworks

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward scaffolding, no complex logic
  - **Skills**: [`typescript`]
    - `typescript`: tsconfig.json configuration best practices

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  - **Blocked By**: None (start immediately)

  **References**:

  **Pattern References**:
  - oh-my-opencode `package.json`: https://github.com/code-yeongyu/oh-my-opencode/blob/main/package.json — Reference for dependency versions and build setup
  - oh-my-opencode `tsconfig.json`: https://github.com/code-yeongyu/oh-my-opencode/blob/main/tsconfig.json — Reference for TypeScript config compatible with oh-my-opencode

  **External References**:
  - Bun docs: https://bun.sh/docs/typescript — Bun TypeScript setup
  - OpenCode plugin API: `@opencode-ai/plugin` v1.1.19 — Plugin interface types

  **Acceptance Criteria**:
  - [ ] `package.json` exists with all listed dependencies
  - [ ] `tsconfig.json` exists with strict mode and ESNext target
  - [ ] Directory structure `src/{config,plugin,agents/definitions,skills}` exists
  - [ ] `bun install` completes without errors (exit code 0)
  - [ ] `bunx tsc --noEmit` runs (may have errors since no source files yet — that's OK)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Project initializes and installs dependencies
    Tool: Bash (bun)
    Preconditions: Empty /Users/adelafde/dev/NTT/olimpo directory
    Steps:
      1. Run: bun install
      2. Assert: exit code 0
      3. Assert: node_modules/oh-my-opencode exists
      4. Assert: node_modules/@opencode-ai/plugin exists
      5. Assert: node_modules/@opencode-ai/sdk exists
      6. Assert: node_modules/zod exists
      7. Run: ls src/config src/plugin src/agents/definitions src/skills
      8. Assert: all directories exist (exit code 0)
    Expected Result: All dependencies installed, directory structure present
    Evidence: Terminal output captured

  Scenario: TypeScript config is valid
    Tool: Bash (bun)
    Preconditions: tsconfig.json exists
    Steps:
      1. Run: bunx tsc --showConfig
      2. Assert: output contains "strict": true
      3. Assert: output contains "target": "ESNext" (or esnext)
      4. Assert: output contains "module": "ESNext" (or esnext)
    Expected Result: TypeScript configured correctly for Bun
    Evidence: tsc --showConfig output captured
  ```

  **Commit**: YES
  - Message: `chore(scaffold): initialize olimpus plugin project with bun and oh-my-opencode dependency`
  - Files: `package.json, tsconfig.json, bun.lockb, src/` (directory structure)
  - Pre-commit: `bun install`

---

### Task 2: Config Schema (Zod v4)

- [x] 2. Define Zod v4 schema for olimpus.jsonc

  **What to do**:
  - Create `src/config/schema.ts`
  - Define Olimpus-specific schema sections:
    - `meta_agents`: Record of meta-agent definitions with routing rules
    - `skills`: Array of Olimpus-bundled skill paths
    - `settings`: Olimpus-level settings (namespace prefix, max delegation depth, etc.)
  - Define oh-my-opencode passthrough schema sections:
    - `agents`: Record of agent overrides (model, temperature, etc.) — matches oh-my-opencode's AgentOverridesSchema
    - `categories`: Record of category configs — matches oh-my-opencode's CategoriesSchema
    - `disabled_hooks`: Array of hook names to disable
  - Define routing rule schemas:
    - `RoutingRuleSchema`: `{ matcher, target_agent, config_overrides? }`
    - `MatcherSchema`: discriminated union of matcher types (keyword, complexity, regex, project_context, always)
    - `KeywordMatcherSchema`: `{ type: "keyword", keywords: string[], mode: "any" | "all" }`
    - `ComplexityMatcherSchema`: `{ type: "complexity", threshold: "low" | "medium" | "high" }`
    - `RegexMatcherSchema`: `{ type: "regex", pattern: string, flags?: string }`
    - `ProjectContextMatcherSchema`: `{ type: "project_context", has_files?: string[], has_deps?: string[] }`
    - `AlwaysMatcherSchema`: `{ type: "always" }` (fallback/default route)
  - Define meta-agent definition schema:
    - `MetaAgentSchema`: `{ base_model, delegates_to: string[], routing_rules: RoutingRule[], prompt_template?, temperature? }`
  - Export top-level `OlimpusConfigSchema` combining all sections
  - Export TypeScript types inferred from schemas: `OlimpusConfig`, `MetaAgentDef`, `RoutingRule`, `Matcher`
  - **CRITICAL**: Use Zod v4 syntax (`z.object()`, `z.discriminatedUnion()`, etc. — check v4 API if needed)

  **Must NOT do**:
  - Do NOT use Zod v3 syntax (no `.parse()` differences, but API surface differs)
  - Do NOT import schemas from oh-my-opencode internals (reimplment compatible ones)
  - Do NOT over-engineer — keep schemas flat and readable

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Schema definition is formulaic, not complex logic
  - **Skills**: [`typescript`, `zod-4`]
    - `typescript`: Strict type inference from Zod schemas
    - `zod-4`: CRITICAL — Zod v4 has breaking changes from v3, need correct API

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential with Task 3)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 3, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - oh-my-opencode config schema: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/config/schema.ts — Top-level schema structure to be passthrough-compatible with
  - oh-my-opencode agent overrides: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/config/schema/agent-overrides.ts — AgentOverridesSchema to replicate for passthrough
  - oh-my-opencode categories schema: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/config/schema/categories.ts — CategoriesSchema to replicate

  **API/Type References**:
  - `@opencode-ai/sdk` AgentConfig: `{ model: string, temperature?: number, prompt?: string, variant?: string }` — The target shape meta-agents must produce
  - oh-my-opencode BuiltinAgentName: `"sisyphus" | "hephaestus" | "oracle" | "librarian" | "explore" | "multimodal-looker" | "metis" | "momus" | "atlas"` — Valid delegation targets

  **External References**:
  - Zod v4 docs: https://zod.dev/ — Use v4 API (discriminatedUnion, etc.)

  **Acceptance Criteria**:
  - [ ] `src/config/schema.ts` exists and exports `OlimpusConfigSchema`
  - [ ] Schema validates a well-formed olimpus.jsonc config object without errors
  - [ ] Schema rejects invalid config (missing required fields) with descriptive errors
  - [ ] All TypeScript types are exported: `OlimpusConfig`, `MetaAgentDef`, `RoutingRule`, `Matcher`
  - [ ] `bunx tsc --noEmit` passes for this file (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Schema validates correct olimpus config
    Tool: Bash (bun)
    Preconditions: src/config/schema.ts exists
    Steps:
      1. Create temp file: /tmp/test-schema.ts with:
         import { OlimpusConfigSchema } from './src/config/schema'
         const validConfig = {
           meta_agents: {
             "olimpus:atenea": {
               base_model: "anthropic/claude-sonnet-4-20250514",
               delegates_to: ["oracle", "explore"],
               routing_rules: [{ matcher: { type: "always" }, target_agent: "oracle" }]
             }
           },
           agents: { sisyphus: { model: "anthropic/claude-sonnet-4-20250514" } },
           settings: { namespace_prefix: "olimpus", max_delegation_depth: 3 }
         }
         const result = OlimpusConfigSchema.safeParse(validConfig)
         console.log("SUCCESS:", result.success)
         if (!result.success) console.log("ERRORS:", result.error)
      2. Run: bun run /tmp/test-schema.ts
      3. Assert: output contains "SUCCESS: true"
    Expected Result: Valid config passes schema validation
    Evidence: Terminal output captured

  Scenario: Schema rejects invalid config
    Tool: Bash (bun)
    Preconditions: src/config/schema.ts exists
    Steps:
      1. Create temp file: /tmp/test-schema-invalid.ts with:
         import { OlimpusConfigSchema } from './src/config/schema'
         const invalidConfig = { meta_agents: { "bad": { } } }
         const result = OlimpusConfigSchema.safeParse(invalidConfig)
         console.log("SUCCESS:", result.success)
         if (!result.success) console.log("HAS_ERRORS: true")
      2. Run: bun run /tmp/test-schema-invalid.ts
      3. Assert: output contains "SUCCESS: false"
      4. Assert: output contains "HAS_ERRORS: true"
    Expected Result: Invalid config fails validation with errors
    Evidence: Terminal output captured

  Scenario: TypeScript types are correctly exported
    Tool: Bash (bun)
    Preconditions: src/config/schema.ts exists
    Steps:
      1. Create temp file: /tmp/test-types.ts with:
         import type { OlimpusConfig, MetaAgentDef, RoutingRule, Matcher } from './src/config/schema'
         const _config: OlimpusConfig = {} as any
         const _meta: MetaAgentDef = {} as any
         const _rule: RoutingRule = {} as any
         const _matcher: Matcher = {} as any
         console.log("TYPES_OK")
      2. Run: bunx tsc --noEmit /tmp/test-types.ts
      3. Assert: exit code 0 (no type errors)
    Expected Result: All types compile without errors
    Evidence: tsc output captured
  ```

  **Commit**: YES
  - Message: `feat(config): add zod v4 schema for olimpus.jsonc with meta-agent and routing rule types`
  - Files: `src/config/schema.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 3: Config Loader + Translation Layer

- [x] 3. Implement config loader and oh-my-opencode config translator

  **What to do**:
  - Create `src/config/loader.ts`:
    - `loadOlimpusConfig(projectDir: string): OlimpusConfig` — Reads olimpus.jsonc from project dir (and optionally user config dir), parses JSONC, validates with schema, returns typed config
    - Use `jsonc-parser` for JSONC parsing (same as oh-my-opencode)
    - Search order: project dir first, then user config dir (`~/.config/opencode/`), merge (project overrides user)
  - Create `src/config/translator.ts`:
    - `translateToOMOConfig(config: OlimpusConfig): OMOPluginConfig` — Extracts oh-my-opencode fields (agents, categories, disabled_hooks) and returns them in the format oh-my-opencode's internal config loading expects
    - `extractMetaAgentDefs(config: OlimpusConfig): Record<string, MetaAgentDef>` — Extracts Olimpus-specific meta-agent definitions
    - The translator produces an object compatible with oh-my-opencode's `PluginConfigSchema` (without writing a file)
  - Create `src/config/types.ts` (if needed for translator output types)

  **Must NOT do**:
  - Do NOT write temp files for config translation
  - Do NOT import oh-my-opencode's internal config loading functions
  - Do NOT read oh-my-opencode.json — only olimpus.jsonc

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Config loading is well-understood pattern, not algorithmically complex
  - **Skills**: [`typescript`, `zod-4`]
    - `typescript`: Strict type handling for config translation
    - `zod-4`: Schema validation on load

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 2)
  - **Blocks**: Tasks 4, 9
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - oh-my-opencode config loading: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/plugin-config.ts — `loadPluginConfig()` implementation showing search dirs, JSONC parsing, schema validation, merge logic. THIS IS THE PATTERN TO REIMPLEMENT.
  - oh-my-opencode config schema: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/config/schema.ts — The target schema format for translation output

  **API/Type References**:
  - `src/config/schema.ts` (Task 2 output) — `OlimpusConfigSchema`, `OlimpusConfig` type

  **External References**:
  - jsonc-parser: https://www.npmjs.com/package/jsonc-parser — JSONC parsing (same library oh-my-opencode uses)

  **Acceptance Criteria**:
  - [ ] `src/config/loader.ts` exports `loadOlimpusConfig(projectDir: string)`
  - [ ] `src/config/translator.ts` exports `translateToOMOConfig()` and `extractMetaAgentDefs()`
  - [ ] Loader reads from project dir and user config dir, merges correctly
  - [ ] Translator produces output compatible with oh-my-opencode's PluginConfigSchema shape
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Config loader reads and validates olimpus.jsonc
    Tool: Bash (bun)
    Preconditions: src/config/loader.ts and src/config/schema.ts exist
    Steps:
      1. Create /tmp/test-project/olimpus.jsonc with valid config JSON
      2. Create temp test file that imports loadOlimpusConfig and calls it with /tmp/test-project
      3. Run: bun run /tmp/test-loader.ts
      4. Assert: output contains loaded config object with meta_agents key
      5. Assert: no validation errors
    Expected Result: Config loads and validates successfully
    Evidence: Terminal output captured

  Scenario: Translator extracts oh-my-opencode compatible config
    Tool: Bash (bun)
    Preconditions: src/config/translator.ts exists
    Steps:
      1. Create temp test that imports translateToOMOConfig
      2. Pass it a full OlimpusConfig object with agents, categories, disabled_hooks
      3. Assert: returned object has agents, categories, disabled_hooks keys
      4. Assert: returned object does NOT have meta_agents key (stripped)
      5. Assert: agents shape matches oh-my-opencode format
    Expected Result: Translator correctly splits config
    Evidence: Terminal output captured

  Scenario: Config loader rejects invalid JSONC
    Tool: Bash (bun)
    Preconditions: src/config/loader.ts exists
    Steps:
      1. Create /tmp/test-bad/olimpus.jsonc with invalid content: { "meta_agents": 42 }
      2. Create temp test that calls loadOlimpusConfig("/tmp/test-bad")
      3. Run: bun run /tmp/test-bad-loader.ts
      4. Assert: throws or returns error about validation failure
    Expected Result: Invalid config is rejected with clear error
    Evidence: Error output captured
  ```

  **Commit**: YES
  - Message: `feat(config): implement config loader and oh-my-opencode translation layer`
  - Files: `src/config/loader.ts, src/config/translator.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 4: Plugin Wrapper (oh-my-opencode Integration)

- [ ] 4. Implement oh-my-opencode plugin wrapper with PluginInterface merging

  **What to do**:
  - Create `src/plugin/wrapper.ts`:
    - `createOlimpusWrapper(input: PluginInput, config: OlimpusConfig): Promise<PluginInterface>`:
      1. Call `translateToOMOConfig(config)` to get oh-my-opencode compatible config
      2. **CRITICAL**: Need to figure out how to pass translated config to OhMyOpenCodePlugin. Options:
         a. Monkey-patch oh-my-opencode's config loading (inject translated config before calling plugin)
         b. Set up environment/file-based config injection
         c. Call oh-my-opencode's internal `createBuiltinAgents()` directly instead of going through the plugin
         → **Decision needed by executor**: Read oh-my-opencode source to determine the cleanest injection point. The Config Translation Layer approach means we may need to call internal functions rather than the top-level plugin.
      3. Capture oh-my-opencode's returned `PluginInterface` (base interface)
      4. Create Olimpus extensions (meta-agent configs, additional tools, hooks)
      5. Merge: `mergePluginInterfaces(baseInterface, olimpusExtensions)` → combined PluginInterface
    - `mergePluginInterfaces(base: PluginInterface, extension: PluginInterface): PluginInterface`:
      - Merge `tool`: spread both, extension overwrites on conflict
      - Merge `config`: chain config handlers (base first, then extension adds meta-agents)
      - Merge hooks: chain hook handlers sequentially (base first, then extension)
  - **Key insight**: The `config` handler is where agents are registered. oh-my-opencode's config handler returns `{ agents: Record<string, AgentConfig> }`. Olimpus's config handler must add meta-agent AgentConfigs to that same record.

  **Must NOT do**:
  - Do NOT call APIs that don't exist (registerAgent, executeAgent)
  - Do NOT write oh-my-opencode.json to disk
  - Do NOT duplicate oh-my-opencode's tool definitions

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex integration requiring deep understanding of oh-my-opencode internals, config injection, and PluginInterface merging
  - **Skills**: [`typescript`]
    - `typescript`: Complex type handling for PluginInterface generics

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 6, 9
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - oh-my-opencode plugin entry: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/index.ts — Shows how OhMyOpenCodePlugin builds PluginInterface: `createManagers()` → `createTools()` → `createHooks()` → `createPluginInterface()`. UNDERSTAND THIS FLOW to find injection point.
  - oh-my-opencode plugin interface builder: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/plugin-interface.ts — `createPluginInterface()` returns the final PluginInterface object. Shows structure of config/tool/hook handlers.
  - oh-my-opencode builtin agents: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/agents/builtin-agents.ts — `createBuiltinAgents()` returns `Record<string, AgentConfig>`. This might be callable directly for config injection.
  - oh-my-opencode agent builder: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/agents/agent-builder.ts — `buildAgent()` resolves skills/categories into final AgentConfig. Shows agent construction pattern.

  **API/Type References**:
  - `@opencode-ai/plugin` PluginInterface: `{ tool?, config?, event?, "chat.message"?, "chat.params"?, ... }` — The shape to merge
  - `@opencode-ai/sdk` AgentConfig: `{ model, temperature?, prompt?, variant? }` — Shape returned by config handler
  - `src/config/translator.ts` (Task 3 output) — `translateToOMOConfig()` function
  - `src/config/schema.ts` (Task 2 output) — `OlimpusConfig` type

  **Acceptance Criteria**:
  - [ ] `src/plugin/wrapper.ts` exports `createOlimpusWrapper()` and `mergePluginInterfaces()`
  - [ ] Wrapper calls oh-my-opencode and captures its PluginInterface
  - [ ] Merged PluginInterface includes both oh-my-opencode and Olimpus agents
  - [ ] Config handler returns agents from BOTH sources
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Plugin wrapper creates merged PluginInterface
    Tool: Bash (bun)
    Preconditions: src/plugin/wrapper.ts, src/config/ modules exist
    Steps:
      1. Create temp test that imports createOlimpusWrapper
      2. Create mock PluginInput with required fields (client, project, directory, worktree, serverUrl, $)
      3. Create sample OlimpusConfig with 1 meta-agent and 1 agent override
      4. Call createOlimpusWrapper(mockInput, config)
      5. Assert: returned object has 'config' key (config handler)
      6. Assert: returned object has 'tool' key (tools)
      7. Assert: config handler returns agents object
    Expected Result: Wrapper produces valid merged PluginInterface
    Evidence: Terminal output captured

  Scenario: PluginInterface merge combines tools without conflicts
    Tool: Bash (bun)
    Preconditions: mergePluginInterfaces function exists
    Steps:
      1. Create two mock PluginInterfaces with different tool names
      2. Call mergePluginInterfaces(base, extension)
      3. Assert: merged result contains tools from BOTH interfaces
      4. Assert: no tools are lost
    Expected Result: Tools from both interfaces present in merge
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(plugin): implement oh-my-opencode wrapper with PluginInterface merging`
  - Files: `src/plugin/wrapper.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 5: Routing Rule Evaluator

- [ ] 5. Implement routing rule evaluation engine (matchers + resolution)

  **What to do**:
  - Create `src/agents/routing.ts`:
    - `evaluateRoutingRules(rules: RoutingRule[], context: RoutingContext): ResolvedRoute | null`:
      - Iterates rules in order (first match wins)
      - Evaluates each rule's matcher against context
      - Returns resolved route with target agent + config overrides
    - `evaluateMatcher(matcher: Matcher, context: RoutingContext): boolean`:
      - Discriminated union handler for each matcher type:
        - `keyword`: Check if context prompt contains any/all keywords
        - `complexity`: Assess prompt complexity (line count, keyword density heuristic)
        - `regex`: Test context prompt against regex pattern
        - `project_context`: Check if project has specific files/dependencies
        - `always`: Always returns true (default/fallback route)
    - Type `RoutingContext = { prompt: string, projectDir: string, projectFiles?: string[], projectDeps?: string[] }`
    - Type `ResolvedRoute = { target_agent: string, config_overrides?: Partial<AgentConfig> }`
  - Keep matchers SIMPLE — no ML, no complex NLP. Pure rule-based evaluation.
  - `complexity` matcher: use heuristic based on prompt length + presence of technical keywords

  **Must NOT do**:
  - Do NOT add NLP or ML-based complexity analysis
  - Do NOT make matchers async (keep evaluation synchronous and fast)
  - Do NOT import external analysis libraries

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Pattern matching logic with discriminated unions needs careful implementation
  - **Skills**: [`typescript`]
    - `typescript`: Discriminated union handling, exhaustive switch

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 6
  - **Blocked By**: Task 1 (uses types from Task 2 but can import directly)

  **References**:

  **API/Type References**:
  - `src/config/schema.ts` (Task 2 output) — `RoutingRule`, `Matcher`, discriminated union types

  **Acceptance Criteria**:
  - [ ] `src/agents/routing.ts` exports `evaluateRoutingRules()` and `evaluateMatcher()`
  - [ ] Keyword matcher correctly matches "any" and "all" modes
  - [ ] Regex matcher compiles and tests patterns
  - [ ] Always matcher returns true unconditionally
  - [ ] Project context matcher checks file existence
  - [ ] First-match-wins semantics (not best-match)
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Keyword matcher matches prompt containing keywords
    Tool: Bash (bun)
    Preconditions: src/agents/routing.ts exists
    Steps:
      1. Create temp test importing evaluateRoutingRules
      2. Define rules: [{ matcher: { type: "keyword", keywords: ["deploy", "production"], mode: "any" }, target_agent: "oracle" }]
      3. Call with context: { prompt: "deploy to production", projectDir: "/tmp" }
      4. Assert: result is not null
      5. Assert: result.target_agent === "oracle"
    Expected Result: Keyword matcher correctly identifies matching prompt
    Evidence: Terminal output captured

  Scenario: First-match-wins with multiple rules
    Tool: Bash (bun)
    Preconditions: src/agents/routing.ts exists
    Steps:
      1. Define 3 rules: keyword(deploy→oracle), regex(/test/→explore), always(→librarian)
      2. Call with context prompt "deploy now"
      3. Assert: result.target_agent === "oracle" (first match wins, not always)
    Expected Result: First matching rule is selected
    Evidence: Terminal output captured

  Scenario: Always matcher serves as fallback
    Tool: Bash (bun)
    Preconditions: src/agents/routing.ts exists
    Steps:
      1. Define rules: [keyword(deploy→oracle), always(→librarian)]
      2. Call with context prompt "hello world" (no keyword match)
      3. Assert: result.target_agent === "librarian" (always fallback)
    Expected Result: Always matcher catches when no other rules match
    Evidence: Terminal output captured

  Scenario: Returns null when no rules match (no always fallback)
    Tool: Bash (bun)
    Preconditions: src/agents/routing.ts exists
    Steps:
      1. Define rules: [keyword(deploy→oracle)] (no always fallback)
      2. Call with context prompt "hello world"
      3. Assert: result is null
    Expected Result: Null returned when no match and no fallback
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(agents): implement declarative routing rule evaluator with matchers`
  - Files: `src/agents/routing.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 6: Meta-Agent Factory + Registry

- [ ] 6. Implement meta-agent factory (dynamic AgentConfig generation) and delegation registry

  **What to do**:
  - Create `src/agents/meta-agent.ts`:
    - `createMetaAgentConfig(def: MetaAgentDef, context: RoutingContext): AgentConfig`:
      - Evaluates routing rules from the meta-agent definition
      - Generates an `AgentConfig` object dynamically based on matched rule
      - The AgentConfig's `prompt` field is the KEY mechanism — it includes instructions for the agent to delegate via `task` tool to the resolved target agent
      - Base model comes from `def.base_model`, can be overridden by routing rule
      - Temperature, variant can also be overridden
    - `buildDelegationPrompt(metaAgentName: string, targetAgent: string, originalPrompt: string): string`:
      - Generates a system prompt that instructs the meta-agent to delegate work to the target agent using `task` tool
      - Example output: "You are {metaAgentName}. Analyze the user's request and delegate to {targetAgent} using the task tool. Context: {originalPrompt}"
  - Create `src/agents/registry.ts`:
    - `MetaAgentRegistry`:
      - `register(name: string, def: MetaAgentDef): void`
      - `getAll(): Record<string, MetaAgentDef>`
      - `resolve(name: string, context: RoutingContext): AgentConfig`
      - `trackDelegation(from: string, to: string): void` — tracks delegation chain
      - `checkCircular(from: string, to: string, maxDepth: number): boolean` — prevents circular delegation
    - Delegation depth tracking with configurable max (default: 3)

  **Must NOT do**:
  - Do NOT create runtime agent handlers — only AgentConfig objects
  - Do NOT use registerAgent or executeAgent (they don't exist)
  - Do NOT allow circular delegation chains

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core business logic — dynamic config generation + circular dependency detection
  - **Skills**: [`typescript`]
    - `typescript`: Generic types, class design

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (solo)
  - **Blocks**: Tasks 7, 9
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - oh-my-opencode agent builder: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/agents/agent-builder.ts — `buildAgent()` shows how AgentConfig is constructed from configuration. Follow similar pattern for meta-agent config generation.
  - oh-my-opencode builtin agents: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/agents/builtin-agents.ts — Shows how agents like sisyphus, oracle get their prompts. Meta-agent prompts should follow similar structure but with delegation instructions.

  **API/Type References**:
  - `@opencode-ai/sdk` AgentConfig: `{ model: string, temperature?: number, prompt?: string, variant?: string }` — THE target output shape
  - `src/config/schema.ts` (Task 2) — `MetaAgentDef`, `RoutingRule` types
  - `src/agents/routing.ts` (Task 5) — `evaluateRoutingRules()`, `RoutingContext`

  **Acceptance Criteria**:
  - [ ] `src/agents/meta-agent.ts` exports `createMetaAgentConfig()` and `buildDelegationPrompt()`
  - [ ] `src/agents/registry.ts` exports `MetaAgentRegistry` class
  - [ ] Generated AgentConfig has valid `model`, `prompt` (with delegation instructions), `temperature`
  - [ ] Delegation prompt includes `task` tool delegation instructions
  - [ ] Circular delegation detection prevents infinite loops
  - [ ] Max delegation depth is enforced (default: 3)
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Meta-agent factory generates valid AgentConfig
    Tool: Bash (bun)
    Preconditions: src/agents/meta-agent.ts exists
    Steps:
      1. Create temp test importing createMetaAgentConfig
      2. Define MetaAgentDef with base_model and routing rules
      3. Call createMetaAgentConfig(def, context)
      4. Assert: result has 'model' key (string)
      5. Assert: result has 'prompt' key (string, non-empty)
      6. Assert: result.prompt contains 'task' (delegation instruction)
      7. Assert: result.model matches def.base_model or rule override
    Expected Result: Valid AgentConfig generated with delegation prompt
    Evidence: Terminal output captured

  Scenario: Circular delegation detection prevents infinite loops
    Tool: Bash (bun)
    Preconditions: src/agents/registry.ts exists
    Steps:
      1. Create MetaAgentRegistry instance
      2. Track delegation: A → B
      3. Track delegation: B → C
      4. Check: checkCircular("C", "A", 3) → should return true (circular)
      5. Check: checkCircular("C", "D", 3) → should return false (no cycle)
    Expected Result: Circular chains detected, non-circular allowed
    Evidence: Terminal output captured

  Scenario: Max delegation depth enforced
    Tool: Bash (bun)
    Preconditions: src/agents/registry.ts exists
    Steps:
      1. Create registry with maxDepth=3
      2. Track: A→B, B→C, C→D (depth 3)
      3. Attempt: D→E (depth 4)
      4. Assert: depth exceeded error or false returned
    Expected Result: Delegation beyond max depth is rejected
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(agents): implement meta-agent factory with dynamic AgentConfig generation and circular dependency detection`
  - Files: `src/agents/meta-agent.ts, src/agents/registry.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 7: Meta-Agent Definitions

- [ ] 7. Define atenea, hermes, and hefesto meta-agents

  **What to do**:
  - Create `src/agents/definitions/atenea.ts`:
    - Strategic planning meta-agent
    - Delegates to: prometheus, oracle, atlas, metis
    - Routing rules: complexity-based (high → oracle, medium → prometheus, low → atlas)
    - Prompt template: Strategy and architecture analysis, delegates to planning/research agents
  - Create `src/agents/definitions/hermes.ts`:
    - Communication/research meta-agent
    - Delegates to: librarian, explore, oracle
    - Routing rules: keyword-based (docs/search → librarian, code/find → explore, analyze/review → oracle)
    - Prompt template: Information gathering and synthesis
  - Create `src/agents/definitions/hefesto.ts`:
    - Building/implementation meta-agent
    - Delegates to: sisyphus, hephaestus
    - Routing rules: project-context-based (has tests → sisyphus with TDD focus, else → hephaestus)
    - Prompt template: Implementation with quality focus
  - Each file exports a `MetaAgentDef` object that can be registered in the registry
  - Create `src/agents/definitions/index.ts` — barrel export of all definitions

  **Must NOT do**:
  - Do NOT hardcode models in definitions — use base_model from config (definitions provide defaults)
  - Do NOT create agent handler functions — only MetaAgentDef config objects
  - Do NOT over-engineer routing rules — keep them simple and understandable

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Declarative definitions, not complex logic
  - **Skills**: [`typescript`]
    - `typescript`: Type-safe MetaAgentDef objects

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8)
  - **Parallel Group**: Wave 5
  - **Blocks**: Task 9
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - oh-my-opencode builtin agents: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/agents/builtin-agents.ts — Agent prompt patterns and delegation descriptions
  - oh-my-opencode agent types: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/agents/types.ts — `BuiltinAgentName` enum showing valid delegation targets

  **API/Type References**:
  - `src/config/schema.ts` (Task 2) — `MetaAgentDef` type
  - `src/agents/routing.ts` (Task 5) — Routing rule structure
  - Valid delegation targets: `sisyphus`, `hephaestus`, `oracle`, `librarian`, `explore`, `multimodal-looker`, `metis`, `momus`, `atlas`

  **Acceptance Criteria**:
  - [ ] `src/agents/definitions/atenea.ts` exports atenea MetaAgentDef
  - [ ] `src/agents/definitions/hermes.ts` exports hermes MetaAgentDef
  - [ ] `src/agents/definitions/hefesto.ts` exports hefesto MetaAgentDef
  - [ ] `src/agents/definitions/index.ts` barrel-exports all definitions
  - [ ] Each definition has: base_model, delegates_to, routing_rules (at least 2 rules + always fallback)
  - [ ] All delegation targets are valid BuiltinAgentNames
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All meta-agent definitions are valid MetaAgentDefs
    Tool: Bash (bun)
    Preconditions: src/agents/definitions/ files exist
    Steps:
      1. Create temp test importing all definitions from index.ts
      2. Import OlimpusConfigSchema from schema
      3. For each definition: validate it has base_model (string), delegates_to (array), routing_rules (array)
      4. Assert: atenea.delegates_to includes "oracle" or "prometheus"
      5. Assert: hermes.delegates_to includes "librarian" or "explore"
      6. Assert: hefesto.delegates_to includes "sisyphus" or "hephaestus"
      7. Assert: each definition has at least one "always" matcher as fallback
    Expected Result: All definitions are structurally valid
    Evidence: Terminal output captured

  Scenario: Definitions compile with correct types
    Tool: Bash (bun)
    Preconditions: All definition files exist
    Steps:
      1. Run: bunx tsc --noEmit
      2. Assert: exit code 0
    Expected Result: No type errors in definitions
    Evidence: tsc output captured
  ```

  **Commit**: YES
  - Message: `feat(agents): add atenea, hermes, and hefesto meta-agent definitions`
  - Files: `src/agents/definitions/atenea.ts, src/agents/definitions/hermes.ts, src/agents/definitions/hefesto.ts, src/agents/definitions/index.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 8: Skill Bundling System

- [ ] 8. Implement Olimpus skill bundling system

  **What to do**:
  - Create `src/skills/loader.ts`:
    - `loadOlimpusSkills(skillPaths: string[], projectDir: string): SkillDefinition[]`:
      - Reads skill files from specified paths (relative to project or absolute)
      - Returns array of skill definitions that can be merged into oh-my-opencode's skill system
    - `mergeSkills(baseSkills: SkillDefinition[], olimpusSkills: SkillDefinition[]): SkillDefinition[]`:
      - Combines oh-my-opencode's skills with Olimpus-bundled skills
      - Olimpus skills use `olimpus:` prefix to avoid naming conflicts
  - Create `src/skills/types.ts` (if needed for SkillDefinition type)
  - Skill format should be compatible with oh-my-opencode's skill system (markdown files with frontmatter)
  - This is a LIGHTWEIGHT implementation — just file loading and namespace management

  **Must NOT do**:
  - Do NOT create a complex skill registry
  - Do NOT implement skill execution (oh-my-opencode handles that)
  - Do NOT bundle actual skill content in this task — just the loading mechanism

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Simple file loading logic
  - **Skills**: [`typescript`]
    - `typescript`: Type definitions for skill system

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 7)
  - **Parallel Group**: Wave 5
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - oh-my-opencode skill loading: investigate `src/skills/` directory in oh-my-opencode repo — how skills are loaded and registered

  **Acceptance Criteria**:
  - [ ] `src/skills/loader.ts` exports `loadOlimpusSkills()` and `mergeSkills()`
  - [ ] Skills are loaded from configured paths
  - [ ] Namespace prefix `olimpus:` applied to Olimpus skills
  - [ ] Merge doesn't overwrite oh-my-opencode's base skills
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Skill loader reads skill files from path
    Tool: Bash (bun)
    Preconditions: src/skills/loader.ts exists
    Steps:
      1. Create temp skill file at /tmp/test-skills/my-skill.md
      2. Call loadOlimpusSkills(["/tmp/test-skills/my-skill.md"], "/tmp/test-project")
      3. Assert: returns array with 1 element
      4. Assert: element has name containing "olimpus:" prefix
    Expected Result: Skills loaded with namespace prefix
    Evidence: Terminal output captured

  Scenario: Skill merge combines without overwriting
    Tool: Bash (bun)
    Preconditions: src/skills/loader.ts exists
    Steps:
      1. Create base skills array with 2 skills named "git-master", "typescript"
      2. Create olimpus skills array with 1 skill named "olimpus:custom"
      3. Call mergeSkills(base, olimpus)
      4. Assert: result has 3 skills total
      5. Assert: "git-master" and "typescript" are still present
    Expected Result: Both skill sets preserved in merge
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(skills): implement skill bundling system with namespace management`
  - Files: `src/skills/loader.ts, src/skills/types.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 9: Plugin Entry Point (Wire Everything Together)

- [ ] 9. Create main plugin entry point that wires all modules together

  **What to do**:
  - Create `src/index.ts`:
    - Default export: `OlimpusPlugin: Plugin` (the function OpenCode calls)
    - Implementation flow:
      1. Receive `PluginInput` from OpenCode
      2. Call `loadOlimpusConfig(input.directory)` to read olimpus.jsonc
      3. Call `extractMetaAgentDefs(config)` to get meta-agent definitions
      4. Create `MetaAgentRegistry` and register all meta-agents (from config + built-in defaults)
      5. Register built-in meta-agents (atenea, hermes, hefesto) if not overridden in config
      6. Call `createOlimpusWrapper(input, config)` to get merged PluginInterface
      7. Add meta-agent AgentConfigs to the config handler's output
      8. Load and merge Olimpus skills if configured
      9. Return final `PluginInterface`
    - Error handling: If olimpus.jsonc not found, log warning and fall through to oh-my-opencode defaults
    - Error handling: If oh-my-opencode fails to load, throw with helpful message
  - Ensure the export signature matches `Plugin` type from `@opencode-ai/plugin`

  **Must NOT do**:
  - Do NOT export anything except the Plugin function as default
  - Do NOT add CLI entrypoint — this is a plugin only
  - Do NOT catch and swallow errors silently

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration task wiring all modules — needs understanding of entire system
  - **Skills**: [`typescript`]
    - `typescript`: Plugin type compliance, async/await patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on most tasks)
  - **Parallel Group**: Wave 6 (solo)
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Tasks 3, 4, 6, 7, 8

  **References**:

  **Pattern References**:
  - oh-my-opencode entry point: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/index.ts — Shows exact Plugin function signature and PluginInterface construction pattern. FOLLOW THIS PATTERN.
  - oh-my-opencode plugin types: https://github.com/code-yeongyu/oh-my-opencode/blob/main/src/plugin/types.ts — `PluginContext`, `PluginInterface` type definitions

  **API/Type References**:
  - `@opencode-ai/plugin` Plugin type: `(input: PluginInput) => Promise<PluginInterface>` — MUST match this signature
  - All internal modules from Tasks 2-8

  **Acceptance Criteria**:
  - [ ] `src/index.ts` default-exports a Plugin function
  - [ ] Plugin function signature matches `@opencode-ai/plugin` Plugin type
  - [ ] Config loading, translation, wrapping, and meta-agent registration all called in correct order
  - [ ] Built-in meta-agents (atenea, hermes, hefesto) registered by default
  - [ ] Error handling for missing config and oh-my-opencode failures
  - [ ] `bunx tsc --noEmit` passes (0 type errors)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Plugin entry point exports valid Plugin function
    Tool: Bash (bun)
    Preconditions: All source files exist
    Steps:
      1. Create temp test:
         import OlimpusPlugin from './src/index'
         console.log("TYPE:", typeof OlimpusPlugin)
         console.log("IS_FUNCTION:", typeof OlimpusPlugin === 'function')
      2. Run: bun run /tmp/test-entry.ts
      3. Assert: output contains "IS_FUNCTION: true"
    Expected Result: Default export is a function
    Evidence: Terminal output captured

  Scenario: Plugin compiles without type errors
    Tool: Bash (bun)
    Preconditions: All source files exist
    Steps:
      1. Run: bunx tsc --noEmit
      2. Assert: exit code 0
      3. Assert: no error output
    Expected Result: Full project type-checks cleanly
    Evidence: tsc output captured
  ```

  **Commit**: YES
  - Message: `feat(core): wire plugin entry point connecting all olimpus modules`
  - Files: `src/index.ts`
  - Pre-commit: `bunx tsc --noEmit`

---

### Task 10: Example Config + README

- [ ] 10. Create example olimpus.jsonc configuration and README

  **What to do**:
  - Create `olimpus.jsonc` in project root (example/template config):
    - Show all sections with comments explaining each field
    - Include meta_agents section with atenea, hermes, hefesto examples
    - Include agents passthrough section with common model overrides
    - Include settings section with defaults
    - Include routing rules examples for each matcher type
    - Use JSONC comments extensively for documentation
  - Create `README.md`:
    - What is Olimpus (1 paragraph)
    - Installation: `bun add olimpus` + configure opencode.jsonc
    - Configuration: olimpus.jsonc structure overview
    - Meta-agents: what each one does, how routing works
    - Custom routing rules: how to write your own
    - Skill bundling: how to add custom skills
    - Architecture: brief diagram of wrapper pattern

  **Must NOT do**:
  - Do NOT create overly verbose documentation
  - Do NOT include implementation details in README
  - Do NOT add badges, contributing guide, or license (keep minimal)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation and example config creation
  - **Skills**: [`typescript`]
    - `typescript`: Accurate type descriptions in documentation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6 (after Task 9)
  - **Blocks**: Task 11
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - oh-my-opencode README: https://github.com/code-yeongyu/oh-my-opencode/blob/main/README.md — Reference for documentation style
  - oh-my-opencode example config: research the repo for example oh-my-opencode.json — Pattern for config documentation

  **Acceptance Criteria**:
  - [ ] `olimpus.jsonc` exists in project root with valid JSONC
  - [ ] Config file validates against OlimpusConfigSchema
  - [ ] README.md exists with installation, configuration, and usage sections
  - [ ] README includes architecture diagram

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Example config validates against schema
    Tool: Bash (bun)
    Preconditions: olimpus.jsonc and src/config/schema.ts exist
    Steps:
      1. Create temp test that reads olimpus.jsonc with jsonc-parser
      2. Validates against OlimpusConfigSchema
      3. Assert: validation passes (success: true)
    Expected Result: Example config is valid
    Evidence: Terminal output captured

  Scenario: README has required sections
    Tool: Bash (bun)
    Preconditions: README.md exists
    Steps:
      1. Read README.md content
      2. Assert: contains "Installation" or "Install"
      3. Assert: contains "Configuration" or "Config"
      4. Assert: contains "Meta-agent" or "meta_agents"
      5. Assert: contains "olimpus.jsonc"
    Expected Result: All required sections present
    Evidence: File content check
  ```

  **Commit**: YES
  - Message: `docs: add example olimpus.jsonc config and README`
  - Files: `olimpus.jsonc, README.md`
  - Pre-commit: N/A

---

### Task 11: Integration Verification

- [ ] 11. Full integration verification — build, type check, import test

  **What to do**:
  - Run full type check: `bunx tsc --noEmit` — must pass with 0 errors
  - Run build: `bun build src/index.ts --outdir dist --target bun` — must produce output
  - Run import test: Create a temp script that imports the built plugin and verifies:
    1. Default export is a function
    2. Function accepts PluginInput-shaped argument
    3. Config schema can parse the example olimpus.jsonc
  - Verify dist/ output contains expected files
  - Fix any issues found during verification

  **Must NOT do**:
  - Do NOT skip any verification step
  - Do NOT add new features — only fix integration issues

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification only, no new code
  - **Skills**: [`typescript`]
    - `typescript`: Type error diagnosis

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 7 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 9, 10

  **References**:

  **Pattern References**:
  - All source files from Tasks 1-10

  **Acceptance Criteria**:
  - [ ] `bunx tsc --noEmit` → exit code 0, 0 errors
  - [ ] `bun build src/index.ts --outdir dist --target bun` → exit code 0, dist/ populated
  - [ ] Import test: `import Plugin from './dist/index'` → Plugin is a function
  - [ ] Schema test: example olimpus.jsonc validates against OlimpusConfigSchema
  - [ ] No runtime errors on import

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full project type-checks successfully
    Tool: Bash (bun)
    Preconditions: All source files exist
    Steps:
      1. Run: bunx tsc --noEmit
      2. Assert: exit code 0
      3. Assert: stderr is empty or contains no errors
    Expected Result: Zero type errors across entire project
    Evidence: tsc output captured

  Scenario: Build produces dist output
    Tool: Bash (bun)
    Preconditions: All source files exist
    Steps:
      1. Run: bun build src/index.ts --outdir dist --target bun
      2. Assert: exit code 0
      3. Assert: dist/index.js exists
      4. Assert: dist/index.js file size > 0
    Expected Result: Build output created successfully
    Evidence: Build output + ls dist/ captured

  Scenario: Built plugin is importable and callable
    Tool: Bash (bun)
    Preconditions: dist/index.js exists
    Steps:
      1. Create temp test:
         const mod = await import('./dist/index')
         const Plugin = mod.default
         console.log("IS_FUNCTION:", typeof Plugin === 'function')
      2. Run: bun run /tmp/test-import.ts
      3. Assert: output contains "IS_FUNCTION: true"
    Expected Result: Plugin function is importable from dist
    Evidence: Terminal output captured

  Scenario: Example config validates end-to-end
    Tool: Bash (bun)
    Preconditions: dist/index.js and olimpus.jsonc exist
    Steps:
      1. Create temp test that:
         - Reads olimpus.jsonc with jsonc-parser
         - Imports OlimpusConfigSchema from source
         - Validates config
         - Prints result
      2. Run: bun run /tmp/test-e2e-config.ts
      3. Assert: "SUCCESS: true" in output
    Expected Result: End-to-end config validation works
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `chore: verify full integration — build, typecheck, and import tests pass`
  - Files: Any fixes needed
  - Pre-commit: `bunx tsc --noEmit && bun build src/index.ts --outdir dist --target bun`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore(scaffold): initialize olimpus plugin project` | package.json, tsconfig.json, bun.lockb, src/ | bun install |
| 2 | `feat(config): add zod v4 schema for olimpus.jsonc` | src/config/schema.ts | tsc --noEmit |
| 3 | `feat(config): implement config loader and translation layer` | src/config/loader.ts, translator.ts | tsc --noEmit |
| 4 | `feat(plugin): implement oh-my-opencode wrapper` | src/plugin/wrapper.ts | tsc --noEmit |
| 5 | `feat(agents): implement routing rule evaluator` | src/agents/routing.ts | tsc --noEmit |
| 6 | `feat(agents): implement meta-agent factory and registry` | src/agents/meta-agent.ts, registry.ts | tsc --noEmit |
| 7 | `feat(agents): add meta-agent definitions` | src/agents/definitions/*.ts | tsc --noEmit |
| 8 | `feat(skills): implement skill bundling system` | src/skills/loader.ts, types.ts | tsc --noEmit |
| 9 | `feat(core): wire plugin entry point` | src/index.ts | tsc --noEmit |
| 10 | `docs: add example config and README` | olimpus.jsonc, README.md | schema validation |
| 11 | `chore: verify full integration` | Any fixes | build + typecheck + import |

---

## Success Criteria

### Verification Commands
```bash
bunx tsc --noEmit                                    # Expected: 0 errors
bun build src/index.ts --outdir dist --target bun    # Expected: dist/index.js created
bun -e "import P from './dist/index'; console.log(typeof P)"  # Expected: function
```

### Final Checklist
- [ ] All "Must Have" requirements present
- [ ] All "Must NOT Have" guardrails respected
- [ ] olimpus.jsonc is the ONLY config file (no oh-my-opencode.json)
- [ ] Meta-agents appear with `olimpus:` prefix
- [ ] oh-my-opencode used as internal dependency only
- [ ] Build produces working dist/ output
- [ ] TypeScript compiles with 0 errors
- [ ] Example config validates against schema
