# Contributing to Olimpus Plugin

Thanks for your interest in contributing! This document outlines the development workflow and guidelines.

## Development Setup

### Prerequisites

- **Bun** (latest) - JavaScript runtime and package manager
- **Node.js** (18.x+) - For GitHub Actions compatibility
- **Git** - Version control

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS.git
cd ONLY-WORKS-ON-OLYMPUS

# Install dependencies with Bun
bun install

# Verify setup
bun run typecheck
bun run build
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Create a branch from feature/native-agents or main
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/your-bug-fix
```

### 2. Make Your Changes

Edit files in `src/`:
```
src/
├── index.ts              - Plugin entry point
├── agents/               - Routing & meta-agent logic
├── config/               - Configuration loading & validation
├── plugin/               - oh-my-opencode integration
└── skills/               - Custom skills system
```

### 3. Type Check

```bash
# TypeScript compilation check (no build)
bun run typecheck
```

### 4. Build Locally

```bash
# Build both targets (Node.js + Bun) + schema
bun run build

# Or build individually
bun run build:node    # esbuild for Node.js
bun run build:bun     # Bun bundler
```

### 5. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Good commit messages:
git commit -m "feat: Add new matcher type for project dependencies"
git commit -m "fix: Resolve circular dependency detection bug"
git commit -m "docs: Update routing rules documentation"
git commit -m "refactor: Simplify config loader with better error handling"
git commit -m "test: Add tests for meta-agent registry"
```

Format: `<type>(<scope>): <subject>`

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Build, deps, CI/CD
- `perf` - Performance improvements

### 6. Push and Create a Pull Request

```bash
# Push to your feature branch
git push origin feature/your-feature-name

# Create PR on GitHub
# Title: Same as your commit message subject
# Description: Explain the "why" behind your changes
```

## GitHub Actions CI/CD

When you push to a feature branch or create a PR:

1. **build.yml** runs automatically:
   - Tests on Node.js 18.x and 20.x
   - Builds esbuild (dist-node) and Bun (dist-bun) targets
   - Generates JSON schema
   - Comments on PR with results

2. **quality.yml** validates:
   - TypeScript type checking
   - Import resolution
   - 'any' type usage

3. **auto-build-commit.yml** (on feature/* branches):
   - Automatically builds and commits artifacts
   - Adds `[build]` tag to prevent infinite loops

All checks must pass before merging.

## Code Standards

### TypeScript

- **Strict mode enabled** - All files use `strict: true`
- **No 'any' types** - Use proper typing
- **Explicit types** - Don't rely on inference for public APIs

```typescript
// Good
export function route(rules: RoutingRule[], context: RoutingContext): Route | null {
  // ...
}

// Bad
export function route(rules: any, context: any): any {
  // ...
}
```

### Architecture Decisions

- **Zod v4** for schema validation (not JSON Schema for runtime)
- **ESM modules** throughout (no CommonJS in source)
- **External dependencies** marked in esbuild for Node.js build

### File Organization

```
src/
├── agents/
│   ├── definitions/          - Built-in meta-agents (atenea, hermes, hades)
│   ├── meta-agent.ts        - Meta-agent factory
│   ├── registry.ts          - MetaAgentRegistry implementation
│   └── routing.ts           - Routing rules evaluation
├── config/
│   ├── loader.ts            - Load & parse olimpus.jsonc
│   ├── schema.ts            - Zod v4 schemas (27 types)
│   ├── scaffolder.ts        - Auto-create configs
│   ├── translator.ts        - Olimpus → oh-my-opencode config
│   └── wizard.ts            - Interactive setup
├── plugin/
│   └── wrapper.ts           - Integration with oh-my-opencode
├── skills/
│   └── loader.ts            - Load custom skills
└── index.ts                 - Plugin entry point
```

## Security

### Credential Handling

This project uses environment variables for all sensitive credentials. **Never hardcode credentials in source code.**

#### Required Environment Variables

Tools and integrations in this project rely on environment variables:

```bash
# Example for Jira integration
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your-personal-access-token
```

#### Setup Steps

1. **Create `.env` file** in project root:
   ```bash
   touch .env
   ```

2. **Add your credentials** (refer to specific tool documentation for required variables):
   ```bash
   JIRA_BASE_URL=https://example.atlassian.net
   JIRA_EMAIL=user@example.com
   JIRA_API_TOKEN=your_pat_here
   ```

3. **Verify `.env` is in `.gitignore`**:
   ```bash
   cat .gitignore | grep "\.env"
   # Should show: .env
   ```

4. **Test configuration**:
   ```bash
   bun run dev
   # Check for error messages about missing credentials
   ```

#### Best Practices

- ✅ **Use environment variables** for all API keys, tokens, and secrets
- ✅ **Validate credentials** at startup with clear error messages
- ✅ **Document required variables** in module docstrings (see `src/tools/jira.ts` for example)
- ✅ **Use `.env.example`** to document expected variables without exposing values
- ✅ **Rotate credentials regularly** and invalidate old ones

- ❌ **Never commit** `.env` files or credentials to version control
- ❌ **Never hardcode** API keys, tokens, or passwords in source code
- ❌ **Never log** sensitive data to console or files
- ❌ **Never share** credentials in PR descriptions, comments, or issues

#### Code Pattern

Follow the pattern established in `src/tools/jira.ts`:

```typescript
/**
 * Required environment variables:
 * - TOOL_API_KEY: Your API key from the service provider
 * - TOOL_SECRET: Your secret token for authentication
 */

function getConfig(): ToolConfig {
  const apiKey = process.env.TOOL_API_KEY;
  const secret = process.env.TOOL_SECRET;

  if (!apiKey || !secret) {
    throw new ToolConfigError(
      `Missing required environment variables. ` +
      `Please set TOOL_API_KEY and TOOL_SECRET in your .env file.`
    );
  }

  return { apiKey, secret };
}
```

## Testing

Currently, tests are optional. If you add tests:

```bash
# Run tests (if package.json has test command)
bun test

# Tests should cover:
# - Config loading & validation
# - Routing rule evaluation
# - Meta-agent delegation
# - Schema generation
```

## Documentation

- **README.md** - User-facing overview
- **AGENTS.md** - Agent definitions and routing logic (in each component dir)
- **Code comments** - Only for complex algorithms or non-obvious logic
- **Inline examples** - In docstrings for public APIs

## Build Artifacts

After building, check that these files exist:

```bash
dist-node/index.js       # Node.js build (~40KB)
dist-node/index.d.ts     # TypeScript declarations
dist-bun/index.js        # Bun build (~3MB, fully bundled)
assets/olimpus.schema.json # JSON Schema
```

## Common Tasks

### Add a new matcher type

1. Update schema in `src/config/schema.ts`
2. Add evaluation logic in `src/agents/routing.ts`
3. Document in `src/agents/routing/AGENTS.md`
4. Run `bun run build` and test

### Create a new meta-agent

1. Create file: `src/agents/definitions/your-agent.ts`
2. Implement routing rules
3. Export from `src/agents/definitions/index.ts`
4. Update README with description
5. Run `bun run build`

### Update configuration schema

1. Modify Zod schemas in `src/config/schema.ts`
2. Update example in `example/olimpus.jsonc`
3. Run `bun run schema:generate`
4. Test with `bun run typecheck`

## Troubleshooting

### Build fails with "Cannot find module"

```bash
# Ensure all imports are correct
bun run typecheck

# Check if new dependencies need adding to package.json
# Then run
bun install
```

### Tests fail

```bash
# Check if tests exist
cat package.json | grep '"test"'

# If tests exist, run them
bun test

# Debug with verbose output
bun test --verbose
```

### CI/CD fails but local build works

```bash
# CI might use different Node.js version
# Test with specific version
nvm use 20  # Use Node.js 20.x
npm run build
```

## Merging

Your PR will be merged when:

1. ✅ All GitHub Actions pass
2. ✅ Code review approved
3. ✅ Commit messages follow conventions
4. ✅ No conflicts with main branch

After merge:
- Builds are automatically committed if they changed
- Artifacts are available in GitHub Actions
- Release notes can reference your PR

## Questions?

- Check [.github/workflows/README.md](.github/workflows/README.md) for CI/CD details
- Review existing code in `src/` for patterns
- Open an issue for discussion before major refactoring

Thanks for contributing! 🚀
