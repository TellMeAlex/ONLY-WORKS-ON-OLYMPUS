---
applyTo: '**'
---

# project.instructions.md

This file provides guidance to AI Assistant when working with code in this repository.

## Build & Test Commands

**Build** (compile TypeScript, generate schema):
```bash
bun run build
```

**Type Check** (without build):
```bash
bun run typecheck
```

**Run Single Test**:
```bash
bun test src/path/to/test.ts
```

**Run All Tests**:
```bash
bun test
```

**Schema Commands**:
```bash
bun run schema:generate  # Generate Zod schema
bun run schema:validate  # Validate against schema
```

## Code Style Guidelines

**Imports**: Use ES modules with explicit extensions. Order: built-ins → @scope → local (alphabetical).

**Formatting**: TypeScript strict mode enforced. No `any` types. Use discriminated unions for type safety.

**Types**: Prefer interfaces for public APIs, types for internal logic. Use `unknown` instead of `any`.

**Error Handling**: Validate Zod schemas at startup. Return `null` for optional routing (not throwing).

**Naming**: camelCase for functions/vars, PascalCase for types/classes. Descriptive names (no abbreviations).

## Overview

**Olimpus** is a meta-orchestrator plugin for oh-my-opencode that adds intelligent request routing through customizable agents. It evaluates user prompts against 5 matcher types (keyword, complexity, regex, project_context, always) to delegate work to specialized builtin agents (sisyphus, oracle, librarian, etc.). Built with Bun, TypeScript (strict mode), Zod v4 schema validation, and circular dependency detection for safe agent delegation.

Core components: config system (JSONC loading/merging), routing engine (5 matchers, first-match-wins), meta-agent registry (with circular detection), plugin wrapper (interface merging), and skill system (namespace prefixing). The plugin orchestrates all components, validates config via Zod at startup, and returns a merged PluginInterface to the framework. Includes 3 built-in meta-agents (Atenea for planning, Hermes for research, Hefesto for building).
