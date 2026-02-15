---
name: jira-issue-operations
description: >
  Complete Jira issue management for MYSTORES project: create, update, validate issues including Épicas, Historias, Tasks, Bugs, and Sub-tasks with project-specific custom fields and validation rules.
  Trigger: When user asks to create/update Jira issues, validate fields, or work with MYSTORES-specific issue types.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.1"
  project: MYSTORES
---

## When to Use

Use this skill when:
- Creating any Jira issue (Épica, Historia, Task, Bug, Sub-task, Initiative, Spike, Strategic Theme, Design)
- Updating existing issues
- Validating issue fields before creation
- Working with MYSTORES-specific custom fields
- Querying issues with JQL
- Understanding issue type requirements and validation rules

## Critical Rules for MYSTORES

### Issue Type Names (CRITICAL)
- **NEVER use "Epic"** - ALWAYS use **"Épica"** (with accent)
- **NEVER use "Sub-task"** - ALWAYS use **"Sub-tarea"** (in Spanish)
- Valid types: `Épica`, `Historia`, `Task`, `Bug`, `Sub-tarea`, `Initiative`, `Spike`, `Strategic Theme`, `Design`

### Required Fields by Type

| Issue Type | Required Fields | Notes |
|------------|----------------|-------|
| **Épica** | `summary`, `customfield_11762` (Epic Name) | Epic Name MUST exactly match summary |
| **Historia** | `summary` | Template: "Como [rol] Quiero [funcionalidad] Para que [beneficio]" |
| **Task** | `summary` | Technical task, does NOT deliver direct user value |
| **Bug** | `summary`, `customfield_10824` (Bug Environment) | MUST be assigned to QA team |
| **Sub-tarea** | `summary`, `parent` (issue key) | Cannot exist without parent, corrective actions MUST have duedate |
| **Initiative** | `summary` | Optional: Principal Product, Affected Products, Portfolio Priority |

### MYSTORES-Specific Rules

1. **Bugs**: MUST be assigned to QA team
2. **Corrective Action Sub-tasks**: MUST have `duedate` set
3. **Épica Epic Name**: `customfield_11762` MUST exactly match `summary`
4. **Issue closure**: Cannot close with fewer than 2 comments
5. **Vertical Owner**: Should populate `customfield_42960` for classification

## Custom Fields Reference

| Field | customfield_* | Used in | Required | Values |
|-------|---------------|---------|----------|--------|
| Epic Name | 11762 | Épica | Yes | String matching summary exactly |
| Bug Environment | 10824 | Bug | Yes | Produccion, Pre-produccion, Testing, Desarrollo |
| Sprint | 10009 | All issues | No | Sprint ID or name |
| Epic Link | 10100 | Non-epics | No | Epic issue key (legacy, use parent instead) |
| Principal Product | 43462 | Initiative | No | Product list |
| Affected Products | 43463 | Initiative | No | Product list |
| Portfolio Priority | 45761 | Initiative | No | Priority level |
| Vertical Owner | 42960 | All issues | Recommended | Team/person name |

## Creating Issues with MCP

### Basic Issue Creation

```typescript
// Épica (NOT "Epic")
{
  "project_key": "MYSTORES",
  "summary": "Implement accident investigation workflow",
  "issue_type": "Épica",
  "description": "Complete workflow for investigating workplace accidents",
  "additional_fields": {
    "customfield_11762": "Implement accident investigation workflow"  // MUST match summary
  }
}

// Historia (User Story)
{
  "project_key": "MYSTORES",
  "summary": "Como gerente quiero ver reportes de accidentes para tomar decisiones",
  "issue_type": "Historia",
  "description": "Dashboard with accident statistics and trends"
}

// Task (Technical)
{
  "project_key": "MYSTORES",
  "summary": "Refactor accident form validation logic",
  "issue_type": "Task",
  "description": "Extract validation to separate module"
}

// Bug
{
  "project_key": "MYSTORES",
  "summary": "Export button fails when no data selected",
  "issue_type": "Bug",
  "description": "Clicking export with empty selection throws error",
  "additional_fields": {
    "customfield_10824": "Produccion"  // Bug Environment (REQUIRED)
  }
}

// Sub-tarea (CRITICAL: requires parent)
{
  "project_key": "MYSTORES",
  "summary": "Implement API endpoint for accident report creation",
  "issue_type": "Sub-tarea",
  "additional_fields": {
    "parent": "MYSTORES-456",  // Parent issue key (REQUIRED)
    "duedate": "2026-02-15"      // REQUIRED for corrective actions
  }
}
```

### Validation Before Creation

Always validate fields using the validation script:

```python
from scripts.validate_issue_fields import JiraFieldValidator

issue_data = {
    "summary": "Create mobile payment flow",
    "issuetype": {"name": "Historia"},
    "priority": {"name": "A (Muy Importante)"}
}

result = JiraFieldValidator.validate_issue_fields(issue_data)
# Returns: {"valid": bool, "errors": [], "warnings": []}
```

## Workflow States

**Valid states**: 
- Open
- Analyzing
- Backlog
- Ready to Start
- Prioritized
- In Progress
- Ready to Verify
- Deployed
- Closed
- Epic Refinement
- Discarded
- To deploy
- Delayed

## Priority Levels

- **A++ (Bloqueo)**: Blocking - production down, critical issue
- **A+ (Crítico)**: Critical - affects paid features, no workaround
- **A (Muy Importante)**: Very Important - major feature
- **B (Importante)**: Important - enhancement
- **C (Menor)**: Minor - cosmetic, low impact
- **D (Trivial)**: Trivial - nice to have

## JQL Query Patterns

See `references/jql-guide.md` for comprehensive JQL patterns:

```jql
# Find all sub-tareas of an issue
parent = MYSTORES-123

# Find bugs in production
project = MYSTORES AND type = Bug AND customfield_10824 = "Produccion"

# Find issues without duedate
project = MYSTORES AND duedate is EMPTY AND type = "Sub-tarea"

# Find all issues in current sprint
project = MYSTORES AND sprint in openSprints()

# Find épicas without epic name
project = MYSTORES AND type = Épica AND customfield_11762 is EMPTY
```

## Field Validation Patterns

### Summary Field
```
Pattern: 1-200 characters
Requirements: 
- Non-empty
- No leading/trailing whitespace
- Should be descriptive and unique
```

### Description Field
```
Pattern: 0-5000 characters
Format: Supports markdown/rich text
```

### Date Field (duedate)
```
Format: YYYY-MM-DD (ISO 8601)
Example: 2025-12-31
Required for: Corrective action sub-tasks
```

### Parent Issue Key (for Sub-tareas)
```
Format: PROJECT-NUMBER
Pattern: ^[A-Z]+-\d+$
Example: MYSTORES-123
Validation: Issue must exist in Jira
```

## Common Patterns

### Pattern 1: Create Épica with Sub-tareas

```typescript
// Step 1: Create Épica
const epic = await createIssue({
  project_key: "MYSTORES",
  summary: "Mobile payment integration",
  issue_type: "Épica",
  additional_fields: {
    customfield_11762: "Mobile payment integration"  // MUST match summary
  }
});

// Step 2: Create Sub-tareas
await createIssue({
  project_key: "MYSTORES",
  summary: "Implement Stripe API integration",
  issue_type: "Sub-tarea",
  additional_fields: {
    parent: epic.key  // e.g., MYSTORES-789
  }
});
```

### Pattern 2: Create Bug with Environment

```typescript
await createIssue({
  project_key: "MYSTORES",
  summary: "Login fails with SSO redirect",
  issue_type: "Bug",
  description: "Steps to reproduce:\n1. Click SSO login\n2. Redirects to error page",
  additional_fields: {
    customfield_10824: "Produccion",  // Bug Environment
    customfield_42960: "Authentication Team"  // Vertical Owner
  }
});
```

### Pattern 3: Create Corrective Action Sub-tarea

```typescript
await createIssue({
  project_key: "MYSTORES",
  summary: "Install safety guards on machinery",
  issue_type: "Sub-tarea",
  additional_fields: {
    parent: "MYSTORES-456",  // Parent accident investigation
    duedate: "2026-03-01"      // REQUIRED for corrective actions
  }
});
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| VALIDATION_ERROR | Missing or invalid required field | Check required fields for issue type |
| ISSUE_TYPE_ERROR | Invalid issue type for project | Use "Épica" not "Epic", check valid types |
| CUSTOM_FIELD_ERROR | Invalid custom field value | Verify field exists and value is valid |
| AUTH_ERROR | Authentication failure | Verify Jira credentials/token |
| WORKFLOW_ERROR | Illegal state transition | Check valid transitions with get_transitions |
| NOT_FOUND_ERROR | Issue/user/resource not found | Verify issue key format and existence |

## Validation Script Usage

The skill includes a Python validator that can be run locally:

```bash
# Validate issue fields before creation
python scripts/validate_issue_fields.py

# Example programmatic usage
from scripts.validate_issue_fields import JiraFieldValidator

issue = {
    "summary": "Test issue",
    "issuetype": {"name": "Sub-tarea"},
    "parent": "MYSTORES-123"
}

result = JiraFieldValidator.validate_issue_fields(issue)
if not result["valid"]:
    for error in result["errors"]:
        print(f"Error in {error['field']}: {error['error']}")
```

## Resources

- **Field Reference**: See `references/field-reference.md` for complete field documentation
- **Validation Rules**: See `references/validation-rules.md` for all validation rules
- **JQL Guide**: See `references/jql-guide.md` for query patterns
- **Validation Script**: `scripts/validate_issue_fields.py`
- **JQL Builder**: `scripts/build_jql_query.py`

## Best Practices

1. **Always validate before creating** - Use the validation script to catch errors early
2. **Use "Épica" not "Epic"** - Critical for MYSTORES project
3. **Set Epic Name for Épicas** - Must exactly match summary
4. **Set Bug Environment** - Required for all bugs
5. **Include parent for Sub-tareas** - Cannot exist without parent
6. **Set duedate for corrective actions** - Required for sub-tareas in accident investigations
7. **Assign bugs to QA** - Project requirement
8. **Populate Vertical Owner** - Helps with classification and reporting
9. **Use descriptive summaries** - 1-200 chars, clear and unique
10. **Add comments before closing** - Minimum 2 comments required

## Keywords
jira, issue, epic, épica, historia, task, bug, subtarea, sub-tarea, validation, pplwebmyst, custom fields
