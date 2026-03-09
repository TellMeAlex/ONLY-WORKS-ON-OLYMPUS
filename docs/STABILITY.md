# API Stability Policy

**Formal commitment to semantic versioning with backward compatibility guarantees for Olimpus.**

This policy defines our versioning rules, deprecation process, and stability commitments for all public APIs.

---

## Table of Contents

- [Overview](#overview)
- [Stability Levels](#stability-levels)
- [Semantic Versioning](#semantic-versioning)
  - [Version Format](#version-format)
  - [Version Change Rules](#version-change-rules)
- [Deprecation Policy](#deprecation-policy)
  - [Deprecation Process](#deprecation-process)
  - [Deprecation Notice Requirements](#deprecation-notice-requirements)
  - [Breaking Change Exceptions](#breaking-change-exceptions)
- [API Surface Commitments](#api-surface-commitments)
- [Migration Support](#migration-support)
- [Stability Annotations](#stability-annotations)
- [Release Cadence](#release-cadence)

---

## Overview

### What This Policy Covers

This stability policy applies to:

| API Surface | Stability Guarantee |
|-------------|---------------------|
| Configuration schema (`olimpus.jsonc`) | ✅ Backward compatible |
| TypeScript types | ✅ Backward compatible |
| Plugin exports (`src/index.ts`) | ✅ Backward compatible |
| `MetaAgentRegistry` API | ✅ Backward compatible |
| Routing system exports | ✅ Backward compatible |
| Configuration loader | ✅ Backward compatible |
| Internal implementation | ❌ No guarantee |

### What This Policy Does Not Cover

- **Internal APIs**: Private classes, internal functions, or types not exported from `src/index.ts`
- **Experimental Features**: APIs marked with `@experimental` JSDoc
- **Bug Fixes**: Bug fixes may change behavior to correct implementation
- **Undocumented Behavior**: Behavior not specified in documentation

---

## Stability Levels

We use four stability levels to communicate API maturity and change expectations:

### Stable

**Definition**: APIs ready for production use with long-term backward compatibility guarantees.

**Characteristics**:
- ✅ Follows strict semantic versioning rules
- ✅ Minimum 6 months before any breaking change
- ✅ Migration guides provided for all breaking changes
- ✅ Comprehensive documentation and examples
- ✅ Full test coverage

**Example**:
```ts
/**
 * Main plugin entry point.
 * @since 0.3.0
 * @stable
 */
export const olimpus: Plugin = { /* ... */ };
```

### Experimental

**Definition**: APIs under active development that may change without notice.

**Characteristics**:
- ⚠️ No backward compatibility guarantees
- ⚠️ May be removed or changed in any version
- ✅ Still documented and tested
- ✅ Feedback encouraged

**Example**:
```ts
/**
 * New complex routing matcher under development.
 * @since 0.4.0
 * @experimental
 * Subject to change based on user feedback.
 */
export class ExperimentalMatcher { /* ... */ };
```

### Deprecated

**Definition**: APIs scheduled for removal in a future version.

**Characteristics**:
- ⚠️ Will be removed in a future major version
- ✅ Migration path provided
- ✅ Runtime warnings emitted
- ✅ Minimum 2 minor version deprecation period

**Example**:
```ts
/**
 * Old simple matcher.
 * @since 0.1.0
 * @deprecated since 0.4.0 - Use {@link ComplexMatcher} instead.
 * Will be removed in 1.0.0.
 * @see {@link ComplexMatcher}
 */
export class SimpleMatcher { /* ... */ };
```

### Internal

**Definition**: Implementation details not intended for external use.

**Characteristics**:
- ❌ No stability guarantees
- ❌ May change or be removed without notice
- ❌ Not documented publicly

**Example**:
```ts
/**
 * Internal routing cache management.
 * @internal
 * Not intended for external use.
 */
export class RoutingCache { /* ... */ };
```

---

## Semantic Versioning

Olimpus follows [Semantic Versioning 2.0.0](https://semver.org/) with the format `MAJOR.MINOR.PATCH`.

### Version Format

```
v0.4.2
│ │ └─ PATCH: Backward-compatible bug fixes
│ └─── MINOR: Backward-compatible new features
└───── MAJOR: Breaking changes
```

### Version Change Rules

#### Patch (0.4.0 → 0.4.1)

**Allowed Changes**:
- Bug fixes that don't change behavior for correct usage
- Performance improvements
- Documentation updates
- Type fixes that are more permissive
- Additional unit tests

**Not Allowed**:
- New public APIs
- Changes to existing API signatures
- Behavior changes
- New configuration fields

**Example**:
```ts
// ✅ OK: More permissive type fix
export interface MatcherConfig {
  keywords?: string[] | string;  // Was: string[]
}

// ❌ NOT OK: New public API
export function newHelper(): void { /* ... */ }
```

#### Minor (0.4.0 → 0.5.0)

**Allowed Changes**:
- New public APIs
- New optional configuration fields
- New enum values (existing values preserved)
- New type members (existing preserved)
- Additional matcher types
- More permissive type constraints

**Not Allowed**:
- Required new configuration fields
- Changes to existing API signatures
- Removal of public APIs
- Behavior changes to existing APIs

**Example**:
```ts
// ✅ OK: New optional field
export interface MatcherConfig {
  keywords?: string[];
  newOptionalField?: boolean;  // New optional field
}

// ✅ OK: New enum value
export enum MatcherType {
  Keyword = "keyword",
  Regex = "regex",
  Complexity = "complexity",
  NewType = "new_type",  // New value
}

// ❌ NOT OK: Required new field
export interface MatcherConfig {
  keywords?: string[];
  newRequiredField: boolean;  // Required!
}

// ❌ NOT OK: Changed signature
export function match(config: MatcherConfig): boolean | string { /* ... */ }
```

#### Major (0.4.0 → 1.0.0)

**Allowed Changes**:
- Breaking changes of any kind
- Required new configuration fields
- Changes to existing API signatures
- Removal of deprecated APIs
- Behavior changes to existing APIs

**Requirements**:
- Minimum 2 minor version deprecation period
- Comprehensive migration guide
- All tests pass with migration guide
- Release notes detail each breaking change

**Example**:
```ts
// ✅ OK in major release: Breaking change
export interface MatcherConfig {
  // Required new field - breaking change
  newRequiredField: boolean;

  // Renamed field - breaking change
  oldField: string → renamedField: string;
}

// ✅ OK in major release: Remove deprecated API
export class DeprecatedMatcher { /* removed */ }
```

---

## Deprecation Policy

### Deprecation Process

All deprecations follow this timeline:

```
Version 0.4.0        Version 0.5.0        Version 0.6.0        Version 1.0.0
     │                    │                    │                    │
     └─ API deprecated ──┴─ Migration guide ──┴─ Still supported ──┴─ API removed
```

1. **Deprecation Announced** (v0.4.0)
   - `@deprecated` JSDoc annotation added
   - Runtime warning emitted
   - Replacement API documented

2. **Migration Guide Published** (v0.5.0)
   - Detailed migration instructions
   - Code examples for migration
   - Before/after comparisons

3. **Grace Period Continues** (v0.6.0)
   - Deprecated API still works
   - Warnings continue
   - Support for migration questions

4. **API Removed** (v1.0.0)
   - Deprecated code removed
   - Breaking change documented
   - No longer supported

### Deprecation Notice Requirements

When deprecating an API, you must:

#### 1. Add JSDoc Annotation

```ts
/**
 * Old simple matcher.
 * @since 0.1.0
 * @deprecated since 0.4.0 - Use {@link ComplexMatcher} instead.
 * Will be removed in 1.0.0.
 * @see {@link ComplexMatcher}
 *
 * @example Migration
 * // Before:
 * new SimpleMatcher({ keywords: ["test"] });
 *
 * // After:
 * new ComplexMatcher({
 *   type: "keyword",
 *   keywords: ["test"],
 *   mode: "any"
 * });
 */
export class SimpleMatcher {
  constructor(config: SimpleConfig) { /* ... */ }
}
```

#### 2. Emit Runtime Warning

```ts
export class SimpleMatcher {
  constructor(config: SimpleConfig) {
    deprecationWarn({
      api: "SimpleMatcher",
      version: "0.4.0",
      replacement: "ComplexMatcher",
      removal: "1.0.0",
      docsUrl: "./docs/migration-v0.4.0.md"
    });
  }
}
```

#### 3. Document Migration Path

Create migration guide section in `docs/migration.md`:

```markdown
### Deprecation: SimpleMatcher → ComplexMatcher

**Deprecated in**: 0.4.0
**Removed in**: 1.0.0
**Replacement**: ComplexMatcher

#### Before
```ts
new SimpleMatcher({ keywords: ["test"] });
```

#### After
```ts
new ComplexMatcher({
  type: "keyword",
  keywords: ["test"],
  mode: "any"
});
```

#### Benefits of Migration
- More flexible keyword matching (any/all mode)
- Regex pattern support
- Better type safety
```

### Breaking Change Exceptions

In rare cases, breaking changes may be necessary before the 2-version deprecation period. These exceptions require:

1. **Security Vulnerability**: Immediate fix for security issue
2. **Critical Bug**: Bug causing data loss or corruption
3. **Technical Debt**: Unmaintainable code preventing critical features

**Exception Process**:
1. Document the exception in `CHANGELOG.md`
2. Provide migration path even if accelerated
3. Issue a patch release (e.g., `0.4.1-security`)
4. Announce via GitHub release and project channels

---

## API Surface Commitments

### Configuration Schema (`olimpus.jsonc`)

**Stability Level**: Stable (v0.3.0+)

**Commitments**:
- ✅ Existing configuration fields remain valid
- ✅ New fields are optional
- ✅ Field names don't change
- ✅ Array types remain arrays
- ✅ Object structures remain objects

**Example**:
```jsonc
// ✅ This config will work in all future 0.x versions
{
  "meta_agents": {
    "default": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "hephaestus"],
      "routing_rules": [
        {
          "matcher": { "type": "always" },
          "target_agent": "oracle"
        }
      ]
    }
  }
}
```

### TypeScript Types

**Stability Level**: Stable (v0.3.0+)

**Commitments**:
- ✅ Exported interfaces remain compatible
- ✅ Type names don't change
- ✅ Generic signatures remain compatible
- ✅ Enums don't lose values

**Example**:
```ts
// ✅ This code will compile in all future 0.x versions
import type { MetaAgentConfig, RoutingRule, Matcher } from 'olimpus-plugin';

const config: MetaAgentConfig = {
  base_model: "claude-3-5-sonnet-20241022",
  delegates_to: ["oracle"],
  routing_rules: []
};
```

### Plugin Exports

**Stability Level**: Stable (v0.3.0+)

**Commitments**:
- ✅ Named exports remain available
- ✅ Default export remains `Plugin` object
- ✅ Export paths don't change

**Example**:
```ts
// ✅ This import will work in all future 0.x versions
import { olimpus, MetaAgentRegistry, validateConfig } from 'olimpus-plugin';
```

### Runtime Behavior

**Stability Level**: Stable (v0.3.0+)

**Commitments**:
- ✅ Valid configurations produce same routing decisions
- ✅ Matcher types behave consistently
- ✅ Error messages for invalid config remain consistent
- ✅ Logging format for routing decisions remains stable

---

## Migration Support

### What We Provide

For every breaking change, we provide:

1. **Migration Guide**: Step-by-step instructions in `docs/migration.md`
2. **Code Examples**: Before/after code showing migration
3. **Automated Migration Script** (when feasible): Codemod or script
4. **Compatibility Checker**: Tool to detect deprecated usage

### Migration Guide Template

Each migration guide includes:

```markdown
## Migrating from v{old} to v{new}

### Breaking Changes
- [Change 1]
- [Change 2]

### Migration Steps

#### Step 1: Update Configuration

#### Step 2: Replace Deprecated APIs

#### Step 3: Update Type Imports

### Automated Migration

```bash
npx olimpus-migrate v{old} v{new}
```

### Validation

```bash
bun run olimpus validate olimpus.jsonc
```

### Support

- Documentation: [Migration Guide](./migration.md)
- Issues: [GitHub Issues](https://github.com/...)
```

---

## Stability Annotations

All public APIs must include stability annotations in JSDoc:

```ts
/**
 * Validates an Olimpus configuration.
 *
 * @param config - The configuration object to validate
 * @returns Result with validity flag and optional error message
 * @throws {ValidationError} When config is invalid and throwOnError is true
 *
 * @since 0.1.0
 * @stable
 *
 * @example
 * ```ts
 * const result = validateConfig(myConfig);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateConfig(
  config: unknown,
  options?: ValidationOptions
): ValidationResult { /* ... */ }
```

### Required Annotations

| Annotation | When to Use |
|------------|-------------|
| `@since VERSION` | All public APIs |
| `@stable` | Production-ready APIs |
| `@experimental` | Under-development APIs |
| `@deprecated since VERSION` | Deprecated APIs |
| `@see REFERENCE` | When referencing replacement |
| `@internal` | Private/internal APIs |

---

## Release Cadence

### Planned Releases

| Release Type | Cadence | Purpose |
|--------------|---------|---------|
| Patch | As needed | Bug fixes |
| Minor | Every 2-4 weeks | New features, enhancements |
| Major | Every 6-12 months | Breaking changes, major new features |

### Long-Term Support (LTS)

We may designate specific versions as Long-Term Support (LTS) releases for extended maintenance:

- **LTS Duration**: 12-18 months
- **Support Level**: Security fixes, critical bug fixes only
- **No Feature Updates**: New features only in latest versions

---

## Summary of Commitments

| Commitment | Details |
|------------|---------|
| **Semantic Versioning** | MAJOR.MINOR.PATCH format with clear rules |
| **Backward Compatibility** | No breaking changes without major version bump |
| **Deprecation Notice** | Minimum 2 minor versions before removal |
| **Migration Guides** | Detailed guides for all breaking changes |
| **Stability Annotations** | All public APIs marked with stability level |
| **Automated Tests** | Compatibility tests prevent accidental breakage |

---

## Need Help?

- **Stability Questions**: Open a GitHub issue with the `stability` label
- **Migration Issues**: See [Migration Guide](./migration.md) for step-by-step instructions
- **Deprecated Warnings**: Check the migration guide for replacement APIs
- **API Documentation**: See [API.md](./API.md) for complete API reference

---

## Related Documents

- [Migration Guide](./migration.md) - How to upgrade between versions
- [API Reference](./API.md) - Complete API documentation
- [Changelog](../CHANGELOG.md) - Version history and changes
- [Migration Template](./MIGRATION_TEMPLATE.md) - Template for writing migration guides
