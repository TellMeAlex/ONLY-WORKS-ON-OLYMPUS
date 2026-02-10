# Draft: Olimpus Meta-Orchestrator Plugin

## Requirements (from user prompt)
- Plugin de OpenCode llamado Olimpus
- Meta-orchestrator wrapper sobre oh-my-opencode
- Meta-agentes con routing declarativo basado en reglas
- Matchers: keyword, complexity, cost, regex, project context
- Config via `olimpus.jsonc` (única fuente)
- Campos propios Olimpus + passthrough a oh-my-opencode
- TypeScript + Bun runtime

## Research Findings (CRITICAL)

### Real Architecture Confirmed via Source Code

**OpenCode Plugin API** (`@opencode-ai/plugin` v1.1.19+):
```typescript
type Plugin = (input: PluginInput) => Promise<PluginInterface>

// PluginInput (real, from source)
type PluginInput = {
  client: OpencodeClient  // from @opencode-ai/sdk
  project: ProjectInfo
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}

// PluginInterface returns hooks:
{
  tool?: Record<string, ToolDefinition>
  config?: ConfigHandler
  event?: EventHandler
  "chat.message"?: MessageHandler
  "chat.params"?: ParamsHandler
  "tool.execute.before"?: BeforeHandler
  "tool.execute.after"?: AfterHandler
  "experimental.chat.messages.transform"?: TransformHandler
  "experimental.session.compacting"?: CompactionHandler
}
```

**oh-my-opencode** (v3.4.0, from GitHub `code-yeongyu/oh-my-opencode`):
- Export: `default OhMyOpenCodePlugin: Plugin`
- Uses Zod v4 (NOT v3 like user's prompt)
- Agents are `AgentConfig` objects from `@opencode-ai/sdk`
- Agent registration via `config` handler (NOT `registerAgent()`)
- Agent invocation via `task` tool (NOT `executeAgent()`)

### APIs That DO NOT EXIST (from user's prompt)
- ❌ `ctx.registerAgent()` — No such method
- ❌ `ctx.executeAgent()` — No such method
- ❌ `PluginContext.loadConfig()` — Not in the interface

### How Agents ACTUALLY Work
1. `config` handler returns `Record<string, AgentConfig>` to OpenCode
2. OpenCode makes them available as selectable agents
3. Primary agents (Sisyphus, Atlas) handle user messages directly
4. They delegate via `task` tool to sub-agents (explore, librarian, oracle)
5. `AgentConfig = { model, temperature?, prompt?, variant? }`

### Config Files (Real)
- `opencode.jsonc` — OpenCode core config (REQUIRED, has `"plugin": ["oh-my-opencode"]`)
- `oh-my-opencode.json` — Plugin-specific config (agents, categories, hooks)
- These ALWAYS coexist — they serve different purposes

### Zod Version
- oh-my-opencode uses Zod v4.1.8 (breaking changes from v3)
- User's prompt assumes Zod v3 syntax

## Critical Issues with User's Proposed Implementation

### 1. Agent Registration Mechanism — BROKEN
User's code: `ctx.registerAgent({ name, description, handler })`
Reality: No such API. Agents are AgentConfig objects returned via config handler.

### 2. Agent Execution Mechanism — BROKEN
User's code: `this.ctx.executeAgent(targetAgent, { prompt })`
Reality: No such API. Delegation happens via `task` tool within agent sessions.

### 3. Wrapper Pattern — NEEDS RETHINKING
User calls `OhMyOpenCodePlugin(ctx)` inside Olimpus. This is technically possible but:
- Both can't be in `"plugin": [...]` simultaneously
- The PluginInterface returned needs careful merging (hooks, tools, config)
- Config handler from oh-my-opencode builds agents — Olimpus needs to intercept this

### 4. Meta-Agent Routing — WRONG LAYER
User routes at plugin level. But agent selection in OpenCode happens at:
- UI level (user selects active agent)
- Tool level (`task` tool spawns sub-agents)
- Hook level (`chat.message` can modify behavior)

### 5. Zod v3 vs v4 — INCOMPATIBLE
User imports from 'zod' assuming v3 patterns. oh-my-opencode uses v4.

## Decisions Made (User Responses)

### 1. Core Goal: PROPIA CAPA DE CONFIGURACIÓN
- Tener su propia capa de configuraciones
- SIN tener que tener oh-my-opencode instalado directamente
- Internamente usando todas las funcionalidades de oh-my-opencode como base
- Poder ampliar o definir agentes/config a su antojo

### 2. Relationship: WRAPPER (importar y extender)
- Olimpus importa OhMyOpenCodePlugin, lo ejecuta, y envuelve/extiende su PluginInterface
- Solo "olimpus" va en opencode.jsonc como plugin
- oh-my-opencode es una DEPENDENCIA de olimpus, no un plugin separado

### 3. Routing Mechanism: CONFIG HANDLER DINÁMICO
- El config handler de Olimpus genera AgentConfigs dinámicamente según el contexto del proyecto
- Las reglas declarativas en olimpus.jsonc se traducen a AgentConfigs en runtime
- No hook interception, no tool wrapper — pure config generation

## Technical Decisions (confirmed)

- **Plugin relationship**: Wrapper — Olimpus importa oh-my-opencode como dependencia
- **Routing mechanism**: Config handler dinámico — genera AgentConfigs basados en reglas
- **Config format**: olimpus.jsonc reemplaza oh-my-opencode.json (Olimpus traduce internamente)
- **Zod version**: Zod v4 (match oh-my-opencode)
- **opencode.jsonc**: DEBE existir, pero solo lista "olimpus" como plugin

## Architecture Pattern (emerging)

```
opencode.jsonc: { "plugin": ["olimpus"] }
                        │
                        ▼
              OlimpusPlugin (Plugin)
                │              │
                ▼              ▼
        olimpus.jsonc     OhMyOpenCodePlugin
        (own config)      (imported as dep)
                │              │
                ▼              ▼
        Config Handler    PluginInterface
        (generates        (hooks, tools,
        dynamic           agents from
        AgentConfigs      oh-my-opencode)
        based on rules)
                │              │
                └──────┬───────┘
                       ▼
               Merged PluginInterface
               (oh-my-opencode base +
                olimpus extensions)
```

## Decisions Made (Round 2)

### 4. Meta-agents: ORQUESTADORES INTERMEDIOS
- Atenea, Hermes, Hefesto son agentes NUEVOS
- Delegan a agentes existentes (oracle, explore, librarian) via tool `task`
- Son orquestadores intermedios con sus propias reglas de cuándo delegar a quién

### 5. Config: UN SOLO ARCHIVO (olimpus.jsonc)
- Todo va en olimpus.jsonc
- Los campos de oh-my-opencode (agents, categories, disabled_hooks) van dentro
- Olimpus traduce internamente al formato que oh-my-opencode espera

### 6. Routing: AGENTCONFIG DINÁMICO
- Las reglas generan AgentConfigs on-the-fly
- "atenea" se convierte en un AgentConfig diferente según las reglas evaluadas
- Routing rules determinan model, temperature, prompt, variant dinámicamente

## Final Architecture Understanding

```
olimpus.jsonc:
{
  // Campos Olimpus
  "meta_agents": {
    "atenea": {
      "delegates_to": ["prometheus", "oracle", "atlas"],
      "routing_rules": [...],
      "context": {...}
    }
  },
  
  // Campos oh-my-opencode (passthrough)
  "agents": {...},
  "categories": {...},
  "disabled_hooks": [...]
}

↓ Olimpus Plugin procesa ↓

1. Extrae campos propios (meta_agents) → genera AgentConfigs dinámicos
2. Extrae campos oh-my-opencode (agents, categories, ...) → pasa a OhMyOpenCodePlugin
3. Merge: AgentConfigs de meta-agentes + AgentConfigs de oh-my-opencode
4. Retorna PluginInterface merged (tools + hooks de ambos)
```

## Decisions Made (Round 3)

### 7. Config Strategy: CONFIG TRANSLATION LAYER
- Olimpus reimplementa la lógica de config loading de oh-my-opencode
- Lee de olimpus.jsonc directamente
- Traduce internamente al formato que oh-my-opencode espera
- No escribe archivos temporales
- Más acoplamiento con oh-my-opencode internals pero más limpio en runtime

### Metis Gaps Resolution
- **oh-my-opencode access**: RESOLVED — Source available on GitHub (code-yeongyu/oh-my-opencode)
- **Greenfield confirmation**: YES — Building from scratch in empty /olimpo directory
- **Config strategy**: Config Translation Layer (reimplementar loading)
- **Deployment model**: `npm install olimpus` → instala oh-my-opencode como dependency automáticamente
- **Agent delegation timing**: Olimpus calls OhMyOpenCodePlugin FIRST, captures interface, THEN adds meta-agents
- **Circular dependency prevention**: Max 3 delegation levels + detection
- **Agent naming conflicts**: Meta-agents use `olimpus:` prefix namespace
- **oh-my-opencode version coupling**: Semver range in package.json, integration test on CI

## Scope Boundaries
- INCLUDE: Plugin wrapper, config layer, dynamic agent config generation, meta-agents
- EXCLUDE: TBD (pending remaining questions)
