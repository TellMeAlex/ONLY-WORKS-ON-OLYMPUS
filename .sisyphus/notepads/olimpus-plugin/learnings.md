# Learnings — Olimpus Plugin

## Task 1: Project Initialization

### oh-my-opencode Distribution
- oh-my-opencode v3.4.0 is pre-built (dist/ directory only, no src/)
- Authoritative source is node_modules/oh-my-opencode/dist/ (not GitHub URLs)
- Includes agents/, config/, features/, hooks/, mcp/, shared/, tools/, plugin-handlers/ modules

### Bun Init Quirks
- `bun init --yes` creates tsconfig with "Preserve" module (not ESNext)
- Creates index.ts in root - conflicts with rootDir: "src"
- Auto-installs @types/bun and typescript@5.x

### TypeScript Configuration (ESNext + Bundler)
- "moduleResolution": "bundler" required for Bun
- "strict": true enables all strict checks
- "declaration": true auto-generates .d.ts files
- "outDir": "dist" & "rootDir": "src" must be consistent
- Root-level TypeScript files must be excluded when using rootDir

### Dependency Installation
- All dependencies installed successfully:
  - oh-my-opencode@3.4.0 ✅
  - @opencode-ai/plugin@1.1.53 ✅
  - @opencode-ai/sdk@1.1.53 ✅
  - zod@4.3.6 ✅ (matches oh-my-opencode v3.4.0 requirement)
  - jsonc-parser@3.3.1 ✅
- 112 total packages, 3 blocked postinstalls (non-critical)

### TypeScript Verification
- tsc --noEmit passes cleanly with src/index.ts placeholder
- No source files needed for initial verification

## Conventions & Patterns
(Discoveries about effective implementation approaches)

---
