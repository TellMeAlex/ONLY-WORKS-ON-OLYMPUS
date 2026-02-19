# Team Workflows

**Collaborative development patterns for teams using Olimpus.**

This tutorial teaches you how to set up Olimpus for team collaboration, including shared configurations, role-based routing, and workflow automation.

---

## Table of Contents

- [What are Team Workflows?](#what-are-team-workflows)
- [When to Use](#when-to-use)
- [Team Configuration Strategy](#team-configuration-strategy)
- [Role-Based Routing](#role-based-routing)
- [Shared Configuration Management](#shared-configuration-management)
- [Workflow Automation](#workflow-automation)
- [Onboarding New Team Members](#onboarding-new-team-members)
- [Common Scenarios](#common-scenarios)

---

## What are Team Workflows?

Team workflows extend Olimpus from individual productivity to collaborative development. They enable teams to:

1. **Standardize routing** - Consistent agent selection across the team
2. **Share knowledge** - Centralized configuration captures team conventions
3. **Role specialization** - Different meta-agents for different team roles
4. **Workflow consistency** - Repeatable patterns for common tasks

### Benefits

| Benefit | Description |
|---------|-------------|
| **Onboard Faster** | New team members get optimal routing from day one |
| **Consistent Quality** | All team members use the same conventions |
| **Reduced Friction** | No need to remember which agent to use for what |
| **Knowledge Sharing** | Configuration documents team best practices |
| **Easy Updates** | Update routing rules in one place for the whole team |

---

## When to Use

Team workflows are valuable when your team:

- Has **multiple developers** using oh-my-opencode
- Needs **consistent code standards** across the codebase
- Wants to **share routing expertise** via configuration
- Uses **different roles** (frontend, backend, DevOps, etc.)
- Experiences **onboarding friction** for new team members
- Wants to **document conventions** as executable configuration

---

## Team Configuration Strategy

Olimpus offers two approaches for team configuration:

### 1. Shared Project Configuration

Create `olimpus.jsonc` in your project root and commit it to version control:

```
my-project/
├── .git/
├── olimpus.jsonc           # ← Team's shared configuration
├── package.json
└── src/
```

**Advantages:**
- Automatically included in the repo
- Works for all team members immediately after clone
- Version-controlled changes to routing rules
- No setup required beyond `bun install`

**Use when:** Your team works on a single codebase.

### 2. User-Global Configuration

Place `olimpus.jsonc` in `~/.config/opencode/olimpus.jsonc`:

```
~/.config/opencode/
└── olimpus.jsonc           # ← Your personal configuration
```

**Advantages:**
- Applies to all your projects
- Personal preferences don't affect team config
- Override team defaults locally

**Use when:** You work across multiple projects with different needs.

### 3. Hybrid Approach (Recommended)

Commit a base configuration to the repo, allow personal overrides:

```
my-project/
├── olimpus.jsonc           # ← Team's base configuration
├── .git/
│   └── .gitignore          # ← Ignore personal overrides
└── src/
```

**Olimpus searches in this order:**
1. `./olimpus.jsonc` (project root - highest priority)
2. `~/.config/opencode/olimpus.jsonc` (user config - fallback)

**Use when:** You want team defaults with personal flexibility.

---

## Role-Based Routing

Define meta-agents that match your team's roles and expertise areas.

### Example Team Structure

```
Team Roles:
├── Frontend Specialists   → React, Vue, TypeScript, UI/UX
├── Backend Specialists    → Node.js, Python, APIs, databases
├── DevOps Engineers       → Infrastructure, CI/CD, Docker
├── QA Engineers          → Testing, quality assurance
└── Architects            → System design, technical strategy
```

### Role-Based Meta-Agents

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",

  "meta_agents": {
    // ============================================================================
    // FRONTEND TEAM
    // ============================================================================
    "frontend_team": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "metis"],
      "prompt_template": "You are part of the frontend team. Follow our team conventions: TypeScript strict mode, Tailwind CSS, and component composition patterns.",
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["component", "hook", "react", "vue", "ui", "styling"],
            "mode": "any"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "Frontend specialist: Build reusable components using TypeScript and our design system.",
            "variant": "frontend-component"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "testing"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Frontend testing specialist: Use @testing-library and Vitest. Test user behavior, not implementation.",
            "variant": "frontend-testing"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["bug", "fix", "debug", "error"],
            "mode": "any"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "Frontend debugger: Identify and fix UI/UX issues with browser devtools in mind.",
            "variant": "frontend-debug"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "hephaestus"
        }
      ]
    },

    // ============================================================================
    // BACKEND TEAM
    // ============================================================================
    "backend_team": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "atlas"],
      "prompt_template": "You are part of the backend team. Follow our conventions: REST API design, input validation, error handling, and database transactions.",
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["endpoint", "route", "api", "controller", "service"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Backend specialist: Build RESTful endpoints with proper validation and error handling.",
            "variant": "backend-api"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["database", "sql", "query", "migration", "schema"],
            "mode": "any"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "Database architect: Design efficient queries with proper indexing and transactions.",
            "variant": "database"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "integration"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Backend testing specialist: Write integration tests using supertest and test databases.",
            "variant": "backend-testing"
          }
        },
        {
          "matcher": {
            "type": "always"
          },
          "target_agent": "sisyphus"
        }
      ]
    },

    // ============================================================================
    // DEVOPS TEAM
    // ============================================================================
    "devops_team": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["atlas", "prometheus", "sisyphus"],
      "prompt_template": "You are part of the DevOps team. Follow our conventions: infrastructure as code, containerization, and automated CI/CD pipelines.",
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["docker", "container", "dockerfile", "compose"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Container specialist: Write Dockerfiles with multi-stage builds and minimal layers.",
            "variant": "docker"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["ci", "cd", "pipeline", "workflow", "github actions", "gitlab"],
            "mode": "any"
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "CI/CD architect: Design efficient pipelines with caching and parallel jobs.",
            "variant": "cicd"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["kubernetes", "k8s", "helm", "deployment"],
            "mode": "any"
          },
          "target_agent": "prometheus",
          "config_overrides": {
            "prompt": "Kubernetes specialist: Design deployments with health checks and rolling updates.",
            "variant": "k8s"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "atlas"
        }
      ]
    },

    // ============================================================================
    // QA TEAM
    // ============================================================================
    "qa_team": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "metis", "explore"],
      "prompt_template": "You are part of the QA team. Focus on comprehensive testing, edge cases, and quality assurance.",
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "coverage", "e2e", "end-to-end"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "QA specialist: Write comprehensive tests covering edge cases and error conditions.",
            "variant": "qa-testing"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["analyze", "audit", "review", "quality"],
            "mode": "any"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "Quality analyst: Review code for potential issues and suggest improvements.",
            "variant": "qa-audit"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["explore", "investigate", "reproduce"],
            "mode": "any"
          },
          "target_agent": "explore",
          "config_overrides": {
            "prompt": "QA explorer: Investigate codebase to understand behavior and identify test gaps.",
            "variant": "qa-explore"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "sisyphus"
        }
      ]
    },

    // ============================================================================
    // ARCHITECTS
    // ============================================================================
    "architect_team": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["oracle", "atlas", "prometheus"],
      "prompt_template": "You are part of the architecture team. Focus on system design, technical strategy, and long-term technical decisions.",
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["design", "architecture", "system", "scalable", "microservice"],
            "mode": "any"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "System architect: Design scalable, maintainable architecture considering trade-offs.",
            "variant": "architecture"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["strategy", "roadmap", "technical", "decision"],
            "mode": "any"
          },
          "target_agent": "prometheus",
          "config_overrides": {
            "prompt": "Technical strategist: Plan technical initiatives and phased implementation.",
            "variant": "strategy"
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["review", "audit", "evaluate", "assess"],
            "mode": "any"
          },
          "target_agent": "atlas",
          "config_overrides": {
            "prompt": "Design reviewer: Evaluate architectural proposals and identify risks.",
            "variant": "design-review"
          }
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "oracle"
        }
      ]
    },

    // ============================================================================
    // GENERAL ROUTER (Fallback)
    // ============================================================================
    "team_router": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["frontend_team", "backend_team", "devops_team", "qa_team", "architect_team"],
      "routing_rules": [
        // Automatically route based on file context
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/web/"]
          },
          "target_agent": "frontend_team"
        },
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/api/"]
          },
          "target_agent": "backend_team"
        },
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["docker/", ".github/workflows/"]
          },
          "target_agent": "devops_team"
        },
        {
          "matcher": { "type": "always" },
          "target_agent": "metis"
        }
      ]
    }
  },

  // ============================================================================
  // TEAM SETTINGS
  // ============================================================================
  "settings": {
    "namespace_prefix": "team",
    "max_delegation_depth": 4,
    "background_parallelization": {
      "enabled": true,
      "max_parallel_tasks": 3
    },
    "routing_logger": {
      "enabled": true,
      "output": "console",
      "debug_mode": false
    },
    "lsp_refactoring_preferred": true,
    "aggressive_comment_pruning": true
  }
}
```

---

## Shared Configuration Management

### Version Control Best Practices

Commit your team's `olimpus.jsonc` to version control:

```bash
git add olimpus.jsonc
git commit -m "docs: add team Olimpus configuration"
```

### Configuration Review Process

Treat configuration changes like code changes:

```bash
# Create a branch for config updates
git checkout -b feature/update-olimpus-routing

# Make your changes
# ... edit olimpus.jsonc

# Validate before committing
bun run olimpus validate olimpus.jsonc

# Commit and open PR
git add olimpus.jsonc
git commit -m "feat: add new routing rule for authentication tasks"
git push origin feature/update-olimpus-routing
```

### Documenting Changes

Add comments in your configuration to explain routing decisions:

```jsonc
{
  "meta_agents": {
    "frontend_team": {
      // Added for better styling consistency across the team
      // TODO: Consider adding Tailwind-specific variant
      "routing_rules": [
        // Route styling tasks to specialist (approved in team meeting 2024-01-15)
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["styling", "css", "tailwind"],
            "mode": "any"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "variant": "styling"
          }
        }
      ]
    }
  }
}
```

---

## Workflow Automation

### PR Template Integration

Add Olimpus routing hints to your PR template:

```markdown
## Which meta-agent should handle this?

- [ ] @frontend_team - UI components, styling, frontend features
- [ ] @backend_team - APIs, database, backend features
- [ ] @devops_team - Infrastructure, CI/CD, Docker
- [ ] @qa_team - Testing, quality assurance
- [ ] @architect_team - Architecture, system design

## Task Description

<!-- Describe the task and relevant context -->

## Files Changed

<!-- List affected files to help with routing -->
```

### Commit Message Conventions

Use structured commit messages that help Olimpus route:

```
feat(frontend): add user profile card component
fix(backend): resolve database connection leak issue
chore(devops): optimize Docker build caching
test(qa): add e2e tests for checkout flow
docs: update team routing rules
```

### Issue Tracker Integration

Reference Olimpus meta-agents in issues:

```markdown
## Task

Implement new authentication flow with OAuth2.

## Approach

@architect_team Design the authentication architecture
@backend_team Implement the API endpoints
@frontend_team Build the login UI components
@qa_team Write integration tests
```

---

## Onboarding New Team Members

### Quick Reference Card

Create a quick reference for new team members:

```markdown
# Olimpus Team Quick Reference

## Available Meta-Agents

| Agent | Purpose | Example Prompt |
|-------|---------|----------------|
| `@frontend_team` | React, UI, styling | Add a user profile card |
| `@backend_team` | APIs, database | Create POST /users endpoint |
| `@devops_team` | Docker, CI/CD | Set up GitHub Actions workflow |
| `@qa_team` | Testing, quality | Add integration tests |
| `@architect_team` | Architecture, design | Design microservices architecture |

## Common Patterns

### New Feature
```
@frontend_team Add [feature description]
```

### Bug Fix
```
@backend_team Fix [issue description]
```

### Testing
```
@qa_team Add tests for [component/feature]
```

### Architecture
```
@architect_team Design [system/feature] architecture
```

## Debug Mode

Enable routing logging:
```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "console",
      "debug_mode": true
    }
  }
}
```
```

### Onboarding Checklist

Add to your team's onboarding process:

- [ ] Install oh-my-opencode
- [ ] Install olimpus-plugin: `bun install olimpus-plugin`
- [ ] Clone the repo (includes `olimpus.jsonc`)
- [ ] Run `bun install`
- [ ] Try basic prompts with different meta-agents
- [ ] Read the team's Olimpus configuration
- [ ] Review team coding conventions in routing rules

---

## Common Scenarios

### Scenario 1: Frontend Feature Request

**Team Member:** "I need to add a user avatar component."

**Action:**
```
@frontend_team Create a reusable Avatar component with fallback image support
```

**Routing:**
1. Keyword matcher detects "component"
2. Routes to `hephaestus` with `frontend-component` variant
3. Agent builds component following team conventions (TypeScript, Tailwind)

**Result:**
- Component created in correct directory structure
- Proper TypeScript types
- Styled with Tailwind
- Includes example usage

---

### Scenario 2: Backend API Development

**Team Member:** "We need a new API for user preferences."

**Action:**
```
@backend_team Create GET/PUT /api/users/:id/preferences endpoints
```

**Routing:**
1. Keyword matcher detects "endpoint" and "api"
2. Routes to `sisyphus` with `backend-api` variant
3. Agent builds endpoints with validation and error handling

**Result:**
- RESTful endpoints following team conventions
- Input validation with Zod or similar
- Proper error responses
- Documentation in comments

---

### Scenario 3: Quality Assurance Testing

**Team Member:** "We need to test the new checkout flow."

**Action:**
```
@qa_team Add comprehensive tests for the checkout flow
```

**Routing:**
1. Keyword matcher detects "test"
2. Routes to `sisyphus` with `qa-testing` variant
3. Agent writes tests covering edge cases

**Result:**
- Integration tests for happy path
- Error condition tests
- Edge case coverage
- Clear test organization

---

### Scenario 4: Infrastructure Setup

**Team Member:** "We need to set up Docker for the project."

**Action:**
```
@devops_team Create Docker configuration for the application
```

**Routing:**
1. Keyword matcher detects "docker"
2. Routes to `sisyphus` with `docker` variant
3. Agent creates Dockerfile and docker-compose

**Result:**
- Multi-stage Dockerfile
- docker-compose.yml for development
- Environment variable configuration
- Build optimization

---

### Scenario 5: System Design Decision

**Team Member:** "We need to design a real-time notification system."

**Action:**
```
@architect_team Design a scalable real-time notification architecture
```

**Routing:**
1. Keyword matcher detects "design" and "architecture"
2. Routes to `oracle` with `architecture` variant
3. Agent analyzes trade-offs and proposes solution

**Result:**
- Architecture document
- Technology recommendations (WebSockets, SSE, etc.)
- Scalability considerations
- Implementation roadmap

---

## Best Practices

### 1. Use Descriptive Agent Names

Choose names that clearly indicate the team role:

```jsonc
// Good
"frontend_team"
"backend_team"
"devops_team"

// Avoid
"agent1"
"meta-agent-2"
"worker"
```

### 2. Document Routing Decisions

Add comments explaining why certain routing rules exist:

```jsonc
{
  "routing_rules": [
    // Frontend testing uses component testing strategy
    // Decision made in team sprint retro 2024-01-10
    {
      "matcher": { "type": "keyword", "keywords": ["test"], "mode": "any" },
      "target_agent": "sisyphus",
      "config_overrides": { "variant": "frontend-testing" }
    }
  ]
}
```

### 3. Use Variants for Specialization

Leverage `config_overrides.variant` to provide context:

```jsonc
{
  "config_overrides": {
    "variant": "react-component"  // More specific than just "react"
  }
}
```

### 4. Validate Before Committing

Always validate configuration changes:

```bash
bun run olimpus validate olimpus.jsonc
```

### 5. Enable Debug Mode During Development

When setting up or troubleshooting, enable debug logging:

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "console",
      "debug_mode": true
    }
  }
}
```

### 6. Review Configuration Regularly

Schedule periodic team reviews of `olimpus.jsonc` to:
- Remove obsolete routing rules
- Update conventions as team practices evolve
- Add new patterns discovered during development

---

## Troubleshooting

### Team members getting different routing

**Problem:** Different team members experience different routing behavior.

**Solutions:**
1. Verify everyone's `olimpus.jsonc` matches the committed version
2. Check for personal overrides in `~/.config/opencode/olimpus.jsonc`
3. Ensure all team members are using the same oh-my-opencode version

### Configuration changes not taking effect

**Problem:** Updated routing rules aren't working as expected.

**Solutions:**
1. Run validation: `bun run olimpus validate olimpus.jsonc`
2. Restart your oh-my-opencode session
3. Check for syntax errors in JSONC comments
4. Verify rule order (first match wins)

### New team member confused about which agent to use

**Problem:** New developers don't know which meta-agent to invoke.

**Solutions:**
1. Create a team quick reference card (see Onboarding section)
2. Add routing hints to PR templates
3. Document common patterns in team wiki
4. Use the general router as a fallback

### Too many meta-agents causing confusion

**Problem:** Team has created many meta-agents and it's hard to choose.

**Solutions:**
1. Consolidate similar roles (e.g., merge `ui_team` into `frontend_team`)
2. Use a general router that auto-selects based on context
3. Document when to use each agent
4. Consider reducing to 3-5 core roles

---

## Next Steps

- **[Quickstart Tutorial](01-quickstart.md)** - Get started with Olimpus basics
- **[Monorepo Routing](02-monorepo-routing.md)** - Advanced routing for multi-package projects
- **[API Reference](../API.md)** - Complete TypeScript API documentation
- **[Schema Reference](../SCHEMA.md)** - JSON Schema for configuration
- **[Configuration Example](../../example/olimpus.jsonc)** - Full example configuration

---

## See Also

- [GitHub Repository](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS)
- [oh-my-opencode Documentation](https://github.com/code-yeongyu/oh-my-opencode)
- [Team Workflow Best Practices](https://github.com/opencode-ai/oh-my-opencode/wiki)
