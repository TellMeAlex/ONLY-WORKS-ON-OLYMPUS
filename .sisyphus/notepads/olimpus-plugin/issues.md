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
