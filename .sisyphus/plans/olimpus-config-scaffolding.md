# Auto-Generate olimpus.jsonc on First Run

## TL;DR

> **Quick Summary**: When the Olimpus plugin loads and no `olimpus.jsonc` exists at either search path (project root or `~/.config/opencode/`), automatically generate a minimal skeleton config at `~/.config/opencode/olimpus.jsonc` with `$schema` URL. Graceful degradation — generation failures never block plugin load.
> 
> **Deliverables**:
> - New `src/config/scaffolder.ts` — config generation logic (directory creation, atomic write, error handling)
> - New `src/config/scaffolder.test.ts` — TDD tests covering generation, overwrite protection, error handling
> - Modified `src/config/loader.ts` — integrate scaffolder into config loading flow
> - Modified `src/index.ts` — minor adjustment to support new loader behavior
> 
> **Estimated Effort**: Short (2-3 hours)
> **Parallel Execution**: NO — sequential (each task builds on previous)
> **Critical Path**: Task 1 (tests) → Task 2 (scaffolder) → Task 3 (integration) → Task 4 (verify)

---

## Context

### Original Request
User wants the olimpus plugin to automatically generate an `olimpus.jsonc` config file when none exists, so that installing the plugin is sufficient to get a working default configuration — no manual setup required.

### Interview Summary
**Key Discussions**:
- **What to scaffold**: ONLY `olimpus.jsonc` — NOT `opencode.jsonc`
- **Trigger**: Automatic on plugin load if config missing at both search paths
- **Location**: `~/.config/opencode/olimpus.jsonc` (user config directory, NOT project root)
- **Content level**: Minimal skeleton — `$schema` URL, empty structure, Zod defaults
- **Test strategy**: TDD with bun test

**Research Findings**:
- oh-my-opencode does NOT scaffold configs either — this is novel behavior for the plugin ecosystem
- OpenCode Plugin API has NO lifecycle hooks (onInstall, onFirstRun) — scaffolding must happen in plugin entry function or config loader
- Plugin entry function is async with access to `input.directory` and `process.env.HOME`
- Current flow: `loadOlimpusConfig()` throws ENOENT when no config → `index.ts` catches and uses in-memory defaults
- Zod schema defaults: `namespace_prefix: "olimpus"`, `max_delegation_depth: 3`
- All fields in `OlimpusConfigSchema` are `.optional()` — empty `{}` is valid config

### Metis Review
**Identified Gaps** (addressed):
- **Directory creation**: Must create `~/.config/opencode/` recursively if missing → Added to acceptance criteria
- **Permission errors**: Must handle EACCES gracefully → Guardrail: log warning + continue with defaults
- **Atomic writes**: Must prevent partial corruption → Use temp file + rename pattern
- **HOME env var**: Must validate exists before attempting write → Skip generation if missing
- **Schema URL versioning**: Track `main` branch (matches existing `example/olimpus.jsonc` convention)
- **Regeneration behavior**: If user deletes config, regenerate on next load (simple: "if not exists, create")
- **Test isolation**: Use temp directories to avoid polluting real filesystem

---

## Work Objectives

### Core Objective
Auto-generate a minimal `olimpus.jsonc` at `~/.config/opencode/olimpus.jsonc` when no config exists, so the plugin works out-of-the-box after installation.

### Concrete Deliverables
- `src/config/scaffolder.ts` — standalone module for config generation
- `src/config/scaffolder.test.ts` — comprehensive TDD tests
- Modified `src/config/loader.ts` — calls scaffolder when no config found
- Modified `src/index.ts` — remove or simplify ENOENT catch (loader now handles it)

### Definition of Done
- [ ] `bun test src/config/scaffolder.test.ts` → all tests PASS
- [ ] `bun test` → all existing tests still PASS (no regressions)
- [ ] `bun run typecheck` → zero errors
- [ ] When no config exists: plugin loads successfully AND `~/.config/opencode/olimpus.jsonc` is created
- [ ] When config already exists: file is NOT overwritten
- [ ] When filesystem errors occur: plugin loads successfully with in-memory defaults (warning logged)

### Must Have
- `$schema` URL in generated config: `https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json`
- Recursive directory creation (`~/.config/opencode/` may not exist)
- Overwrite protection (NEVER touch existing configs)
- Graceful error handling (permission denied, read-only fs, missing HOME)
- Console log when config is generated (user should know)
- Generated config passes Zod validation when loaded back

### Must NOT Have (Guardrails)
- ❌ Generate `opencode.jsonc` or any file other than `olimpus.jsonc`
- ❌ Generate config at project root (`./olimpus.jsonc`) — ONLY at `~/.config/opencode/`
- ❌ Overwrite existing config files at ANY location
- ❌ Block plugin load if generation fails (MUST degrade gracefully)
- ❌ Make network calls to validate schema URL at runtime
- ❌ Include example agents, routing rules, or non-empty meta_agents in generated config
- ❌ Add comments/documentation to generated config (minimal = minimal)
- ❌ Add CLI commands, postinstall scripts, or UI prompts
- ❌ Use Node.js `fs` APIs — use Bun APIs (`Bun.write()`, `Bun.file()`)
- ❌ Use `any` types (project convention: strict TypeScript)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (bun test already configured)
- **Automated tests**: TDD (tests first, then implementation)
- **Framework**: bun test (native, zero-config)

### TDD Flow Per Task
1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping green

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Config generation | Bash (bun test) | Run test suite, assert all pass |
| File existence | Bash (bun REPL) | Check generated file exists and is parseable |
| Integration | Bash (bun test) | Full test suite including existing tests |
| Type safety | Bash (bun run typecheck) | Zero TypeScript errors |

---

## Execution Strategy

### Sequential Execution (No Parallelism)

```
Task 1: Write TDD tests (scaffolder.test.ts)
    ↓
Task 2: Implement scaffolder (scaffolder.ts) — make tests pass
    ↓
Task 3: Integrate scaffolder into loader + index.ts
    ↓
Task 4: Final verification (all tests + typecheck)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | 3 | None |
| 3 | 2 | 4 | None |
| 4 | 3 | None | None (final) |

### Agent Dispatch Summary

| Task | Recommended Agent |
|------|-------------------|
| 1-4 | Single agent, sequential: `task(category="unspecified-high", load_skills=["typescript"], run_in_background=false)` |

---

## TODOs

- [ ] 1. Write TDD Tests for Config Scaffolder

  **What to do**:
  - Create `src/config/scaffolder.test.ts` with comprehensive test cases
  - All tests should FAIL initially (RED phase — implementation doesn't exist yet)
  - Use temp directories (`os.tmpdir()`) for filesystem isolation — NEVER write to real `~/.config/`
  - Override `process.env.HOME` in each test to point to temp dir
  - Clean up temp directories after each test

  **Test cases to write**:
  1. `generates config when no config exists` — assert file created at `{HOME}/.config/opencode/olimpus.jsonc`
  2. `creates parent directories recursively` — assert `{HOME}/.config/opencode/` is created when missing
  3. `generated config has $schema URL` — parse file, assert `$schema === "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json"`
  4. `generated config passes Zod validation` — import `OlimpusConfigSchema`, parse generated content, assert `.success === true`
  5. `does NOT overwrite existing config` — pre-create file with custom content, run scaffolder, assert original content unchanged
  6. `skips generation when project config exists` — scaffolder should accept a flag/check indicating project config was found
  7. `handles permission errors gracefully` — mock/simulate read-only directory, assert no throw, assert returns null/undefined
  8. `handles missing HOME env var` — set `HOME = undefined`, assert no throw, assert returns null/undefined
  9. `logs message on successful generation` — spy on `console.log`, assert log message contains path
  10. `generated config is valid JSONC` — parse with `jsonc-parser`, assert no errors

  **Must NOT do**:
  - Write to real `~/.config/opencode/` directory
  - Import implementation that doesn't exist yet (use dynamic import or expect import error in RED phase)
  - Write tests that require human verification

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: TDD test writing requires careful design of test isolation, mocking, and comprehensive edge case coverage
  - **Skills**: [`typescript`]
    - `typescript`: Strict typing patterns needed for test type safety

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2 (implementation depends on tests existing)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/skills/loader.test.ts` — Existing test patterns in this project (bun test framework, import style, assertion patterns)
  - `src/plugin/wrapper.test.ts` — Another test file showing project test conventions

  **API/Type References** (contracts to implement against):
  - `src/config/schema.ts:180-191` — `OlimpusConfigSchema` definition — the generated config MUST pass this validation
  - `src/config/schema.ts:143-145` — `SettingsSchema` with `.default("olimpus")` and `.default(3)` — these are the expected defaults

  **Test References** (testing patterns to follow):
  - `src/skills/loader.test.ts` — How existing tests handle file system operations and Bun test patterns
  - `src/plugin/wrapper.test.ts` — How existing tests structure describe/test blocks

  **Documentation References**:
  - `example/olimpus.jsonc:2` — The exact `$schema` URL that should appear in generated config

  **External References**:
  - Bun test docs: `https://bun.sh/docs/cli/test` — Bun test runner API, lifecycle hooks (beforeEach, afterEach)
  - Bun file API: `https://bun.sh/docs/api/file-io` — `Bun.file()`, `Bun.write()` APIs used in scaffolder

  **Acceptance Criteria**:

  - [ ] File `src/config/scaffolder.test.ts` exists
  - [ ] Contains at least 8 test cases covering: generation, directory creation, $schema, Zod validation, overwrite protection, permission errors, missing HOME, logging
  - [ ] `bun test src/config/scaffolder.test.ts` → all tests FAIL (RED phase — no implementation yet)
  - [ ] Tests use temp directories (no writes to real filesystem)
  - [ ] `bun run typecheck` → zero errors in test file

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Test file exists and is valid TypeScript
    Tool: Bash
    Preconditions: Task 1 completed
    Steps:
      1. bun run typecheck
      2. Assert: exit code 0
      3. Assert: no errors mentioning scaffolder.test.ts
    Expected Result: TypeScript compiles cleanly
    Evidence: Terminal output captured

  Scenario: All tests fail in RED phase
    Tool: Bash
    Preconditions: scaffolder.test.ts written, scaffolder.ts does NOT exist yet
    Steps:
      1. bun test src/config/scaffolder.test.ts
      2. Assert: exit code non-zero (tests fail)
      3. Assert: output shows test count ≥ 8
    Expected Result: All tests fail because implementation doesn't exist
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `test(config): add TDD tests for olimpus.jsonc auto-scaffolding`
  - Files: `src/config/scaffolder.test.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 2. Implement Config Scaffolder Module

  **What to do**:
  - Create `src/config/scaffolder.ts` with the scaffolding logic
  - Implement `scaffoldOlimpusConfig(options: ScaffoldOptions): ScaffoldResult | null` function
  - Follow TDD GREEN phase: make ALL tests from Task 1 pass
  - Then REFACTOR: clean up while keeping tests green

  **Implementation details**:

  1. **ScaffoldOptions interface**:
     ```typescript
     interface ScaffoldOptions {
       /** Whether a project-level config already exists */
       projectConfigExists: boolean;
       /** Whether a user-level config already exists */
       userConfigExists: boolean;
     }
     ```

  2. **ScaffoldResult interface**:
     ```typescript
     interface ScaffoldResult {
       /** Path where config was generated */
       path: string;
       /** Whether the file was newly created */
       created: boolean;
     }
     ```

  3. **Core logic flow**:
     - If `projectConfigExists` OR `userConfigExists` → return `null` (skip)
     - Resolve target path: `path.join(HOME, ".config", "opencode", "olimpus.jsonc")`
     - Validate `HOME` env var exists → if not, log warning, return `null`
     - Create parent directory recursively (`fs.mkdirSync` with `{ recursive: true }`)
     - Generate minimal JSONC content (template string)
     - Write atomically: write to `{target}.tmp` first, then rename to `{target}`
     - Log success: `[Olimpus] Generated default config at {path}`
     - Catch errors (EACCES, EROFS, ENOSPC): log warning, return `null`

  4. **Minimal config template** (what gets written):
     ```jsonc
     {
       "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",
       "meta_agents": {},
       "settings": {
         "namespace_prefix": "olimpus",
         "max_delegation_depth": 3
       }
     }
     ```

  **Must NOT do**:
  - Use Node.js `fs.writeFileSync` for writing config — use `Bun.write()` for the file content
  - Note: `fs.mkdirSync` is acceptable for directory creation (Bun supports it), or use `mkdir` via shell
  - Add comments, examples, or non-essential fields to the generated config
  - Throw errors that propagate up — all errors caught and logged
  - Use `any` type anywhere

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Implementation must satisfy pre-written TDD tests exactly, requiring careful attention to interfaces and error handling
  - **Skills**: [`typescript`]
    - `typescript`: Strict typing for ScaffoldOptions, ScaffoldResult interfaces and error handling patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3 (integration depends on scaffolder existing)
  - **Blocked By**: Task 1 (tests must exist first)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/config/loader.ts:11-51` — Existing config loading pattern (fs operations, error handling, path resolution). Follow the same style for HOME resolution and path construction.
  - `src/config/loader.ts:56-71` — `parseJsonc()` function — follow this pattern for JSONC handling
  - `src/index.ts:33-56` — Error handling pattern with try/catch, console.warn, and graceful fallback

  **API/Type References** (contracts to implement against):
  - `src/config/schema.ts:180-191` — `OlimpusConfigSchema` — generated config MUST pass this schema
  - `src/config/schema.ts:143-145` — `SettingsSchema` defaults: `namespace_prefix: "olimpus"`, `max_delegation_depth: 3`

  **Test References**:
  - `src/config/scaffolder.test.ts` — The tests from Task 1 that this implementation must satisfy

  **Documentation References**:
  - `example/olimpus.jsonc:2` — `$schema` URL: `https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json`

  **External References**:
  - Bun file I/O: `https://bun.sh/docs/api/file-io` — `Bun.write()` API for atomic file writes
  - Node.js fs (compatible with Bun): `https://nodejs.org/api/fs.html#fsmkdirsyncpath-options` — `mkdirSync` with `{ recursive: true }`

  **Acceptance Criteria**:

  - [ ] File `src/config/scaffolder.ts` exists
  - [ ] Exports `scaffoldOlimpusConfig` function with proper TypeScript types
  - [ ] Exports `ScaffoldOptions` and `ScaffoldResult` types
  - [ ] `bun test src/config/scaffolder.test.ts` → ALL tests PASS (GREEN phase)
  - [ ] `bun run typecheck` → zero errors
  - [ ] No `any` types in implementation

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All TDD tests pass (GREEN phase)
    Tool: Bash
    Preconditions: scaffolder.test.ts from Task 1 exists, scaffolder.ts implemented
    Steps:
      1. bun test src/config/scaffolder.test.ts
      2. Assert: exit code 0
      3. Assert: output shows all tests passing (0 failures)
    Expected Result: Every test case from Task 1 passes
    Evidence: Terminal output captured

  Scenario: TypeScript strict compliance
    Tool: Bash
    Preconditions: scaffolder.ts implemented
    Steps:
      1. bun run typecheck
      2. Assert: exit code 0
      3. Assert: no errors mentioning scaffolder.ts
    Expected Result: Zero type errors
    Evidence: Terminal output captured

  Scenario: No any types used
    Tool: Bash (ast-grep or grep)
    Preconditions: scaffolder.ts implemented
    Steps:
      1. Search scaffolder.ts for `: any` or `as any` patterns
      2. Assert: zero matches
    Expected Result: No any types found
    Evidence: Search output captured
  ```

  **Commit**: YES
  - Message: `feat(config): implement olimpus.jsonc auto-scaffolding on first run`
  - Files: `src/config/scaffolder.ts`
  - Pre-commit: `bun test src/config/scaffolder.test.ts && bun run typecheck`

---

- [ ] 3. Integrate Scaffolder into Config Loader and Plugin Entry

  **What to do**:
  - Modify `src/config/loader.ts` to call `scaffoldOlimpusConfig()` when neither config exists
  - Simplify `src/index.ts` ENOENT handling (loader now handles missing config gracefully)
  - Ensure the flow is: check exists → if neither, scaffold → load (which now finds the scaffolded file)

  **Implementation details**:

  1. **Modify `loadOlimpusConfig()` in `src/config/loader.ts`**:
     - After checking both paths (user + project) and finding neither exists:
     - Call `scaffoldOlimpusConfig({ projectConfigExists: false, userConfigExists: false })`
     - If scaffold succeeds, re-read the newly created file and continue normal flow
     - If scaffold fails (returns null), fall through to empty config (current behavior)

  2. **Simplify `src/index.ts`**:
     - The ENOENT catch block (lines 33-56) can be simplified since loader now handles missing config
     - Loader should return a valid config in ALL cases (either from file, scaffolded file, or empty defaults)
     - Keep the catch for other unexpected errors

  3. **Updated flow**:
     ```
     loadOlimpusConfig(projectDir)
       ↓
     Check: ~/.config/opencode/olimpus.jsonc exists? → userConfigExists
     Check: ./olimpus.jsonc exists? → projectConfigExists
       ↓
     If neither exists:
       scaffoldOlimpusConfig({ projectConfigExists: false, userConfigExists: false })
         ↓
       If scaffolded: re-read userConfigPath → parse → validate → return
       If failed: return default empty config (no throw)
       ↓
     If one/both exist:
       normal merge + validate flow (unchanged)
     ```

  **Must NOT do**:
  - Break existing config loading behavior (project config still overrides user config)
  - Change the config merge precedence logic
  - Remove the deep merge functionality
  - Make loadOlimpusConfig throw ENOENT (it should now return defaults instead)
  - Add any features beyond scaffolding integration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Modifying existing working code requires careful integration to avoid regressions
  - **Skills**: [`typescript`]
    - `typescript`: Strict typing required for modified function signatures

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4 (verification depends on integration)
  - **Blocked By**: Task 2 (scaffolder must be implemented first)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/config/loader.ts:11-51` — CURRENT `loadOlimpusConfig()` implementation — this is what gets modified. Understand every line before changing.
  - `src/config/loader.ts:23-29` — User config path check — scaffolder integrates AFTER this check fails
  - `src/config/loader.ts:31-40` — Project config path check — scaffolder integrates AFTER this also fails
  - `src/index.ts:28-56` — Plugin entry with ENOENT catch — this gets simplified

  **API/Type References**:
  - `src/config/scaffolder.ts` — `scaffoldOlimpusConfig()` function signature (from Task 2)
  - `src/config/schema.ts:180-191` — `OlimpusConfigSchema` and `OlimpusConfig` type — return type of `loadOlimpusConfig()`

  **Test References**:
  - `src/config/scaffolder.test.ts` — Scaffolder tests should still pass after integration
  - Any existing loader tests (check for `src/config/loader.test.ts`)

  **Acceptance Criteria**:

  - [ ] `src/config/loader.ts` calls `scaffoldOlimpusConfig()` when no config found at either path
  - [ ] `src/index.ts` ENOENT catch simplified or removed (loader handles it)
  - [ ] `loadOlimpusConfig()` NEVER throws ENOENT — returns valid config in all cases
  - [ ] `bun test` → ALL tests pass (existing + new, zero regressions)
  - [ ] `bun run typecheck` → zero errors
  - [ ] Existing config loading behavior unchanged (project overrides user, deep merge works)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full test suite passes with zero regressions
    Tool: Bash
    Preconditions: Integration changes applied to loader.ts and index.ts
    Steps:
      1. bun test
      2. Assert: exit code 0
      3. Assert: output shows ALL tests passing (scaffolder tests + existing tests)
      4. Assert: zero failures
    Expected Result: No regressions, all tests green
    Evidence: Terminal output captured

  Scenario: TypeScript compiles with zero errors
    Tool: Bash
    Preconditions: All changes applied
    Steps:
      1. bun run typecheck
      2. Assert: exit code 0
    Expected Result: Clean compilation
    Evidence: Terminal output captured

  Scenario: Plugin loads successfully when no config exists
    Tool: Bash (bun REPL or test script)
    Preconditions: No olimpus.jsonc at project root or user config
    Steps:
      1. Create temp directory
      2. Set HOME to temp directory
      3. Import and call OlimpusPlugin with mock PluginInput (directory = temp project dir)
      4. Assert: function resolves (no throw)
      5. Assert: file exists at {HOME}/.config/opencode/olimpus.jsonc
      6. Parse file content
      7. Assert: $schema URL present
      8. Assert: content passes OlimpusConfigSchema validation
    Expected Result: Config auto-generated, plugin loads successfully
    Evidence: Terminal output + file content captured

  Scenario: Plugin loads normally when config already exists
    Tool: Bash (bun REPL or test script)
    Preconditions: olimpus.jsonc exists at project root with custom meta_agents
    Steps:
      1. Create temp directory with olimpus.jsonc containing custom config
      2. Import and call OlimpusPlugin with directory = temp dir
      3. Assert: function resolves (no throw)
      4. Assert: custom meta_agents from config are registered
      5. Assert: no new file created at user config path
    Expected Result: Existing config loaded normally, no scaffolding triggered
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `feat(config): integrate auto-scaffolding into config loader and plugin entry`
  - Files: `src/config/loader.ts`, `src/index.ts`
  - Pre-commit: `bun test && bun run typecheck`

---

- [ ] 4. Final Verification and Cleanup

  **What to do**:
  - Run full test suite one final time
  - Run typecheck
  - Verify the complete flow end-to-end
  - Ensure no stale imports, unused code, or dead paths remain

  **Verification steps**:
  1. `bun test` — all tests pass
  2. `bun run typecheck` — zero errors
  3. Review `src/config/loader.ts` — clean, no dead code
  4. Review `src/index.ts` — simplified ENOENT handling
  5. Review `src/config/scaffolder.ts` — clean, well-typed
  6. Verify no `any` types across all modified/created files

  **Must NOT do**:
  - Run `bun run build` (project convention: never build after changes)
  - Add documentation files
  - Modify files unrelated to the scaffolding feature

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Final verification is a lightweight task — just running checks and cleanup
  - **Skills**: [`typescript`]
    - `typescript`: Type checking verification

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final step)
  - **Blocks**: None (this is the final task)
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - All files from Tasks 1-3

  **Acceptance Criteria**:

  - [ ] `bun test` → ALL tests pass, zero failures
  - [ ] `bun run typecheck` → zero errors
  - [ ] No `any` types in any modified/created file
  - [ ] No unused imports or dead code
  - [ ] No stale ENOENT handling in index.ts (if simplified)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Complete test suite green
    Tool: Bash
    Preconditions: All tasks 1-3 completed
    Steps:
      1. bun test
      2. Assert: exit code 0
      3. Assert: zero failures reported
    Expected Result: All tests pass
    Evidence: Terminal output captured

  Scenario: TypeScript strict mode clean
    Tool: Bash
    Preconditions: All changes applied
    Steps:
      1. bun run typecheck
      2. Assert: exit code 0
    Expected Result: Zero type errors
    Evidence: Terminal output captured

  Scenario: No any types in codebase changes
    Tool: ast_grep_search or grep
    Preconditions: All files written
    Steps:
      1. Search src/config/scaffolder.ts for `: any` or `as any`
      2. Search src/config/scaffolder.test.ts for `: any` or `as any`
      3. Search src/config/loader.ts for new `: any` or `as any` (compare with git diff)
      4. Assert: zero matches in all files
    Expected Result: No any types anywhere
    Evidence: Search output captured
  ```

  **Commit**: NO (all commits happened in Tasks 1-3)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `test(config): add TDD tests for olimpus.jsonc auto-scaffolding` | `src/config/scaffolder.test.ts` | `bun run typecheck` |
| 2 | `feat(config): implement olimpus.jsonc auto-scaffolding on first run` | `src/config/scaffolder.ts` | `bun test src/config/scaffolder.test.ts && bun run typecheck` |
| 3 | `feat(config): integrate auto-scaffolding into config loader and plugin entry` | `src/config/loader.ts`, `src/index.ts` | `bun test && bun run typecheck` |

---

## Success Criteria

### Verification Commands
```bash
bun test                    # Expected: ALL tests pass (existing + new)
bun run typecheck           # Expected: zero errors
```

### Final Checklist
- [ ] `olimpus.jsonc` auto-generated at `~/.config/opencode/` when no config exists
- [ ] Generated config has `$schema` URL
- [ ] Generated config passes Zod validation
- [ ] Existing configs are NEVER overwritten
- [ ] Permission errors don't block plugin load
- [ ] Missing HOME env var doesn't block plugin load
- [ ] All tests pass (zero regressions)
- [ ] TypeScript strict mode clean (zero errors)
- [ ] No `any` types in new code
- [ ] No opencode.jsonc generated (out of scope)
- [ ] No project-level config generated (only user-level)
