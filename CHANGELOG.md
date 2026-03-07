# Changelog

**All notable changes to this project will be documented in this file.**

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to the [Semantic Versioning](https://semver.org/spec/v2.0.0.html) policy defined in [STABILITY.md](./docs/STABILITY.md).

---

## Table of Contents

- [Version Format](#version-format)
- [Stability Indicators](#stability-indicators)
- [Unreleased](#unreleased)
- [Version History](#version-history)

---

## Version Format

This changelog uses the following format:

```markdown
## [VERSION] - YYYY-MM-DD

### Added
- New feature (@stable, @since VERSION)

### Changed
- Change to existing functionality (@stable, @since VERSION)

### Deprecated
- Feature that will be removed in future (@deprecated, @since VERSION, @remove VERSION+1)

### Removed
- Feature removed in this version

### Fixed
- Bug fix (@stable, @since VERSION)

### Security
- Security fix
```

---

## Stability Indicators

Changes are marked with stability indicators to help you understand impact:

| Indicator | Meaning | Migration Required |
|-----------|---------|-------------------|
| `@stable` | Stable API, backward compatible | No |
| `@experimental` | Experimental API, may change | Maybe |
| `@deprecated` | Deprecated, will be removed | Yes |
| `@removed` | Removed in this version | Yes |

---

## Unreleased

### Added
- Deprecation warning utilities for detecting deprecated configuration options (`src/utils/deprecation.ts`) - `@experimental`, `@since 0.4.0`
- Type compatibility checker for configuration migration (`src/utils/compatibility.ts`) - `@stable`, `@since 0.4.0`
- Automated compatibility test suite (`test-compatibility/`) - `@stable`, `@since 0.4.0`
- Schema backward compatibility tests - `@stable`, `@since 0.4.0`
- Routing behavior compatibility tests - `@stable`, `@since 0.4.0`
- Version migration guide template (`docs/MIGRATION_TEMPLATE.md`) - `@stable`, `@since 0.4.0`
- Stability annotations on all public APIs - `@stable`, `@since 0.4.0`

### Changed
- Enhanced routing system with deprecation checking infrastructure - `@stable`, `@since 0.4.0`

### Deprecated
- None yet

### Removed
- None yet

### Fixed
- None yet

### Security
- None yet

---

## [0.3.0] - 2025-XX-XX

### Added
- Initial meta-agent routing system - `@stable`, `@since 0.1.0`
- Keyword matcher with `any`/`all` modes - `@stable`, `@since 0.1.0`
- Complexity matcher with low/medium/high thresholds - `@stable`, `@since 0.1.0`
- Regex matcher with pattern support - `@stable`, `@since 0.1.0`
- Project context matcher for file-based routing - `@stable`, `@since 0.1.0`
- Always matcher for fallback routing - `@stable`, `@since 0.1.0`
- Config overrides in routing rules - `@stable`, `@since 0.1.0`
- Routing logger for debugging - `@stable`, `@since 0.1.0`
- Meta-agent registry with delegation tracking - `@stable`, `@since 0.1.0`
- Plugin wrapper for oh-my-opencode integration - `@stable`, `@since 0.1.0`
- Configuration loader with JSONC support - `@stable`, `@since 0.1.0`
- Configuration validator with Zod schemas - `@stable`, `@since 0.1.0`
- Analytics configuration (experimental) - `@experimental`, `@since 0.1.0`

### Changed
- None

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- None

---

## [0.2.0] - 2025-XX-XX

### Added
- Plugin interface extensions - `@stable`, `@since 0.2.0`
- Skill system integration - `@stable`, `@since 0.2.0`
- Configuration translation utilities - `@stable`, `@since 0.2.0`
- Meta-agent definition extraction - `@stable`, `@since 0.2.0`

### Changed
- Enhanced plugin initialization - `@stable`, `@since 0.2.0`

### Deprecated
- None

### Removed
- None

### Fixed
- Circular dependency detection in delegation chains - `@stable`, `@since 0.2.0`

### Security
- None

---

## [0.1.0] - 2025-XX-XX

### Added
- Initial release of olimpus-plugin - `@stable`, `@since 0.1.0`
- Core routing infrastructure - `@stable`, `@since 0.1.0`
- Basic matcher types (keyword, complexity, regex) - `@stable`, `@since 0.1.0`
- Configuration schema and validation - `@stable`, `@since 0.1.0`
- Plugin wrapper for oh-my-opencode - `@stable`, `@since 0.1.0`

### Changed
- None

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- None

---

## Migration Guide

### Upgrading from 0.3.0 to 0.4.0

**Status:** Coming Soon

This version introduces:
- Deprecation warning utilities
- Type compatibility checker
- Automated compatibility tests
- Stability annotations on all APIs

**Migration Required:** No breaking changes, but see [STABILITY.md](./docs/STABILITY.md) for new deprecation policy.

**Migration Guide:** See [docs/MIGRATION_TEMPLATE.md](./docs/MIGRATION_TEMPLATE.md) for the format when the upgrade guide is available.

### Upgrading from 0.2.0 to 0.3.0

**Status:** Stable (No breaking changes)

**Migration Required:** No

See the [migration guide](./docs/migration.md) for detailed migration scenarios.

---

## Versioning Policy

This project follows semantic versioning with stability guarantees:

- **Major (X.0.0):** Breaking changes, requires migration guide
- **Minor (0.X.0):** New features, backward compatible
- **Patch (0.0.X):** Bug fixes, backward compatible

For detailed stability policies, see [STABILITY.md](./docs/STABILITY.md).

### Deprecation Timeline

- All deprecations are announced at least **2 minor versions** before removal
- Deprecation warnings are emitted at runtime
- Migration guides are provided for all breaking changes
- Stability markers in code indicate API surface stability

---

## Need Help?

- **Stability Questions:** See [STABILITY.md](./docs/STABILITY.md)
- **Migration Help:** See [docs/migration.md](./docs/migration.md)
- **API Documentation:** See [docs/API.md](./docs/API.md)
- **Issues:** [Report an issue](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/issues)
