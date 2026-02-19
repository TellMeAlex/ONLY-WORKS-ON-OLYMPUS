# Configuration Validator

Schema-based validation tool that checks configuration files for errors, circular dependencies, invalid agent references, and other common mistakes. Provides clear, actionable error messages.

## Rationale
Addresses configuration complexity issues common across competitors (pain-1-3, pain-3-1). LangGraph and AutoGen users struggle with configuration errors that are difficult to debug. Pre-validation catches errors before runtime.

## User Stories
- As a developer, I want to validate my configuration before starting a session so that I avoid runtime errors
- As a new user, I want clear error messages that help me fix configuration mistakes

## Acceptance Criteria
- [ ] Validates all configuration fields against Zod schema
- [ ] Detects circular dependencies in meta-agent delegation chains
- [ ] Verifies all agent references exist in the oh-my-opencode registry
- [ ] Warns about potentially slow regex patterns
- [ ] Integrates with CLI as 'olimpus validate' command
