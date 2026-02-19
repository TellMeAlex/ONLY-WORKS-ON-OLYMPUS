# OLIMPO - PROJECT KNOWLEDGE BASE

**Generated**: 2026-02-11 11:18:52 UTC  
**Updated**: 2026-02-19 (CI/CD + branch protection)  
**Commit**: f897f9e (ci: add CI/CD workflows for GitHub Packages publish)  
**Branch**: master

---

## OVERVIEW

**Olimpo** (only-works-on-olympus) is a meta-orchestrator plugin for oh-my-opencode that adds intelligent request routing via 5 matcher types (keyword, complexity, regex, project_context, always). It validates routing rules with Zod v4, detects circular delegation chains, and merges custom skills with namespace prefixing. Built with Bun, TypeScript strict mode, no `any` types.

Core value: automate agent selection instead of manual routing.

---

## STRUCTURE

```
src/
├── index.ts                       # Plugin entry (OlimpusPlugin default export)
├── config/                        # AGENTS.md: Config validation & loading (score 18)
│   ├── schema.ts                  # 27 Zod schemas (matchers, rules, config)
│   ├── loader.ts                  # JSONC parsing + deep merge
│   └── translator.ts              # OMO compatibility layer
├── agents/                        # AGENTS.md: Routing engine (score 20, CORE)
│   ├── routing.ts                 # 5 matchers + first-match-wins
│   ├── registry.ts                # Registry + circular detection
│   ├── meta-agent.ts              # Factory for AgentConfig
│   └── definitions/               # AGENTS.md: Built-in meta-agents (score 12)
│       ├── atenea.ts              # Strategic planning (complexity-based)
│       ├── hermes.ts              # Communication/research (keyword-based)
│       ├── hefesto.ts             # Implementation (project-context-based)
│       └── index.ts               # Re-exports all 3
├── plugin/                        # Plugin interface merging (SKIP: score 8, covered by root)
│   ├── wrapper.ts                 # Interface chaining
│   └── wrapper.test.ts
└── skills/                        # AGENTS.md: Skill system (score 10)
    ├── loader.ts                  # Load + merge + namespace prefix
    ├── types.ts                   # SkillDefinition interface
    └── loader.test.ts

dist/                             # Build output: index.js + index.d.ts
example/                          # Example config file

.github/
└── workflows/
    ├── ci.yml                     # PR checks: typecheck + bun test
    └── publish.yml                # Auto-publish to GitHub Packages on merge to master
```

---

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new matcher type | `src/agents/routing.ts` + `src/config/schema.ts` | Update evaluateMatcher, add Zod schema |
| Create custom meta-agent | `src/agents/definitions/` (template) or `olimpus.jsonc` config | Extend RoutingRule with config overrides |
| Fix config loading issue | `src/config/loader.ts` | Checks: project root, then `~/.config/opencode/` |
| Validate config structure | `src/config/schema.ts` | All config must pass Zod v4 validation |
| Debug routing logic | `src/agents/routing.ts` + `src/agents/registry.ts` | First-match-wins, max depth enforcement |
| Understand circular detection | `src/agents/registry.ts` (MetaAgentRegistry class) | `register()`, `resolve()` with depth tracking |
| Plugin integration | `src/plugin/wrapper.ts` | Merges OMO hooks with Olimpo extensions |
| Test pattern examples | `src/plugin/wrapper.test.ts`, `src/skills/loader.test.ts` | Bun test framework, `import { test, expect }` |

---

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `OlimpusPlugin` | Async Function | `src/index.ts:28` | Main plugin export—orchestrates all 5 components |
| `MetaAgentRegistry` | Class | `src/agents/registry.ts` | Tracks definitions, detects cycles, enforces max depth |
| `evaluateRoutingRules` | Function | `src/agents/routing.ts:33` | First-match-wins matcher evaluation (5 types) |
| `loadOlimpusConfig` | Function | `src/config/loader.ts` | Load + merge config from project + user home |
| `createOlimpusWrapper` | Function | `src/plugin/wrapper.ts` | Merge OMO PluginInterface with Olimpo extensions |
| `ateneo`, `hermes`, `hefesto` | Const | `src/agents/definitions/` | Built-in meta-agents (strategic, communication, impl) |
| `OlimpusConfigSchema` | Zod Type | `src/config/schema.ts` | Root config schema—all config validated here |
| `loadOlimpusSkills` | Function | `src/skills/loader.ts` | Load YAML frontmatter, apply namespace prefix |

---

## CONVENTIONS

**ONLY report deviations below—standard TypeScript/Bun conventions NOT repeated.**

### Bun-First Development
- **Runtime**: Bun only (not Node.js)
- **Build**: `bun build src/index.ts --target bun` → `/dist/index.js`
- **Test**: `bun test` (zero-config, detects `*.test.ts`)
- **Package manager**: Bun (no npm/yarn/pnpm)

### TypeScript Strict Mode (All Files)
- `strict: true` globally enforced
- No `any` types → use `unknown` + type guard or specific type
- Discriminated unions for matcher types (`z.discriminatedUnion`)
- ES modules with **explicit `.js` extensions** in imports

### Module Organization (Non-Standard)
- **No barrel exports** from main `index.ts` (only default export)
- **Submodule imports required**: `from "olimpus-plugin/config/schema"` (not re-exported)
- **Re-export hub**: `src/agents/definitions/index.ts` for 3 built-ins only

### Config Precedence (Non-Standard)
- Search order: `./olimpus.jsonc` (project) → `~/.config/opencode/olimpus.jsonc` (user)
- Single source of truth (no `oh-my-opencode.json` file)
- JSONC format (JSON with comments)—parsed via `jsonc-parser`

### Error Handling (Non-Standard)
- **Return `null` for optional routing results** (not throwing)
- **Throw with context** for unrecoverable errors (startup validation)
- **Zod validation at startup** (don't defer config checks)

---

## ANTI-PATTERNS (THIS PROJECT)

**Forbidden Practices** (enforced by architecture):

### Security
- ❌ Commit `.npmrc` with tokens (already in .gitignore)
- ❌ Store credentials in config examples

### Architecture
- ❌ Use non-existent APIs: `ctx.registerAgent()`, `ctx.executeAgent()` (don't exist in @opencode-ai/plugin)
- ❌ Create runtime handler functions for agents (use AgentConfig objects, not functions)
- ❌ Chain oh-my-opencode as separate plugin (Olimpus is the wrapper)
- ❌ Circular delegation without depth limits (enforced: max depth = 3 by default)

### Configuration
- ❌ Multiple config files for same responsibility
- ❌ Pass config via temporary files (in-memory Translation Layer only)
- ❌ Mix Zod v3 and v4 syntax (must use v4, breaking changes)

### Code Quality
- ❌ Use `any` types (use `unknown` + type guard)
- ❌ Over-engineer with unnecessary patterns
- ❌ Leave code unclear (prefer self-documenting code over JSDoc spam)

---

## UNIQUE STYLES

### Routing Rules First-Match-Wins
```typescript
// Rules evaluated in order; first match wins, rest skipped
routing_rules: [
  { matcher: { type: "keyword", keywords: ["docs"] }, target_agent: "librarian" },
  { matcher: { type: "complexity", threshold: "high" }, target_agent: "oracle" },
  { matcher: { type: "always" }, target_agent: "hephaestus" }  // fallback
]
```

### Circular Dependency Detection
```typescript
// Registry prevents cycles: atenea → hermes → atenea (blocked)
// Max depth enforced (default 3)
registry.register("atenea", definitionA);
const config = registry.resolve("atenea", context);  // throws if cycle detected
```

### Config Validation Via Zod
```typescript
// All config validated at startup, not deferred
const config = loadOlimpusConfig(projectDir);
// Throws ZodError immediately if invalid
// Type: OlimpusConfig (narrowed from schema)
```

### Skill Namespace Prefixing
```typescript
// Skills auto-prefixed with "olimpus:" to avoid conflicts
olimpus:
  my-skill: { commands: [...], handoffs: [...] }
```

---

## CI/CD

### Workflows

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | PR to `master` | `bun install` → `typecheck` → `bun test` |
| `publish.yml` | Push to `master` (merge) | `bun install` → `build` → `npm publish` |

### Branch Protection (`master`)

- ❌ Push directo bloqueado — solo por PR
- ✅ CI (`Typecheck & Tests`) debe pasar antes de mergear
- ✅ Branch debe estar actualizada con master antes de mergear (`strict`)
- ❌ Force push bloqueado
- ❌ Borrar rama bloqueado
- ✅ Conversaciones resueltas antes de mergear
- ✅ Reviews invalidadas si hay nuevos commits

### Publicar una nueva versión

```bash
# 1. Crear rama
git checkout -b feat/mi-feature

# 2. Hacer cambios + bump version en package.json
#    (OBLIGATORIO: si no cambias la versión, el publish falla con 409)

# 3. Push + PR
git push origin feat/mi-feature
gh pr create

# 4. CI corre automáticamente en el PR
# 5. Al mergear → publish automático a GitHub Packages
```

### Registry

- **Paquete**: `@TellMeAlex/only-works-on-olympus`
- **Registry**: `https://npm.pkg.github.com`
- **Auth**: `GITHUB_TOKEN` automático en Actions (sin secrets manuales)
- **Visibilidad**: Privado (requiere token con `read:packages` para instalar)

### Instalar en otro proyecto

```bash
# .npmrc del proyecto consumidor:
@TellMeAlex:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_PAT_con_read:packages>

# Instalar:
npm install @TellMeAlex/only-works-on-olympus
```

---

## COMMANDS

```bash
# Development
bun install                  # Install dependencies
bun run typecheck           # Type-check without build

# Build
bun run build               # Compile + generate schema (2-stage)
bun run schema:generate     # Just schema generation
bun run schema:validate     # Validate generated schema

# Testing
bun test                    # Run all tests
bun test src/path/file.ts  # Run single test file

# Publishing (automático via CI/CD — no hacer manualmente)
npm publish --dry-run       # Verificar tarball antes de publicar
npm run publish:github      # Publicar manualmente si es necesario
```

---

## NOTES & GOTCHAS

1. **Config file search order matters**: Project root wins over user home
2. **Zod v4 required** (not v3)—breaking changes if upgrading
3. **TypeScript strict mode enforced**—code won't compile if violations found
4. **No Barrel Exports**—must import from submodules directly
5. **Circular detection catches ALL chains**—not just direct A→A
6. **First-match-wins is silent**—if no rules match, routing returns null (or always matcher catches it)
7. **Skills are namespaced**—avoid name conflicts with oh-my-opencode skills
8. **Bun-only project**—Node.js is not supported
9. **Schema validation happens at plugin load time**—errors surface immediately
10. **Config overrides flow through routing rules**—each rule can customize model, temperature, prompt for target agent
11. **Bump version antes de mergear**—el publish falla con `409 Conflict` si la versión ya existe en GitHub Packages
12. **No pushear `.npmrc` con tokens**—el `.npmrc` del proyecto solo contiene el scope/registry, el token va en variables de entorno locales
13. **`GITHUB_TOKEN` en Actions tiene `write:packages` automático**—no hace falta configurar secrets adicionales para publicar

---

## Related Docs

- **Configuration**: `example/olimpus.jsonc` (full example)
- **Publishing**: `PUBLISH_TO_NPM_PUBLIC.md`
- **Schema**: `assets/olimpus.schema.json` (JSON Schema Draft-07)
- **Entry Point**: `src/index.ts` (start here)
- **CI Workflow**: `.github/workflows/ci.yml`
- **CD Workflow**: `.github/workflows/publish.yml`
- **Subsystems**: See linked AGENTS.md files below
