# src/config - CONFIGURATION SYSTEM

**Score**: 18 (validation layer)  
**Purpose**: Load, validate, and merge olimpus.jsonc config via Zod v4 schemas

---

## OVERVIEW

The config subsystem handles all Olimpus configuration: loading from project root (`./olimpus.jsonc`) or user home (`~/.config/opencode/olimpus.jsonc`), validating via Zod v4 (27 schemas covering matchers, meta-agents, overrides, settings), and translating between Olimpus and oh-my-opencode formats. Single source of truth: project config wins over user config.

---

## STRUCTURE

```
src/config/
├── schema.ts              # 27 Zod v4 schemas (matchers, rules, config)
├── loader.ts              # loadOlimpusConfig() + JSONC parsing + deep merge
└── translator.ts          # OMO compatibility layer + meta-agent extraction
```

---

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new config field | `schema.ts` | Update Zod schema + TypeScript type |
| Fix config parsing | `loader.ts:30` loadOlimpusConfig() | Checks project root, then `~/.config/opencode/` |
| Validate config structure | `schema.ts:1` OlimpusConfigSchema | All config validated at startup via Zod |
| Understand config merging | `loader.ts:60` deepMerge() | Recursively merges project + user config |
| Extract meta-agent defs | `translator.ts:20` extractMetaAgentDefs() | Isolate meta-agent definitions from full config |

---

## KEY SYMBOLS

| Symbol | Type | Lines | Role |
|--------|------|-------|------|
| `OlimpusConfigSchema` | Zod Type | 180+ | Root schema—all config validated against this |
| `loadOlimpusConfig` | Function | 30 | Entry: load + validate + return OlimpusConfig |
| `deepMerge` | Function | 60 | Merge user + project config recursively |
| `MatcherSchema` | Zod Union | ~45 | 5 discriminated matcher schemas |
| `MetaAgentSchema` | Zod Object | ~100 | Meta-agent definition with routing rules |
| `RoutingRuleSchema` | Zod Object | ~40 | Single routing rule with matcher + target + overrides |
| `KeywordMatcherSchema` | Zod Object | ~20 | Keyword matcher: keywords + mode (any/all) |
| `ComplexityMatcherSchema` | Zod Object | ~10 | Complexity matcher: threshold (low/medium/high) |
| `RegexMatcherSchema` | Zod Object | ~15 | Regex matcher: pattern + flags |
| `ProjectContextMatcherSchema` | Zod Object | ~20 | Project matcher: has_files + has_deps |
| `AlwaysMatcherSchema` | Zod Object | ~5 | Always matcher: catches everything |

---

## CONVENTIONS

### Zod v4 Strict
- **MUST use v4 syntax** (not v3, breaking changes)
- **Discriminated unions** for matchers: `z.discriminatedUnion("type", [...])`
- **Exhaustive type checking**: TypeScript narrows based on discriminant

### Config File Format
- **JSONC only** (JSON with comments)
- **Search order**: `./olimpus.jsonc` (project, highest priority) → `~/.config/opencode/olimpus.jsonc` (user)
- **Never create oh-my-opencode.json** (single source of truth)

### Validation Timing
- **At startup only** (config validated when plugin loads)
- **Throw ZodError immediately** if invalid
- **No lazy validation** (all errors surfaced upfront)

---

## ANTI-PATTERNS

- ❌ Use Zod v3 syntax (only v4)
- ❌ Multiple config files for same setting (pick one)
- ❌ Defer config validation (must validate at startup)
- ❌ Pass config via temporary files (in-memory only)
- ❌ Mix JSONC parsing with eval() (jsonc-parser only)

---

## UNIQUE STYLES

### Deep Merge Strategy
```typescript
// Project config merges INTO user config
// Nested objects recursively merged (not replaced)
// Arrays in project config REPLACE user config (no concat)
```

### Matcher Discrimination
```typescript
// All 5 matchers identified by "type" field
matcher: {
  type: "keyword",        // ← Discriminant: TypeScript narrows to KeywordMatcher
  keywords: ["docs"],
  mode: "any"
}
```

### Config Overrides Per Route
```typescript
routing_rules: [
  {
    matcher: { type: "keyword", ... },
    target_agent: "librarian",
    config_overrides: {          // ← Customize agent config for THIS route only
      model: "gpt-4",
      temperature: 0.3,
      prompt: "Custom..."
    }
  }
]
```

---

## RELATED DOCS

- **Load config**: `src/config/loader.ts` (entry point)
- **Validate schemas**: `src/config/schema.ts` (27 Zod types)
- **Translate to OMO**: `src/config/translator.ts` (compatibility layer)
- **Example config**: `example/olimpus.jsonc` (reference)
- **JSON Schema**: `assets/olimpus.schema.json` (for IDE validation)
