# GitHub Actions CI/CD Workflows

This directory contains automated workflows for building, testing, and publishing the Olimpus plugin.

## Workflows Overview

### 1. **build.yml** - Build & Validate
**Triggers**: Push to any branch, Pull Requests to main/master

**What it does**:
- Installs dependencies with Bun
- Runs TypeScript type checking
- Builds Node.js target (esbuild)
- Builds Bun target (bun build)
- Generates JSON schema
- Validates all artifacts exist
- Reports build artifact sizes
- Comments on PRs with build results

**Matrix**: Tests with Node.js 18.x and 20.x

### 2. **auto-build-commit.yml** - Auto-Compile & Commit
**Triggers**: Push to feature/* or bugfix/* branches when source changes

**What it does**:
- Automatically compiles TypeScript on source changes
- Commits build artifacts (dist-node/, dist-bun/, schema)
- Prevents infinite loops with `[build]` tag in commit message
- Only runs for feature and bugfix branches

**Warning**: Only enable if you want auto-committed builds. Some teams prefer manual builds.

### 3. **test.yml** - Test Suite
**Triggers**: Push to any branch, Pull Requests to main/master

**What it does**:
- Runs any tests defined in package.json
- Validates JSON schema structure
- Reports test results

**Note**: Currently skips if no test command exists (optional)

### 4. **publish.yml** - Publish to npm
**Triggers**: On release creation or manual workflow dispatch

**What it does**:
- Builds all targets
- Publishes to GitHub Packages npm registry (@TellMeAlex scope)
- Updates release notes with package info
- Requires: `secrets.GITHUB_TOKEN` (automatic)

**Usage**:
```bash
# Trigger on GitHub release
gh release create v1.0.0 --generate-notes

# Or trigger manually
gh workflow run publish.yml --ref feature/native-agents
```

### 5. **quality.yml** - Code Quality
**Triggers**: Push to any branch, Pull Requests to main/master

**What it does**:
- TypeScript type checking
- Checks for 'any' type usage
- Validates all imports can be resolved
- Reports console.log usage
- Generates quality summary

## Environment Variables & Secrets

All workflows use automatic GitHub-provided tokens:

- `${{ secrets.GITHUB_TOKEN }}` - Standard for repo access and npm publish
- `${{ github.token }}` - Alternative syntax for same token

### No additional secrets required!

If you add private npm packages or external services, add them via:
1. GitHub repo settings → Secrets and variables → Actions
2. Use in workflows: `${{ secrets.YOUR_SECRET }}`

## Workflow Status Badge

Add to README.md:

```markdown
[![Build & Validate](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/actions/workflows/build.yml/badge.svg)](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/actions)
```

## Disabling Workflows

To disable a workflow without deleting it:
1. In the workflow file, change `on:` to `on: [workflow_dispatch]`
2. Or rename the file to `*.disabled.yml`

## Troubleshooting

### Build fails with "Cannot find module"
- Check imports in src/
- Ensure dependencies are in package.json
- Run `bun install` locally first

### Auto-build-commit creates infinite loops
- Check commit message contains `[build]` tag
- Verify `exclude-patterns` in auto-build-commit.yml

### Publish fails with permission error
- Ensure GitHub Token is properly configured
- Check npm scope in package.json matches publishConfig

## Performance Tips

1. **Caching**: Workflows use `cache: 'npm'` to cache node_modules
2. **Artifacts**: Build artifacts retained for 30 days
3. **Matrix**: Adjust Node.js versions based on your needs
4. **Paths filter**: Workflows only run when relevant files change

## Next Steps

1. Merge this PR to enable CI/CD
2. Create a GitHub Release to test publish workflow
3. Monitor Actions tab for workflow runs
4. Adjust matrix/triggers based on team needs
