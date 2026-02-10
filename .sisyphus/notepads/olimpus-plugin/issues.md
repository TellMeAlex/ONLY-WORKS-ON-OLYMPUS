# Issues & Gotchas — Olimpus Plugin

## Task 1: Project Initialization

### TypeScript rootDir Conflict ✅ RESOLVED
- **Problem**: bun init creates index.ts in root, conflicts with tsconfig rootDir: "src"
- **Symptom**: "File is not under rootDir" error from tsc
- **Solution**: Remove root index.ts, create placeholder in src/index.ts
- **Status**: Fixed

### oh-my-opencode Source Location Update
- **Note**: GitHub source URLs may 404 (v3.4.0 specifically)
- **Use**: node_modules/oh-my-opencode/dist/ as authoritative source
- **Implication**: All future references to oh-my-opencode internals should come from installed package

## Known Problems
(Edge cases, quirks, things to watch out for)

---

## [2026-02-10T16:00] Task 3: Config Loader & Translator

### JSONC Parser Gotcha — parseTree vs parse ❌ RESOLVED

**Problem:** Initial implementation used `parseTree()` from jsonc-parser, which reported many "parse errors" even for valid JSONC, making error handling confusing.

**Root Cause:** `parseTree()` parses strictly into a tree structure and returns parse errors in a raw format. It's designed for AST operations, not config loading.

**Solution:** Use `parse()` function instead:
- Returns plain JavaScript object (already deserialized)
- Simpler error handling with error code enum
- Better for config file loading use case

**Lesson:** Choose the right tool for the job. `parseTree()` is for advanced parsing/transformation, `parse()` is for simple config loading.

### Deep Merge Array Behavior ✅ CLARIFIED

**Design Decision:** Arrays in merged configs are replaced entirely (not concatenated).

**Rationale:** Config merging should use "last one wins" semantics for all field types:
- Scalar values: project overrides user ✓
- Objects: merge recursively ✓
- Arrays: replace entirely (don't concatenate) ✓

This prevents unexpected duplication (e.g., disabled_hooks array growing when merging).

---

