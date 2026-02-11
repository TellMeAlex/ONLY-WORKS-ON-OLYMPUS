# src/agents - ROUTING ENGINE

**Score**: 20 (core logic)  
**Purpose**: Intelligent request routing via 5 matcher types + meta-agent orchestration

---

## OVERVIEW

The agents subsystem implements Olimpus's core value: **first-match-wins routing** that automatically selects the right builtin agent (sisyphus, oracle, librarian, etc.) based on user prompts. Contains 3 routing engines (keyword, complexity, regex, project_context, always matchers), a meta-agent registry with circular dependency detection, and a factory for generating agent configs from definitions.

---

## STRUCTURE

```
src/agents/
├── routing.ts              # 5 matcher evaluators + first-match logic
├── registry.ts             # MetaAgentRegistry class (circular detection, max depth)
├── meta-agent.ts           # createMetaAgentConfig() factory + delegation prompts
└── definitions/            # AGENTS.md: Built-in meta-agents
    ├── atenea.ts           # Strategic planning (complexity-based routing)
    ├── hermes.ts           # Communication/research (keyword-based routing)
    ├── hefesto.ts          # Implementation (project-context-based routing)
    └── index.ts            # Re-export hub
```

---

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new matcher type | `routing.ts` | Add evaluator function + update Zod schema in config/ |
| Debug routing logic | `routing.ts:33` evaluateRoutingRules() | First-match-wins, returns ResolvedRoute or null |
| Understand circular detection | `registry.ts:70` (resolve()) | Tracks visited agents, throws if cycle detected |
| Modify max delegation depth | `registry.ts:15` constructor | Default 3, can be overridden |
| Create custom meta-agent | `definitions/` + config | Or inject via olimpus.jsonc config |
| Test routing decisions | Run bun test (no test file in this dir) | Routing tested via integration in plugin/ |

---

## KEY SYMBOLS

| Symbol | Type | Line | Role |
|--------|------|------|------|
| `evaluateRoutingRules` | Function | 33 | Entry point: evaluates rules in order, returns first match |
| `evaluateMatcher` | Function | 52 | Dispatcher for 5 matcher types (exhaustive pattern) |
| `MetaAgentRegistry` | Class | registry.ts | Tracks definitions, detects cycles, resolves configs |
| `createMetaAgentConfig` | Function | meta-agent.ts | Factory: MetaAgentDef → AgentConfig |
| `ateneo`, `hermes`, `hefesto` | Const | definitions/ | Built-in meta-agent definitions |
| `ResolvedRoute` | Interface | 19 | Result of routing: { target_agent, config_overrides } |
| `RoutingContext` | Interface | 12 | Input to routing: { prompt, projectDir, projectFiles, projectDeps } |

---

## CONVENTIONS

### Matching Order (Non-Negotiable)
```
keyword → complexity → regex → project_context → always (fallback)
```
First match wins; rest skipped. If no match, returns `null`.

### Discriminated Unions
All 5 matcher types use `z.discriminatedUnion("type")` in Zod schema:
```typescript
// Each matcher has { type: "keyword" | "complexity" | ... }
// TypeScript enforces exhaustive checking via discriminated union
```

### No Side Effects in Routing
- Pure functions only (no file I/O, no network calls)
- Complexity scoring is heuristic-based (line count + keyword density)
- ProjectContext checks file existence synchronously

---

## ANTI-PATTERNS

- ❌ Modify routing rules at runtime (immutable after validation)
- ❌ Allow circular delegation (registry enforces max depth)
- ❌ Skip Zod validation before routing (config validated at startup)
- ❌ Return error from routing (return null instead)

---

## UNIQUE STYLES

### Complexity Scoring Algorithm
```typescript
score = Math.ceil(lineCount / 10)  // Base: 1 point per 10 lines
score += keywordCount               // +1 per technical keyword
// Thresholds: low=2, medium=5, high=10 points
```

### Circular Detection via Visited Set
```typescript
// Registry tracks path to current node
// If target already in path, throw error
// Max depth enforced to catch indirect cycles
```

---

## RELATED DOCS

- **Config validation**: `src/config/schema.ts` (Zod schemas for matchers)
- **Built-in agents**: `src/agents/definitions/AGENTS.md`
- **Plugin integration**: `src/plugin/wrapper.ts` (uses routing engine)
