# Olimpus Skills

Project-specific skills for the Olimpus orchestrator plugin.

## Included Skills

### jira-issue-operations
Complete Jira issue management for MYSTORES project: create, update, validate issues including Épicas, Historias, Tasks, Bugs, and Sub-tasks with project-specific custom fields and validation rules.

**Location**: `jira-issue-operations/`  
**Entry**: `SKILL.md`

## Usage

Each skill is configured in `example/olimpus.jsonc` under the `skills` array:

```jsonc
{
  "skills": [
    "skills/jira-issue-operations/SKILL.md"
  ]
}
```

## Structure

Each skill directory contains:
- `SKILL.md` - Main skill definition with YAML frontmatter (name, description, examples)
- `README.md` - Detailed documentation
- `references/` - Field references, JQL guides, validation rules
- `scripts/` - Python validation and helper scripts

## Integration

The **jira-issue-operations** skill is integrated with the **Hermes meta-agent** for request routing:
- **jira-issue-operations**: Triggered by MYSTORES project context + CRUD operations

See `example/olimpus.jsonc` for routing rule examples.
