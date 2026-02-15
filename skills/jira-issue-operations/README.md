# Jira Issue Operations Skill

Complete Jira issue management for MYSTORES project with validation, custom fields, and project-specific rules.

## Overview

This skill provides comprehensive Jira issue management including:
- Creating and updating all issue types (Épica, Historia, Task, Bug, Sub-tarea, etc.)
- MYSTORES-specific custom fields and validation rules
- Field validation before issue creation
- JQL query patterns for finding issues
- Python scripts for validation and query building

## Version
2.0 - Migrated from agents repository with full MYSTORES integration

## Critical Rules

### ⚠️ Issue Type Names
- **NEVER use "Epic"** - ALWAYS use **"Épica"** (with accent)
- **NEVER use "Sub-task"** - ALWAYS use **"Sub-tarea"** (in Spanish)
- Valid types: `Épica`, `Historia`, `Task`, `Bug`, `Sub-tarea`, `Initiative`, `Spike`, `Strategic Theme`, `Design`

### 🔑 Required Fields by Type

| Issue Type | Required Fields | Notes |
|------------|----------------|-------|
| Épica | summary + customfield_11762 (Epic Name) | Epic Name MUST match summary |
| Bug | summary + customfield_10824 (Bug Environment) | MUST assign to QA team |
| Sub-tarea | summary + parent (issue key) | Corrective actions MUST have duedate |

## Custom Fields

| Field | customfield_* | Used in | Values |
|-------|---------------|---------|--------|
| Epic Name | 11762 | Épica | String matching summary |
| Bug Environment | 10824 | Bug | Produccion, Pre-produccion, Testing, Desarrollo |
| Sprint | 10009 | All | Sprint ID |
| Vertical Owner | 42960 | All | Team/person name |

## Quick Examples

### Create Épica
```typescript
{
  "project_key": "MYSTORES",
  "summary": "Mobile payment integration",
  "issue_type": "Épica",
  "additional_fields": {
    "customfield_11762": "Mobile payment integration"  // MUST match summary
  }
}
```

### Create Bug
```typescript
{
  "project_key": "MYSTORES",
  "summary": "Export button fails with empty data",
  "issue_type": "Bug",
  "additional_fields": {
    "customfield_10824": "Produccion"  // REQUIRED
  }
}
```

### Create Sub-task
```typescript
{
  "project_key": "MYSTORES",
  "summary": "Implement payment API endpoint",
  "issue_type": "Sub-task",
  "additional_fields": {
    "parent": "MYSTORES-456",  // REQUIRED
    "duedate": "2026-02-15"      // REQUIRED for corrective actions
  }
}
```

## Files

### References
- **field-reference.md** - Complete field documentation (standard + custom)
- **jql-guide.md** - JQL query patterns and examples
- **validation-rules.md** - Validation rules by issue type

### Scripts
- **validate_issue_fields.py** - Validate issue fields before creation
- **build_jql_query.py** - Build complex JQL queries programmatically

## Usage

```bash
# Validate issue before creation
python scripts/validate_issue_fields.py

# Programmatic validation
from scripts.validate_issue_fields import JiraFieldValidator

result = JiraFieldValidator.validate_issue_fields({
    "summary": "Test issue",
    "issuetype": {"name": "Sub-task"},
    "parent": "MYSTORES-123"
})
```

## Common JQL Queries

```jql
# Find sub-tasks of an issue
parent = MYSTORES-123

# Find bugs in production
type = Bug AND customfield_10824 = "Produccion"

# Find issues without duedate
type = "Sub-task" AND duedate is EMPTY

# Find épicas without epic name
type = Épica AND customfield_11762 is EMPTY
```

## Best Practices

1. ✅ Always use "Épica" not "Epic"
2. ✅ Validate fields before creating issues
3. ✅ Set Epic Name for Épicas (must match summary)
4. ✅ Set Bug Environment for all bugs
5. ✅ Set parent for all sub-tasks
6. ✅ Set duedate for corrective action sub-tasks
7. ✅ Assign bugs to QA team
8. ✅ Populate Vertical Owner for classification

## Author
Gentleman Programming - Version 2.0 - February 2026
