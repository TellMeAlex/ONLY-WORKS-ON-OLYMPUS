# src/skills - SKILL SYSTEM

**Score**: 10 (borderline distinct)  
**Purpose**: Load, validate, and merge custom skills with namespace prefixing

---

## OVERVIEW

Skills subsystem loads custom skill definitions from markdown files with YAML frontmatter, validates them via TypeScript interfaces, applies `olimpus:` namespace prefix to avoid conflicts with oh-my-opencode skills, and merges into plugin's final skill registry. Single skill = one markdown file with template + metadata.

---

## STRUCTURE

```
src/skills/
├── types.ts              # SkillDefinition, SkillMetadata, CommandDefinition interfaces
├── loader.ts             # loadOlimpusSkills() + mergeSkills()
└── loader.test.ts        # 17 unit tests (markdown parsing, namespace prefixing, merging)
```

---

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Understand skill format | `loader.ts:1` | YAML frontmatter + markdown template |
| Parse YAML metadata | `loader.ts:50` parseYaml() | Extract metadata from frontmatter |
| Apply namespace prefix | `loader.ts:80` prefixSkillNames() | Auto-prefix with "olimpus:" |
| Merge skill registries | `loader.ts:100` mergeSkills() | Combine custom + oh-my-opencode skills |
| Test skill parsing | `loader.test.ts` | Run `bun test src/skills/loader.test.ts` |

---

## KEY SYMBOLS

| Symbol | Type | File | Role |
|--------|------|------|------|
| `loadOlimpusSkills` | Function | loader.ts | Entry: load skills from config paths |
| `mergeSkills` | Function | loader.ts | Merge 2 skill registries (custom + OMO) |
| `SkillDefinition` | Interface | types.ts | Structure: name + definition + scope |
| `SkillMetadata` | Interface | types.ts | YAML frontmatter content |
| `CommandDefinition` | Interface | types.ts | Single command in skill |
| `HandoffDefinition` | Interface | types.ts | Handoff instruction in skill |
| `SkillScope` | Type Union | types.ts | "config" | "project" | "workspace" |

---

## SKILL FILE FORMAT

### Structure
```markdown
---
name: my-skill
description: "What this skill does"
commands:
  - name: build
    description: "Build the project"
    example: "build --prod"
handoffs:
  - name: document-api
    description: "Document REST API"
---

# Implementation

You are an expert in {{expertise_area}}.

When the user asks for {{task}}, you:
1. Step one
2. Step two
3. Step three
```

### YAML Frontmatter
```yaml
name: skill-name
description: "Human readable description"
commands:
  - name: cmd-name
    description: "What this command does"
    example: "example usage"
handoffs:
  - name: handoff-name
    description: "What this handoff does"
```

### Markdown Body
- Template content (can include `{{variable}}` placeholders)
- Parsed as skill instructions

---

## CONVENTIONS

### Namespace Prefixing
```typescript
// Input:  { name: "my-skill", ... }
// Output: { name: "olimpus:my-skill", ... }
// Purpose: Avoid conflicts with oh-my-opencode skills
```

### Merge Strategy
```typescript
// mergeSkills(custom, omoSkills)
// Result: olimpus: { ... } namespace contains all custom skills
// OMO skills remain at root level
```

### Test Patterns
```typescript
// Tests use:
// - Temporary directories (test-skills/)
// - Inline markdown creation
// - Cleanup after each test
// - No mocking (real file I/O tested)
```

---

## ANTI-PATTERNS

- ❌ Don't modify OMO skills (merge only, don't mutate)
- ❌ Don't skip namespace prefix (conflicts with built-in skills)
- ❌ Don't validate at load time (let schema validation catch errors)
- ❌ Don't reuse skill objects (clone before merge)

---

## UNIQUE STYLES

### YAML Frontmatter Parsing
```typescript
// Extract YAML between --- markers
// Use jsonc-parser or similar for robust parsing
// Handle edge cases: empty frontmatter, missing markers
```

### Lazy Merging
```typescript
// Don't merge at load time
// Return arrays separately
// Let caller decide merge strategy
// Reason: Plugin can override merging logic
```

---

## RELATED DOCS

- **Config loading**: `src/config/loader.ts` (config.skills array)
- **Plugin integration**: `src/plugin/wrapper.ts` (calls loadOlimpusSkills)
- **Type definitions**: `src/skills/types.ts` (skill interfaces)
