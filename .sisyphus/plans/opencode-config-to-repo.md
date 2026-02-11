# Add Versioned opencode.jsonc Configuration to Olimpo Plugin Root

## TL;DR

> **Quick Summary**: Create a sanitized, functional `opencode.jsonc` at the repository root based on the user's personal config, replacing all sensitive data (tokens, corporate URLs, personal info) with `{env:VAR}` placeholders and generic values. This provides a blessed config template that ships with the olimpo plugin.
> 
> **Deliverables**:
> - `./opencode.jsonc` — Versioned, functional opencode configuration with generic placeholders
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO — single sequential task
> **Critical Path**: Task 1 (create file) → Task 2 (validate & commit)

---

## Context

### Original Request
User wants their personal `opencode.jsonc` (located at `~/.config/opencode/opencode.jsonc`, 484 lines) to be committed at the root of the olimpo plugin repository, but with all sensitive and non-parametrizable data properly sanitized.

### Interview Summary
**Key Discussions**:
- **Sensitive data analysis**: Identified hardcoded tokens (Jira, GitHub, Context7), corporate URLs (inditex.com), and personal data (username, paths)
- **Format**: Real functional `.jsonc` with `{env:VAR}` placeholders — NOT a `.example` file
- **MCPs**: Include as commented examples with generic URLs/tokens
- **Provider**: Generic provider example replacing ITX-specific corporate config
- **Agent "Sir Magician"**: EXCLUDED — too personal
- **LSP**: Include with generic command names (not absolute paths)
- **Location**: Project root `./opencode.jsonc` (standard convention)
- **Git tracking**: VERSIONED (safe because only generic placeholders)
- **Plugins**: Only `"olimpus"` — no `opencode-antigravity-auth@latest`

**Research Findings**:
- `{env:VAR_NAME}` syntax is confirmed valid — user's existing config uses `{env:ANTHROPIC_AUTH_TOKEN}`
- `example/olimpus.jsonc` uses section-divider comment style (404 lines) — follow same documentation convention
- Both `//` line comments used extensively in existing JSONC files — confirmed parser support

### Metis Review
**Identified Gaps** (addressed):
- **Documentation level**: Applied "moderate" — section dividers + inline comments, matching existing `example/olimpus.jsonc` style
- **MCP example count**: Include 4 representative MCPs (Jira, GitHub, Context7, generic remote) — all commented out with generic URLs
- **Env var naming**: Case-by-case naming (no forced prefix) — matches opencode convention
- **LSP generic paths**: Use command names only (e.g., `typescript-language-server`) — assume in PATH, add platform comment
- **Provider example**: Generic "my-provider" with OpenAI-compatible structure and placeholder URL
- **Confusion with olimpus.jsonc**: Add header comment explaining relationship
- **Sensitive data leak risk**: Automated grep-based validation in acceptance criteria

---

## Work Objectives

### Core Objective
Create a versioned `opencode.jsonc` at the project root that serves as the canonical configuration template for olimpo plugin users — functional, well-documented, and free of sensitive/personal data.

### Concrete Deliverables
- `./opencode.jsonc` — complete JSONC configuration file

### Definition of Done
- [x] File exists at `./opencode.jsonc`
- [x] File parses as valid JSONC
- [x] Zero matches for sensitive patterns (inditex, adelafde, Alejandro, hardcoded tokens)
- [x] Zero absolute paths (`/Users/`, `/opt/homebrew/`, `/home/`)
- [x] Only "olimpus" in plugin array
- [x] All MCPs commented out
- [x] Committed to git

### Must Have
- All sections from source config represented (plugin, formatter, provider, tools, theme, permission, mcp, lsp)
- `{env:VAR}` placeholders for all credential fields
- Generic URLs replacing all corporate endpoints
- Section divider comments matching `example/olimpus.jsonc` style
- Header comment explaining file purpose and relationship to `olimpus.jsonc`
- Platform note about LSP path adjustments

### Must NOT Have (Guardrails)
- ❌ Any string containing "inditex", "itx", "adelafde", "Alejandro"
- ❌ Absolute paths starting with `/Users/`, `/opt/`, `/home/`
- ❌ Hardcoded tokens or API keys (even in comments)
- ❌ The "Sir Magician" agent or any personalized agent
- ❌ `opencode-antigravity-auth@latest` in plugins
- ❌ Corporate-specific Jira/GitHub/Geppetto URLs
- ❌ Any companion files (.env.example, README updates, validation scripts) — single file only

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL verification is executed by the agent using tools. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Bun test)
- **Automated tests**: NO — this is a static config file, not code
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY)

```
Scenario: File exists and parses as valid JSONC
  Tool: Bash
  Preconditions: File has been created at ./opencode.jsonc
  Steps:
    1. test -f opencode.jsonc && echo "EXISTS" || echo "MISSING"
    2. Assert: output is "EXISTS"
    3. bun -e "const { parse } = require('jsonc-parser'); const fs = require('fs'); const content = fs.readFileSync('opencode.jsonc', 'utf-8'); const errors = []; parse(content, errors); if (errors.length > 0) { console.error('PARSE ERRORS:', errors); process.exit(1); } else { console.log('VALID JSONC'); }"
    4. Assert: output is "VALID JSONC", exit code 0
  Expected Result: File exists and parses without errors
  Failure Indicators: "MISSING" or parse errors
  Evidence: Terminal output captured

Scenario: Zero sensitive data leakage
  Tool: Bash (rg — ripgrep)
  Preconditions: opencode.jsonc exists
  Steps:
    1. rg -i 'inditex|itx|adelafde|alejandro' opencode.jsonc
    2. Assert: exit code 1 (no matches)
    3. rg -i 'MDI2NjEzMjI3ODc1|gho_1NU62QE|ctx7sk-72f285db|ANTHROPIC_AUTH_TOKEN' opencode.jsonc
    4. Assert: exit code 1 (no hardcoded tokens)
    5. rg 'jira\.inditex|api\.inditex|mcpgptx' opencode.jsonc
    6. Assert: exit code 1 (no corporate URLs)
  Expected Result: Zero matches on all sensitive patterns
  Failure Indicators: Any match found (exit code 0)
  Evidence: Terminal output (empty = good)

Scenario: Zero absolute paths
  Tool: Bash (rg)
  Preconditions: opencode.jsonc exists
  Steps:
    1. rg '/Users/|/home/|/opt/homebrew|C:\\\\' opencode.jsonc
    2. Assert: exit code 1 (no matches)
  Expected Result: No absolute paths in file
  Failure Indicators: Any match found
  Evidence: Terminal output

Scenario: Plugin array contains only "olimpus"
  Tool: Bash
  Preconditions: opencode.jsonc exists
  Steps:
    1. bun -e "const { parse } = require('jsonc-parser'); const fs = require('fs'); const config = parse(fs.readFileSync('opencode.jsonc', 'utf-8')); const plugins = config.plugin; console.log(JSON.stringify(plugins));"
    2. Assert: output is ["olimpus"]
  Expected Result: Only "olimpus" in plugin array
  Failure Indicators: Extra plugins or missing "olimpus"
  Evidence: Terminal output

Scenario: All MCPs are commented out (none active)
  Tool: Bash (rg)
  Preconditions: opencode.jsonc exists
  Steps:
    1. bun -e "const { parse } = require('jsonc-parser'); const fs = require('fs'); const config = parse(fs.readFileSync('opencode.jsonc', 'utf-8')); const mcpKeys = config.mcp ? Object.keys(config.mcp) : []; console.log('Active MCPs:', mcpKeys.length); mcpKeys.forEach(k => console.log(' -', k));"
    2. Assert: "Active MCPs: 0"
  Expected Result: Zero active MCP entries (all commented)
  Failure Indicators: Any active MCP found
  Evidence: Terminal output

Scenario: Correct section structure present
  Tool: Bash
  Preconditions: opencode.jsonc exists
  Steps:
    1. bun -e "const { parse } = require('jsonc-parser'); const fs = require('fs'); const config = parse(fs.readFileSync('opencode.jsonc', 'utf-8')); const keys = Object.keys(config); const required = ['plugin', 'formatter', 'provider', 'tools', 'theme', 'permission', 'lsp']; const missing = required.filter(k => !keys.includes(k)); if (missing.length > 0) { console.error('MISSING:', missing); process.exit(1); } else { console.log('ALL SECTIONS PRESENT'); }"
    2. Assert: "ALL SECTIONS PRESENT", exit code 0
  Expected Result: All expected top-level config sections exist
  Failure Indicators: Missing sections listed
  Evidence: Terminal output

Scenario: Header comment explains file purpose
  Tool: Bash (rg)
  Preconditions: opencode.jsonc exists
  Steps:
    1. rg -c 'olimpus' opencode.jsonc
    2. Assert: count >= 1 (at least one mention of olimpus in comments)
    3. rg -c 'opencode' opencode.jsonc
    4. Assert: count >= 1
  Expected Result: File references both opencode and olimpus purposes
  Failure Indicators: Zero mentions
  Evidence: Terminal output with counts
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Create opencode.jsonc file [no dependencies]

Wave 2 (After Wave 1):
└── Task 2: Validate & commit [depends: 1]

Critical Path: Task 1 → Task 2
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick", load_skills=[], run_in_background=false) |
| 2 | 2 | task(category="quick", load_skills=["git-master"], run_in_background=false) |

---

## TODOs

- [x] 1. Create sanitized opencode.jsonc at project root

  **What to do**:
  - Create `./opencode.jsonc` based on the structure of `~/.config/opencode/opencode.jsonc` (the SOURCE file)
  - Apply the following transformations per section:

  **Section-by-section transformation rules:**

  1. **Header**: Add multi-line comment block explaining:
     - This is the opencode configuration for the olimpo plugin
     - Relationship to `olimpus.jsonc` (opencode.jsonc = orchestrator config, olimpus.jsonc = plugin routing config)
     - Instructions: "Replace placeholder values with your actual configuration"

  2. **`plugin`**: `["olimpus"]` — ONLY olimpus, nothing else

  3. **`share`**: Keep `"disabled"` as-is

  4. **`$schema`**: Keep `"https://opencode.ai/config.json"` as-is

  5. **`formatter`**: Copy as-is from source — `prettier` and `custom-markdown-formatter` configs are generic (use npx/deno, no absolute paths)

  6. **`provider`**: REPLACE entirely. Create a generic provider example:
     ```jsonc
     "provider": {
       "my-provider": {
         "name": "My LLM Provider",
         "options": {
           "baseURL": "{env:LLM_PROVIDER_URL}",
           "apiKey": "{env:LLM_API_KEY}",
           "litellmProxy": true
         },
         "npm": "@ai-sdk/openai-compatible",
         "models": {
           "claude-sonnet-4": {
             "name": "Claude Sonnet 4"
           },
           "claude-opus-4": {
             "name": "Claude Opus 4",
             "limit": { "context": 200000, "output": 128000 },
             "modalities": { "input": ["text", "image"], "output": ["text"] },
             "cost": { "input": 5, "output": 25 }
           },
           "claude-haiku-4": {
             "name": "Claude Haiku 4",
             "limit": { "context": 200000, "output": 64000 },
             "modalities": { "input": ["text", "image"], "output": ["text"] },
             "cost": { "input": 1, "output": 5 }
           }
         }
       }
     }
     ```
     - Add comment: "Replace 'my-provider' with your provider identifier"
     - Add comment: "Run 'opencode models' to see available models"

  7. **`tools`**: Copy as-is — `{ "write": true, "bash": true, "webfetch": true }`

  8. **`theme`**: Copy as-is — `"cursor"`

  9. **`agent`**: EXCLUDE entirely — no "Sir Magician". Add a commented-out example:
     ```jsonc
     // "agent": {
     //   "my-agent": {
     //     "color": "#56a8f5",
     //     "mode": "all",
     //     "description": "Custom agent description",
     //     "prompt": "Your custom agent system prompt here",
     //     "tools": { "write": true, "edit": true }
     //   }
     // },
     ```

  10. **`permission`**: Copy as-is — generic bash permissions

  11. **`disabled_providers`**: Copy as-is — `["opencode"]`

  12. **`mcp`**: ALL COMMENTED OUT with generic URLs:
      - **Jira MCP** (commented): Replace URL with `https://your-jira-instance.example.com`, token with `{env:JIRA_PERSONAL_TOKEN}`
      - **GitHub MCP** (commented): Replace token with `{env:GITHUB_MCP_TOKEN}`, keep generic URL
      - **Context7 MCP** (commented): Replace API key with `{env:CONTEXT7_API_KEY}`
      - **grep_app** (commented): Keep public URL `https://mcp.grep.app`
      - EXCLUDE: Geppetto, SonarQube, chrome-devtools, vibe_kanban (too niche/corporate)
      - Add comment: "Uncomment and configure the MCPs you need"

  13. **`lsp`**: Replace all absolute paths with command names only:
      - `markdown-oxide`: command `["markdown-oxide"]`
      - `typescript`: command `["typescript-language-server", "--stdio"]`
      - `eslint`: command `["eslint", "--stdin", "--stdin-filename", "$FILE"]`
      - Add comment: "Ensure these commands are in your PATH, or use absolute paths for your system"

  **Documentation style**: Match `example/olimpus.jsonc` section-divider style with `// ====` separators and brief section descriptions

  **Must NOT do**:
  - Include ANY string from the SENSITIVE or NON-PARAMETRIZABLE categories identified in the draft
  - Include `opencode-antigravity-auth@latest` in plugins
  - Include the Sir Magician agent definition
  - Include any absolute path starting with `/Users/`, `/opt/`, or `/home/`
  - Include any URL containing "inditex"
  - Create any companion files (.env.example, README, scripts)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation with clear, complete specification. No complex logic or multi-file changes.
  - **Skills**: `[]`
    - No domain-specific skills needed — this is a static config file
  - **Skills Evaluated but Omitted**:
    - `typescript`: Not writing TypeScript code
    - `git-master`: Commit handled in Task 2

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (alone)
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Source Material** (the file to transform):
  - `~/.config/opencode/opencode.jsonc` — Full 484-line source config. Copy structure, transform per rules above.

  **Style Reference** (documentation convention to follow):
  - `example/olimpus.jsonc` — Use same section-divider comment style (`// ============`, brief descriptions). This file has 404 lines with extensive inline documentation.

  **Project Context**:
  - `.gitignore` — Verify `opencode.jsonc` is NOT listed (should be versioned)
  - `README.md` — References `opencode.jsonc` in "Add to oh-my-opencode" section (shows expected format)

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: File exists and parses as valid JSONC
    Tool: Bash
    Preconditions: File has been created
    Steps:
      1. test -f opencode.jsonc && echo "EXISTS" || echo "MISSING"
      2. Assert: "EXISTS"
      3. Parse with jsonc-parser (bun -e): Assert no errors
    Expected Result: Valid JSONC at root
    Evidence: Terminal output

  Scenario: Zero sensitive data leakage
    Tool: Bash (rg)
    Steps:
      1. rg -i 'inditex|itx|adelafde|alejandro|MDI2NjEzMjI3ODc1|gho_1NU62QE|ctx7sk-72f285db' opencode.jsonc
      2. Assert: exit code 1 (no matches)
    Expected Result: Zero sensitive patterns found
    Evidence: Empty output

  Scenario: Zero absolute paths
    Tool: Bash (rg)
    Steps:
      1. rg '/Users/|/home/|/opt/homebrew|C:\\\\' opencode.jsonc
      2. Assert: exit code 1
    Expected Result: No absolute paths
    Evidence: Empty output

  Scenario: Plugin array is exactly ["olimpus"]
    Tool: Bash (bun -e with jsonc-parser)
    Steps:
      1. Parse config, extract plugin array
      2. Assert: equals ["olimpus"]
    Expected Result: Only olimpus plugin
    Evidence: Terminal output

  Scenario: All MCPs commented out
    Tool: Bash (bun -e with jsonc-parser)
    Steps:
      1. Parse config, count keys in mcp object
      2. Assert: 0 active MCPs
    Expected Result: Empty mcp object (all commented)
    Evidence: Terminal output

  Scenario: All expected sections present
    Tool: Bash (bun -e with jsonc-parser)
    Steps:
      1. Parse config, check for keys: plugin, formatter, provider, tools, theme, permission, lsp
      2. Assert: all present
    Expected Result: Complete section structure
    Evidence: Terminal output

  Scenario: Env var placeholders use correct syntax
    Tool: Bash (rg)
    Steps:
      1. rg '\{env:[A-Z_]+\}' opencode.jsonc
      2. Assert: at least 2 matches (LLM_PROVIDER_URL, LLM_API_KEY minimum)
    Expected Result: Proper {env:VAR} placeholder usage
    Evidence: Matched lines
  ```

  **Commit**: NO (grouped with Task 2)

---

- [x] 2. Validate and commit opencode.jsonc

  **What to do**:
  - Run ALL validation scenarios from Task 1's acceptance criteria
  - If any validation fails, fix the file before committing
  - Commit with conventional commit message

  **Must NOT do**:
  - Commit if any validation scenario fails
  - Modify any other files
  - Push to remote (user decides when to push)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Run validation commands + single git commit. Trivial.
  - **Skills**: `["git-master"]`
    - `git-master`: Needed for proper commit creation with conventional commit format
  - **Skills Evaluated but Omitted**:
    - `typescript`: Not writing code

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Task 1)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 1

  **References**:

  **Validation commands** (all from Task 1 acceptance criteria):
  - Run each scenario and capture output
  - Fix any failures before committing

  **Git conventions**:
  - Conventional commit format used in this project
  - Recent commit: `chore: remove npmrc example file`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All validations pass before commit
    Tool: Bash
    Steps:
      1. Run all 7 validation scenarios from Task 1
      2. Assert: all exit code 0 (or 1 for rg no-match assertions)
    Expected Result: Clean validation
    Evidence: Terminal output for each

  Scenario: Commit created successfully
    Tool: Bash (git)
    Steps:
      1. git add opencode.jsonc
      2. git commit -m "feat: add versioned opencode.jsonc configuration template"
      3. Assert: exit code 0
      4. git log -1 --oneline
      5. Assert: contains "feat: add versioned opencode.jsonc"
    Expected Result: Clean commit
    Evidence: git log output

  Scenario: File is tracked in git
    Tool: Bash (git)
    Steps:
      1. git status opencode.jsonc
      2. Assert: NOT shown as untracked or modified
    Expected Result: File tracked and committed
    Evidence: git status output
  ```

  **Commit**: YES
  - Message: `feat: add versioned opencode.jsonc configuration template`
  - Files: `opencode.jsonc`
  - Pre-commit: All 7 validation scenarios must pass

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat: add versioned opencode.jsonc configuration template` | `opencode.jsonc` | All 7 QA scenarios pass |

---

## Success Criteria

### Verification Commands
```bash
test -f opencode.jsonc                                          # Expected: exits 0
rg -i 'inditex|adelafde|alejandro' opencode.jsonc               # Expected: exits 1 (no matches)
rg '/Users/|/home/|/opt/' opencode.jsonc                        # Expected: exits 1 (no matches)
rg '\{env:[A-Z_]+\}' opencode.jsonc                             # Expected: exits 0 (matches found)
git log -1 --oneline                                            # Expected: "feat: add versioned opencode.jsonc..."
```

### Final Checklist
- [x] `opencode.jsonc` exists at project root
- [x] Valid JSONC syntax
- [x] Zero sensitive data (tokens, corporate URLs, personal info)
- [x] Zero absolute paths
- [x] Only "olimpus" in plugins
- [x] All MCPs commented out
- [x] `{env:VAR}` placeholders for credentials
- [x] Section-divider documentation style (matches olimpus.jsonc)
- [x] Header comment explaining purpose
- [x] Platform note for LSP paths
- [x] Committed to git
- [x] NOT pushed to remote
