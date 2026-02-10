# Learnings — Olimpus Plugin

## Task 1: Project Initialization

### oh-my-opencode Distribution
- oh-my-opencode v3.4.0 is pre-built (dist/ directory only, no src/)
- Authoritative source is node_modules/oh-my-opencode/dist/ (not GitHub URLs)
- Includes agents/, config/, features/, hooks/, mcp/, shared/, tools/, plugin-handlers/ modules

### Bun Init Quirks
- `bun init --yes` creates tsconfig with "Preserve" module (not ESNext)
- Creates index.ts in root - conflicts with rootDir: "src"
- Auto-installs @types/bun and typescript@5.x

### TypeScript Configuration (ESNext + Bundler)
- "moduleResolution": "bundler" required for Bun
- "strict": true enables all strict checks
- "declaration": true auto-generates .d.ts files
- "outDir": "dist" & "rootDir": "src" must be consistent
- Root-level TypeScript files must be excluded when using rootDir

### Dependency Installation
- All dependencies installed successfully:
  - oh-my-opencode@3.4.0 ✅
  - @opencode-ai/plugin@1.1.53 ✅
  - @opencode-ai/sdk@1.1.53 ✅
  - zod@4.3.6 ✅ (matches oh-my-opencode v3.4.0 requirement)
  - jsonc-parser@3.3.1 ✅
- 112 total packages, 3 blocked postinstalls (non-critical)

### TypeScript Verification
- tsc --noEmit passes cleanly with src/index.ts placeholder
- No source files needed for initial verification

## Conventions & Patterns
(Discoveries about effective implementation approaches)

---

## [2026-02-10T14:53] Task 1: Project Scaffolding

### oh-my-opencode Package Structure
- **CRITICAL**: oh-my-opencode is a COMPILED npm package, NOT a git repo
- Source code is in `dist/` (compiled JS + .d.ts), NOT `src/`
- This is CORRECT for npm dependencies — `dist/` contains everything we need
- Type definitions in `dist/**/*.d.ts` are sufficient for TypeScript imports
- No raw source needed — we import from `dist/` paths

### Bun + TypeScript Setup
- `allowImportingTsExtensions: true` required for Bun's native TS support
- `verbatimModuleSyntax: true` ensures clean ESM output
- `skipLibCheck: true` recommended for faster typechecking with large deps
- `declaration: true` + `declarationMap: true` for proper .d.ts output

### Directory Structure
- All `src/` subdirectories created upfront for clean import paths
- Empty directories are fine — populated in subsequent tasks

---

## [2026-02-10T15:12] Task 2: Zod v4 Config Schema

### Zod v4 API Patterns (Critical Differences from v3)
- **Top-level validators**: `z.email()`, `z.uuid()`, `z.url()` (NOT `z.string().email()` etc.)
- **Discriminated unions**: Use `z.discriminatedUnion("type", [...])` for tagged unions (more efficient than `z.union()`)
- **Error handling**: Use `{ error: "message" }` param instead of `.message()` or `required_error()`
- **Min/max strings**: Use `.min(1)` instead of `.nonempty()`, `.min(1).max(100)` for constrained strings
- **Type inference**: `z.infer<typeof Schema>` extracts TypeScript types from schemas (works identically to v3)

### oh-my-opencode Schema Compatibility
- Analyzed `node_modules/oh-my-opencode/dist/config/schema.d.ts` (1400+ lines)
- oh-my-opencode's `AgentOverrideConfigSchema` is MASSIVE (30+ optional fields with nested objects)
- **Simplification strategy for Olimpus**: Support only core fields for routing overrides:
  - `model` (string)
  - `temperature` (number)
  - `prompt` (string)
  - `variant` (string)
- Full schema complexity deferred to later tasks (Task 3 Config Translation Layer will handle passthrough)
- Valid delegation targets from BuiltinAgentNameSchema: sisyphus, hephaestus, oracle, librarian, explore, multimodal-looker, metis, momus, atlas, prometheus

### Matcher Discriminated Union Design
- **Discriminator field**: `type` (string literal)
- **5 matcher types**:
  1. `keyword`: Array of strings to match, mode "any" or "all"
  2. `complexity`: Threshold level (low/medium/high)
  3. `regex`: Pattern string + optional flags
  4. `project_context`: has_files? and has_deps? for file/dependency detection
  5. `always`: Fallback/catch-all route (no config, just `{ type: "always" }`)
- **First-match-wins semantics**: Routing rules evaluated in order, first match selected
- **Type safety**: Discriminated union ensures TypeScript compiler enforces matcher schema

### Schema Structure (src/config/schema.ts)
```
OlimpusConfigSchema (top level)
├── Olimpus-specific sections:
│   ├── meta_agents: Record<string, MetaAgentDef>
│   ├── settings: Olimpus settings (namespace_prefix, max_delegation_depth)
│   └── skills: string[] (skill paths)
└── oh-my-opencode passthrough sections:
    ├── agents: Record<string, AgentOverride> (simplified for now)
    ├── categories: Record<string, CategoryConfig>
    └── disabled_hooks: string[]

MetaAgentDef shape:
- base_model (required): String model identifier
- delegates_to (required): Array of builtin agent names
- routing_rules (required): Array of routing rules
- prompt_template (optional): System prompt template
- temperature (optional): LLM temperature override
```

### Type Exports
All key types exported via `z.infer<typeof Schema>`:
- `OlimpusConfig` (top-level config object)
- `MetaAgentDef` (meta-agent definition)
- `RoutingRule` (routing rule with matcher + target)
- `Matcher` (discriminated union of all matcher types)
- `KeywordMatcher`, `ComplexityMatcher`, `RegexMatcher`, `ProjectContextMatcher`, `AlwaysMatcher` (individual matcher types)
- `AgentOverride`, `CategoryConfig`, `Settings` (sub-configs)

### QA Verification Results ✅
1. **Valid config passes**: OlimpusConfigSchema validates correct olimpus.jsonc structure
2. **Invalid config fails**: Schema rejects incomplete meta-agent definitions with validation errors
3. **Type exports work**: All TypeScript types compile without errors
4. **tsc --noEmit**: 0 type errors for entire schema file

### Files Created
- `src/config/schema.ts` — Complete Zod v4 schema with all matcher types, meta-agent definitions, and type exports (165 lines)

---

## [2026-02-10T16:00] Task 3: Config Loader & Translator

### Config Loader Implementation (src/config/loader.ts)

**loadOlimpusConfig(projectDir: string): OlimpusConfig**
- Searches for olimpus.jsonc in: project dir first (higher priority), then user config dir (~/.config/opencode/)
- Uses `parse()` from jsonc-parser with `allowTrailingComma: true` option
- Deep merges configs: project overrides user (objects merged recursively, arrays replaced)
- Validates merged config with OlimpusConfigSchema using Zod safeParse()
- Throws detailed error messages on parse/validation failure

**Key Implementation Details:**
- `parse()` function (not parseTree) handles JSONC parsing with comments
- Error codes from jsonc-parser: 1=key parsing, 3=colon, 4=value, 5=EOF marker, 9=trailing data
- Deep merge preserves user config as base, project config as override
- Type-only imports for ParseError, OlimpusConfig (verbatimModuleSyntax: true)

### Config Translator Implementation (src/config/translator.ts)

**translateToOMOConfig(config: OlimpusConfig): OMOPluginConfig**
- Extracts oh-my-opencode passthrough fields: agents, categories, disabled_hooks
- Strips Olimpus-specific fields: meta_agents, settings, skills
- Returns in-memory config object (no file I/O)
- Provides defensive defaults: {} for agents/categories, [] for disabled_hooks

**extractMetaAgentDefs(config: OlimpusConfig): Record<string, MetaAgentDef>**
- Extracts olimpus-specific meta_agents section
- Returns empty object if meta_agents undefined (safe default)

**OMOPluginConfig Interface:**
- Subset of oh-my-opencode's OhMyOpenCodeConfig
- Contains only fields plugins can set via JSONC config
- Compatible with oh-my-opencode's PluginConfigSchema shape (agents, categories, disabled_hooks)

### QA Verification Results ✅

1. **Scenario 1 (Valid config)**: Loads complex JSONC with meta_agents, agents, disabled_hooks ✓
2. **Scenario 2 (Translation)**: Translator correctly extracts OMO fields, strips olimpus fields ✓
3. **Scenario 3 (Meta-agent extraction)**: extractMetaAgentDefs returns only meta_agents section ✓
4. **Scenario 4 (Invalid config)**: Schema validation rejects incomplete meta-agent defs ✓
5. **Final TypeScript check**: tsc --noEmit passes with 0 errors ✓

### Technical Decisions

**JSONC Parser API:**
- `parse()` is the correct choice for config loading (returns plain JS object with error array)
- `parseTree()` was incorrect (returns intermediate node tree, harder to handle)
- Must use `allowTrailingComma: true` for JSONC compatibility

**Merge Strategy:**
- Deep merge only for nested objects (preserves structure)
- Arrays are replaced entirely (not concatenated) — consistent with config override semantics
- User config loads first, project config overlays (project wins)

**Error Reporting:**
- Zod safeParse() for schema validation (returns { success, data/error })
- Parse errors from jsonc-parser converted to human-readable line numbers
- Detailed error messages include field paths and validation reasons

### Files Created
- `src/config/loader.ts` — Config loading with JSONC parsing, merging, validation (79 lines)
- `src/config/translator.ts` — Config translation + OMO type definition (37 lines)
- No new schema file needed (reuses Task 2's OlimpusConfigSchema)


## [2026-02-10T16:45] Task 4: Routing Rule Evaluator

### Routing Engine Implementation (src/agents/routing.ts)

**evaluateRoutingRules(rules: RoutingRule[], context: RoutingContext): ResolvedRoute | null**
- Iterates rules in order: first match wins (short-circuit return)
- Evaluates each rule's matcher against context
- Returns resolved route with target_agent + optional config_overrides
- Returns null if no rules match (caller responsibility to handle)

**evaluateMatcher(matcher: Matcher, context: RoutingContext): boolean**
- Dispatcher function using discriminated union switch on matcher.type
- Exhaustiveness check: throws if unknown matcher type (TypeScript never safety)
- Routes to specialized evaluators for each matcher variant

### Matcher Implementations

**evaluateKeywordMatcher**: Case-insensitive substring matching
- Mode "any": ≥1 keyword present (OR semantics)
- Mode "all": all keywords present (AND semantics)
- Keywords normalized to lowercase before comparison

**evaluateComplexityMatcher**: Heuristic scoring based on line count + technical keywords
- Base score: Math.ceil(lineCount / 10) — normalizes to 1 point per ~10 lines
- Keyword density: +1 point per technical keyword detected
- Threshold map: low=2, medium=5, high=10 points
- Technical keywords: 20 domain-specific terms (architecture, performance, database, async, etc.)
- Uses ?? operator for safe threshold lookup (defaults to 0 if missing)

**evaluateRegexMatcher**: Pattern matching with error handling
- Compiles pattern with flags (default: "i" for case-insensitive)
- Try-catch wrapper: logs invalid patterns, returns false on error
- Non-fatal: bad regex doesn't crash routing, just doesn't match

**evaluateProjectContextMatcher**: File + dependency detection
- File check: verifies file existence at projectDir/${filePath}
- Dependency check: searches projectDeps array (requires package in deps)
- All conditions AND-ed: fails fast if any condition fails
- Returns true if no conditions specified (permissive default)

**evaluateAlwaysMatcher**: Catch-all fallback
- Always returns true (no conditions to evaluate)
- Used as final fallback rule

### Type Definitions

**RoutingContext**:
- prompt: string (the user's input to route)
- projectDir: string (base directory for file checks)
- projectFiles?: string[] (optional list of project files)
- projectDeps?: string[] (optional list of package.json dependencies)

**ResolvedRoute**:
- target_agent: string (name from BUILTIN_AGENT_NAMES)
- config_overrides?: Partial<AgentConfig> (optional overrides: model, temperature, prompt, variant)

### Key Architectural Decisions

1. **Synchronous evaluation only**: No async matchers, no I/O operations except fs.existsSync()
2. **First-match-wins**: Routing order matters, not best-match semantics
3. **Fail-safe regex handling**: Invalid patterns don't crash routing engine
4. **Case-insensitive keywords**: Prompt keywords matched lowercase for UX
5. **Complexity heuristic**: Simple line count + keyword density (no NLP/ML)
6. **Permissive project context**: No file/dep requirements = automatic match

### QA Verification Results ✅

Test Coverage:
1. **Keyword matcher (any)**: "database" keyword in complex prompt → matches ✓
2. **Keyword matcher (all)**: Both "ui" AND "button" required, both present → matches ✓
3. **Always matcher**: Used as fallback when all other rules fail → matches ✓
4. **Regex matcher**: Pattern "^(design|ui|front)" matches "design a new..." → matches ✓
5. **Complexity matcher**: 7-line prompt with 7+ technical keywords → high threshold met ✓
6. **No match**: Prompt with no matching rules → returns null ✓

### Files Created
- `src/agents/routing.ts` — Routing engine with 5 matcher implementations, discriminated union dispatcher (193 lines)

### Testing Approach
- Inline test script: exercises all 5 matcher types and first-match-wins behavior
- Tests confirm: keyword matching, complexity scoring, regex handling, file detection, fallback behavior
- All tests passed without modification (first run success)


---

## [2026-02-10T18:45] Task 4: Plugin Wrapper with PluginInterface Merging

### Plugin Architecture from oh-my-opencode

**Plugin Type System:**
- `Plugin` is a function type: `(input: PluginInput) => Promise<Hooks>`
- `PluginInput` contains: client, project, directory, worktree, serverUrl, $ shell
- `Hooks` is the return interface with handlers: event, config, tool, auth, and various hook names
- Handler pattern: `(input: T) => Promise<void>` for most hooks
- Config handler: `(input: Config) => Promise<void>` — receives Config object from SDK
- Tool handler: Object mapping tool names to ToolDefinition objects

**oh-my-opencode Plugin Invocation:**
- Default export is the plugin function
- Called with PluginInput to get back Hooks interface
- Hooks interface is the "contract" between plugin and framework

### Wrapper Implementation (src/plugin/wrapper.ts)

**PluginInterface Type:**
- Alias for `Hooks` type from @opencode-ai/plugin
- Represents the contract for all plugin handlers

**createOlimpusWrapper Function:**
- Takes PluginInput + OlimpusConfig
- Execution flow:
  1. Translate OlimpusConfig → OMO-compatible config via translateToOMOConfig()
  2. Call oh-my-opencode plugin default export
  3. Extract Olimpus meta-agent definitions
  4. Create stub Olimpus extension with placeholder config handler
  5. Merge base (OMO) + extension (Olimpus) interfaces
  6. Return merged PluginInterface
- Note: Meta-agent factories will be implemented in Task 6

**mergePluginInterfaces Function:**
- Combines two PluginInterfaces (base + extension)
- Merge strategies:
  - **Tool handlers**: Spread operator (base first, extension overwrites duplicates)
  - **Config handler**: Chain both handlers (base executes first, then extension)
  - **Event handler**: Chain both handlers (base first, then extension)
  - **Hook handlers** (chat.message, chat.params, etc.): Chain all (base → extension)
  - **Auth handler**: Extension overwrites base (no chaining needed)
- Result: Single merged PluginInterface with all handlers combined

### Handler Chaining Pattern

**Config Handler Merging:**
```typescript
merged.config = async (input: Config) => {
  if (base.config) await base.config(input);
  if (extension.config) await extension.config(input);
};
```
- Both handlers receive same Config object
- Execution order: base first (setup), extension second (overrides/enhancements)
- Critical for composability: OMO handlers run first, Olimpus extensions second

**Hook Handler Chaining:**
- All hook handlers follow same pattern
- Hook list: chat.message, chat.params, chat.headers, permission.ask, command.execute.before, tool.execute.before, shell.env, tool.execute.after, experimental.*
- Each hook type chains: base → extension

### Test Coverage (wrapper.test.ts)

**Tests Created:**
1. Tool handler merging — verifies spread operator works
2. Tool handler overwrite — extension tool overwrites base
3. Config handler chaining — both execute, base first
4. Config handler alone — only base executes if extension absent
5. Empty interface handling — no errors on empty base/extension
6. Event handler chaining — base then extension
7. Auth handler overwrite — extension auth replaces base

**Test Results:** ✅ 7/7 passing

### Key Design Decisions

**Why Chaining Over Replacement:**
- Config handlers must chain to support both OMO + Olimpus config logic
- Extension handlers can modify/enhance OMO behavior
- Chaining ensures non-destructive composition

**Tool Handler Merging (Spread):**
- Tools are independent, no need to execute both
- Extension tool with same name completely replaces base
- Compatible with plugin handler patterns

**Stub Olimpus Extension:**
- Minimal extension created for now with empty config handler
- Task 6 will populate this with meta-agent factories
- Placeholder prevents breaking on empty Olimpus definitions

### Files Created
- `src/plugin/wrapper.ts` — PluginInterface type alias, createOlimpusWrapper, mergePluginInterfaces (175 lines)
- `src/plugin/wrapper.test.ts` — Merge behavior tests (140 lines)

### TypeScript Verification ✅
- tsc --noEmit: 0 errors
- Moved src/test-routing.ts to correct rootDir location
- Fixed imports in test-routing.ts (.js extensions removed for TypeScript)

---

