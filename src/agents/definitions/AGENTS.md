# src/agents/definitions - BUILT-IN META-AGENTS

**Score**: 12 (distinct domain)  
**Purpose**: 3 opinionated meta-agents for common routing scenarios

---

## OVERVIEW

Built-in meta-agent library: **Atenea** (strategic planning via complexity), **Hermes** (communication/research via keywords), **Hefesto** (implementation via project context). Each defines routing rules + delegation targets. Exported via `index.ts` re-export hub. Users can override/extend in olimpus.jsonc.

---

## STRUCTURE

```
src/agents/definitions/
├── atenea.ts           # Strategic planning meta-agent (complexity-based)
├── hermes.ts           # Communication/research meta-agent (keyword-based)
├── hefesto.ts          # Implementation meta-agent (project-context-based)
└── index.ts            # Re-export all 3: ateneo, hermes, hefesto
```

---

## THE 3 META-AGENTS

### 1. **Atenea** (Strategic Planning)
**Routing logic**: Complexity threshold

```typescript
// High complexity → oracle (deep analysis)
// Medium complexity → prometheus (planning)
// Low complexity → atlas (quick reference)
```

**Handles**: Architecture, design, complex analysis, strategic decisions

**Delegation targets**: `oracle`, `prometheus`, `atlas`

### 2. **Hermes** (Communication & Research)
**Routing logic**: Keywords

```typescript
// Keywords: ["docs", "documentation", "guide"] → librarian
// Keywords: ["code", "source", "implementation"] → explore
// Keywords: ["analyze", "compare", "evaluate"] → oracle
// Otherwise → oracle (fallback)
```

**Handles**: Documentation research, codebase exploration, comparative analysis

**Delegation targets**: `librarian`, `explore`, `oracle`

### 3. **Hefesto** (Implementation)
**Routing logic**: Project context (has_files, has_deps)

```typescript
// has_files: ["package.json"] AND has_deps: ["vitest", "jest"]
// → sisyphus (test-driven implementation)
// Otherwise → hephaestus (general implementation)
```

**Handles**: Feature implementation, bug fixes, code refactoring, testing

**Delegation targets**: `sisyphus`, `hephaestus`

---

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Modify Atenea routing | `atenea.ts` | Change complexity thresholds or target agents |
| Add keywords to Hermes | `hermes.ts:20` routing_rules | Add new keyword matcher rule |
| Override meta-agent | `olimpus.jsonc` | Define `meta_agents.atenea` to override built-in |
| Create new meta-agent | Not here | Use `olimpus.jsonc` config or extend via plugin |

---

## KEY SYMBOLS

| Symbol | Type | File | Role |
|--------|------|------|------|
| `ateneo` | Const | atenea.ts | MetaAgentDef for strategic planning |
| `hermes` | Const | hermes.ts | MetaAgentDef for communication |
| `hefesto` | Const | hefesto.ts | MetaAgentDef for implementation |

---

## CONVENTIONS

### Meta-Agent Definition Structure
```typescript
const metaAgent: MetaAgentDef = {
  name: "atenea",
  delegates_to: ["oracle", "prometheus", "atlas"],
  routing_rules: [
    {
      matcher: { type: "complexity", threshold: "high" },
      target_agent: "oracle",
      config_overrides: { /* optional */ }
    },
    { matcher: { type: "always" }, target_agent: "atlas" }  // fallback
  ]
};
```

### Naming Convention
- **Built-in agents named after Greek goddesses/gods**
- Atenea = wisdom/strategy
- Hermes = communication/travel
- Hefesto = craftsmanship/building

---

## ANTI-PATTERNS

- ❌ Add new built-in agent to definitions/ (use olimpus.jsonc instead)
- ❌ Modify routing logic in definitions/ directly (override via config)
- ❌ Hard-code delegation logic (use matchers + rules)

---

## UNIQUE STYLES

### Matcher Priority
Each meta-agent uses matchers in order:
1. Specific matchers first (keyword, complexity, regex)
2. Project context matcher
3. Always matcher (fallback catch-all)

### Config Overrides per Route
```typescript
{
  matcher: { type: "complexity", threshold: "high" },
  target_agent: "oracle",
  config_overrides: {
    prompt: "Analyze from first principles...",
    temperature: 0.2,
    model: "claude-3-opus"  // Can override model per route
  }
}
```

---

## RELATED DOCS

- **Registry**: `src/agents/registry.ts` (resolves meta-agents)
- **Routing engine**: `src/agents/routing.ts` (evaluates matchers)
- **Example config**: `example/olimpus.jsonc` (override examples)
