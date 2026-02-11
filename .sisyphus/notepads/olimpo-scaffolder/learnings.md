# Olimpo Scaffolder TDD - Learnings

## Test Structure Patterns

### Bun Test Framework
- Use `import { test, expect, describe, beforeEach, afterEach } from "bun:test"`
- No need for async test functions unless file I/O is involved
- `beforeEach`/`afterEach` hooks for setup/teardown

### Isolation Pattern for Filesystem Tests
```typescript
let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "olimpus-test-"));
  process.env.HOME = tempDir;
});

afterEach(() => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
```
- Always create temporary directories per test run
- Override `process.env.HOME` to redirect config location
- Clean up in afterEach to prevent temp dir pollution

### Environment & State Management
- Save/restore `process.env.HOME` around tests
- Mock `console.log` to capture scaffolder output for logging tests
- Use `chmodSync` to simulate permission errors (restore permissions before cleanup!)

## Config Validation Patterns

### Zod Validation in Tests
```typescript
const validation = OlimpusConfigSchema.safeParse(parsed);
expect(validation.success).toBe(true);
// Don't access validation.error.errors, use validation.error directly
```

### Config Generation Template
Expected generated config structure:
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

### JSONC Parsing
- Use `parseJsonc()` from `jsonc-parser` package
- Handles comments and trailing commas correctly
- Returns parsed object, not string

## File I/O Patterns

### Reading Files with Bun
```typescript
const content = await Bun.file(configPath).text();
const exists = await Bun.file(configPath).exists();
```

### Checking Directory Existence
- Use `existsSync()` for both files and directories
- `mkdirSync(path, { recursive: true })` creates parent dirs automatically
- `rmSync(path, { recursive: true, force: true })` cleans up completely

## Test Coverage Strategy

### 15 Test Cases Created
1. **Basic generation** - Config created when none exists
2. **Directory creation** - Parent dirs created recursively
3. **$schema validation** - Correct schema URL in output
4. **Zod validation** - Generated config passes schema validation
5. **Overwrite protection** - Existing config NOT overwritten
6. **Project config skip** - Skip if project config exists
7. **Permission errors** - Handle gracefully without throwing
8. **Missing HOME** - Handle missing HOME env var gracefully
9. **Logging** - Log message on successful generation
10. **JSONC validity** - Generated output is valid JSONC
11. **Settings defaults** - namespace_prefix and max_delegation_depth set
12. **Meta agents** - Empty meta_agents object initialized
13. **Result path** - Path in result is absolute and .jsonc file
14. **Idempotency** - Can call multiple times, second call returns created=false
15. **Template structure** - Top-level keys match expected template

### BDD Arrange-Act-Assert Comments
- Comments follow AAA pattern for test clarity
- Include comments like "// Arrange:", "// Act:", "// Assert:" to structure test flow
- These are necessary for understanding complex test logic

## RED Phase Success Criteria
- ✅ All 15 tests FAIL (exit code non-zero)
- ✅ Tests use temp directories (no real ~/.config/ pollution)
- ✅ TypeScript compilation doesn't error on test file itself
- ✅ Tests are comprehensive covering happy path, edge cases, error handling
- ✅ Implementation function signature defined (declared but not implemented)

## Implementation Notes for Later

### Function Interface
```typescript
interface ScaffoldOptions {
  projectConfigExists: boolean;
  userConfigExists?: boolean;
}

interface ScaffoldResult {
  path: string;
  created: boolean;
}

function scaffoldOlimpusConfig(options: ScaffoldOptions): ScaffoldResult | null
```

### Expected Behavior
- Return `null` if HOME is missing or unwritable
- Return `{ path, created: false }` if:
  - Project config exists (should skip user scaffolding)
  - Config already exists at target path
- Return `{ path, created: true }` if:
  - Created new config file successfully
  - All parent directories created
- Config path should be: `~/.config/opencode/olimpus.jsonc`

### Error Handling Strategy
- No thrown exceptions (graceful handling)
- Return `null` or `created: false` for error conditions
- Console.log on successful creation
- Validate generated config against OlimpusConfigSchema
