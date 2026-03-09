# Using Templates Tutorial

**Accelerate your Olimpus setup with pre-configured meta-agent templates.**

This tutorial will guide you through discovering, using, and customizing templates for common development patterns, languages, workflows, team sizes, and project domains.

---

## Table of Contents

- [What Are Templates?](#what-are-templates)
- [Why Use Templates?](#why-use-templates)
- [Browsing Templates](#browsing-templates)
- [Quick Start: Using a Template](#quick-start-using-a-template)
- [Template Categories](#template-categories)
- [Merging Multiple Templates](#merging-multiple-templates)
- [Customizing Templates](#customizing-templates)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## What Are Templates?

Templates are pre-configured meta-agent definitions that save you time by providing battle-tested routing configurations. Instead of writing routing rules from scratch, you can:

1. **Browse templates** by category (language, workflow, team, domain)
2. **Copy relevant templates** to your project
3. **Customize** as needed for your specific needs

Each template includes:
- Intelligent routing rules for common patterns
- Specialized prompts optimized for the use case
- Project context matchers for automatic detection
- Example prompts showing typical usage

---

## Why Use Templates?

| Benefit | Description |
|---------|-------------|
| **Immediate productivity** | Start with working configurations |
| **Best practices** | Templates follow proven patterns |
| **Reduced complexity** | No need to design routing rules from scratch |
| **Consistency** | Standardized approaches across projects |
| **Learning resource** | See examples of well-structured configurations |

---

## Browsing Templates

Templates are organized into four categories in the `templates/` directory:

### 📁 Directory Structure

```
templates/
├── language/     # Programming language templates
├── workflow/     # Development methodology templates
├── team/         # Team size and collaboration templates
└── domain/       # Project architecture and domain templates
```

### Available Templates

#### Language Templates (`templates/language/`)

| Template | Description | Ecosystems |
|----------|-------------|------------|
| `python-dev.jsonc` | Python development | Django, FastAPI, Flask, Pandas, PyTorch |
| `typescript-dev.jsonc` | TypeScript/JavaScript | React, Next.js, Node.js, Express, NestJS |
| `rust-dev.jsonc` | Rust development | Tokio, Actix, Axum, Diesel |
| `go-dev.jsonc` | Go development | Gin, Echo, standard library |

#### Workflow Templates (`templates/workflow/`)

| Template | Description | Focus |
|----------|-------------|-------|
| `debugger.jsonc` | Systematic debugging | Error analysis, root cause, logs |
| `refactor.jsonc` | Code refactoring | Code quality, patterns, optimization |
| `tdd.jsonc` | Test-driven development | Testing, TDD, pytest |

#### Team Templates (`templates/team/`)

| Template | Description | Best For |
|----------|-------------|----------|
| `solo-dev.jsonc` | Solo developer | Individual projects, freelancers |
| `small-team.jsonc` | Small team collaboration | Startups, small companies |
| `enterprise.jsonc` | Enterprise governance | Large organizations |

#### Domain Templates (`templates/domain/`)

| Template | Description | Use Cases |
|----------|-------------|-----------|
| `monorepo.jsonc` | Monorepo routing | Turborepo, Nx, workspaces |
| `cicd.jsonc` | CI/CD workflows | GitHub Actions, GitLab CI |
| `api-first.jsonc` | API-first development | REST, GraphQL, OpenAPI |
| `data-analysis.jsonc` | Data analysis | Jupyter, Pandas, ML |
| `documentation.jsonc` | Documentation generation | Docusaurus, MDX, Sphinx |
| `security-audit.jsonc` | Security review | OWASP, dependencies, auth |

---

## Quick Start: Using a Template

### Step 1: Choose a Template

Select a template that matches your project:

- **Python project?** → `templates/language/python-dev.jsonc`
- **TypeScript project?** → `templates/language/typescript-dev.jsonc`
- **Monorepo?** → `templates/domain/monorepo.jsonc`
- **Small team?** → `templates/team/small-team.jsonc`

### Step 2: Copy to Your Project

```bash
# Copy template to project root
cp templates/language/python-dev.jsonc olimpus.jsonc

# Or copy to user config
cp templates/workflow/debugger.jsonc ~/.config/opencode/olimpus.jsonc
```

### Step 3: Verify the Configuration

```bash
# Validate the configuration
bun run olimpus validate olimpus.jsonc
```

### Step 4: Start Using the Template

```bash
# Use the meta-agent from the template
@python Create a Django model for user profiles
@python Build a FastAPI endpoint with Pydantic validation
@python Optimize this pandas operation for performance
```

---

## Template Categories

### 📝 Language Templates

Language templates provide intelligent routing for specific programming languages and their ecosystems.

#### Python Development Template

The `python-dev.jsonc` template includes:

- **Framework detection**: Django, FastAPI, Flask
- **Data science routing**: Pandas, NumPy, PyTorch, TensorFlow
- **ML workflow support**: scikit-learn, Jupyter notebooks
- **PEP 8 style enforcement**: Python coding standards
- **pytest TDD workflow**: Test-driven development

**Example prompts**:
```
Create a Django model for user profiles with proper relationships
Build a FastAPI endpoint with Pydantic validation
Optimize this pandas operation for performance
Set up a pytest suite for my Flask app
```

#### TypeScript Development Template

The `typescript-dev.jsonc` template includes:

- **Framework detection**: React, Vue, Angular, Next.js
- **Backend frameworks**: Node.js, Express, NestJS
- **Type error resolution**: TypeScript-specific routing
- **Tooling integration**: ESLint, Prettier, Vite, Webpack
- **Testing patterns**: Vitest, Jest integration

**Example prompts**:
```
Create a React hook for managing form state
Build a Next.js API route with TypeScript
Fix this TypeScript error in the user service
Add tests to the authentication module
```

---

### 🔧 Workflow Templates

Workflow templates optimize for specific development methodologies and processes.

#### Debugger Template

The `debugger.jsonc` template routes debugging tasks systematically:

```jsonc
{
  "meta_agents": {
    "debugger": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "oracle", "explore", "librarian", "metis"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["null pointer", "undefined", "nullreference"],
            "mode": "any"
          },
          "target_agent": "oracle",
          "config_overrides": {
            "prompt": "You are a null reference debugging expert..."
          }
        },
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["stack trace", "traceback", "call stack"],
            "mode": "any"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "You are a stack trace analysis expert..."
          }
        }
        // ... more rules
      ]
    }
  }
}
```

**Usage**:
```
@debugger Debug this null pointer error in the user service
@debugger Analyze this stack trace and find the root cause
@debugger Fix the race condition in payment processing
```

#### TDD Template

The `tdd.jsonc` template enforces test-driven development:

- **Test-first workflow**: Failing test → passing test
- **Test organization**: describe, test, it patterns
- **Mock and stub strategies**: Isolation patterns
- **Coverage optimization**: Meaningful test coverage

**Usage**:
```
@tdd Implement the user service using TDD
@tdd Add tests for the authentication flow
@tdd Write a failing test for the new feature
```

---

### 👥 Team Templates

Team templates are optimized for different team sizes and collaboration models.

#### Solo Developer Template

The `solo-dev.jsonc` template emphasizes:

- **Rapid development**: Get features working quickly
- **Autonomy**: Self-contained solutions without team dependencies
- **Pragmatic testing**: Appropriate test coverage for solo work
- **Full-stack awareness**: Handle frontend, backend, and deployment

**Usage**:
```
@solo Build a simple REST API for a todo app
@solo Debug why my authentication isn't working
@solo Plan the architecture for a SaaS MVP
```

#### Small Team Template

The `small-team.jsonc` template emphasizes:

- **Code review focus**: Team-oriented code quality
- **Collaboration patterns**: Shared codebase practices
- **Documentation emphasis**: Team knowledge sharing
- **PR workflow support**: Efficient code reviews

**Usage**:
```
@team Review this PR for the user feature
@team Add inline comments to explain this complex logic
@team Create a pull request template for the team
```

---

### 🌐 Domain Templates

Domain templates for specific project architectures and business domains.

#### Monorepo Template

The `monorepo.jsonc` template provides:

- **Package-aware routing**: Detects which package you're working in
- **Language-based routing**: Different rules for TypeScript, Rust, Go, Python
- **Cross-package coordination**: Handles changes that affect multiple packages
- **Build system integration**: Works with Turborepo, Nx, workspaces

**Usage**:
```
@monorepo Add a user profile card component to the web package
@monorepo Create a DELETE /api/users/:id endpoint in the API package
@monorepo Update the User interface to include a phoneNumber field in the shared types
```

#### CI/CD Template

The `cicd.jsonc` template provides:

- **GitHub Actions workflow routing**: Automation patterns
- **GitLab CI patterns**: GitLab-specific workflows
- **Docker container optimization**: Efficient builds
- **Deployment strategies**: Safe rollout patterns

**Usage**:
```
@cicd Create a GitHub Action for running tests on push
@cicd Set up a production deployment workflow
@cicd Optimize Docker image build time
```

---

## Merging Multiple Templates

You can combine multiple templates to create a comprehensive configuration.

### Example: Python Project with TDD and Monorepo

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",

  "meta_agents": {
    // Python language routing
    "python": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle", "librarian"],
      "routing_rules": [
        // Copy rules from python-dev.jsonc
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["django", "model", "view", "migrate"],
            "mode": "any"
          },
          "target_agent": "sisyphus"
        }
        // ... more rules
      ]
    },

    // TDD workflow
    "tdd": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus"],
      "routing_rules": [
        // Copy rules from tdd.jsonc
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["test", "spec", "mock", "stub"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "variant": "tdd"
          }
        }
      ]
    },

    // Monorepo coordination
    "monorepo": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle"],
      "routing_rules": [
        // Copy rules from monorepo.jsonc
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/web/package.json"]
          },
          "target_agent": "hephaestus"
        }
      ]
    }
  },

  "settings": {
    "max_delegation_depth": 3
  }
}
```

---

## Customizing Templates

After copying a template, customize it to fit your specific needs.

### 1. Rename the Meta-Agent

```jsonc
{
  "meta_agents": {
    // Rename to match your preference
    "backend": {
      // ... configuration from python-dev.jsonc
    }
  }
}
```

### 2. Add Custom Routing Rules

```jsonc
{
  "meta_agents": {
    "python": {
      "routing_rules": [
        // ... existing rules ...

        // Add custom rule for your project
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["app/models.py"],
            "has_deps": ["django"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Follow our company's Django model conventions: use abstract base classes for common fields, implement soft deletes, and always include created_at/updated_at timestamps."
          }
        }
      ]
    }
  }
}
```

### 3. Update Prompts to Match Your Standards

```jsonc
{
  "routing_rules": [
    {
      "matcher": {
        "type": "keyword",
        "keywords": ["test", "spec"],
        "mode": "any"
      },
      "target_agent": "sisyphus",
      "config_overrides": {
        "prompt": "Follow our testing conventions: use pytest fixtures for setup, arrange-act-assert structure, and aim for 80%+ coverage."
      }
    }
  ]
}
```

### 4. Add Project-Specific Matchers

```jsonc
{
  "routing_rules": [
    {
      "matcher": {
        "type": "project_context",
        "has_files": ["custom-framework.config.js"],
        "has_deps": ["@company/custom-framework"]
      },
      "target_agent": "sisyphus",
      "config_overrides": {
        "prompt": "You are an expert in our internal custom framework. Follow the framework's conventions as documented in our internal wiki."
      }
    }
  ]
}
```

---

## Real-World Examples

### Example 1: Full-Stack JavaScript Monorepo

A team building a monorepo with a Next.js frontend and Express backend:

```jsonc
{
  "meta_agents": {
    // Merged from typescript-dev.jsonc and monorepo.jsonc
    "monorepo": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle", "atlas", "librarian"],
      "routing_rules": [
        // Frontend routing
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["apps/web/package.json", "packages/web/package.json"],
            "has_deps": ["react", "@vitejs/plugin-react", "next"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "React/TypeScript frontend specialist. Build with TypeScript, hooks, and modern React patterns.",
            "variant": "react"
          }
        },
        // Backend routing
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["apps/api/package.json", "packages/api/package.json"],
            "has_deps": ["express", "fastify", "nest"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Node.js API specialist. Build REST endpoints with Express/Fastify or NestJS.",
            "variant": "nodejs"
          }
        }
      ]
    }
  }
}
```

### Example 2: Small Team with Python Backend

A 5-person team building a Django API with React frontend:

```jsonc
{
  "meta_agents": {
    // Merged from python-dev.jsonc and small-team.jsonc
    "backend": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle", "librarian"],
      "routing_rules": [
        // Django rules from language template
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["django", "model", "view", "migrate"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Django expert. Follow Django best practices including proper model design, clean views, and efficient queries. Write code that teammates can review and maintain.",
            "variant": "django"
          }
        },
        // Code review rules from team template
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["review", "code review", "pr review"],
            "mode": "any"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "You are reviewing code for a small team. Provide constructive, helpful feedback. Focus on correctness, readability, and maintainability. Be mindful that your teammates are working under time constraints."
          }
        }
      ]
    }
  }
}
```

---

## Best Practices

### 1. Start Simple

Begin with a single template that matches your primary use case:

```bash
# Solo developer with a Python web project?
cp templates/language/python-dev.jsonc olimpus.jsonc

# Working in a monorepo with TypeScript?
cp templates/domain/monorepo.jsonc olimpus.jsonc

# Need to debug issues?
cp templates/workflow/debugger.jsonc olimpus.jsonc
```

### 2. Validate Configuration

Always validate after copying templates:

```bash
bun run olimpus validate olimpus.jsonc
```

### 3. Incremental Customization

Customize templates incrementally:

1. First, get the template working
2. Add your project-specific patterns
3. Adjust prompts to match your style
4. Iterate based on usage patterns

### 4. Use Analytics

Enable analytics to see which rules are firing:

```jsonc
{
  "settings": {
    "analytics": {
      "enabled": true
    }
  }
}
```

Review analytics to optimize routing rules:

```bash
bun run olimpus analytics show
```

### 5. Avoid Template Conflicts

When merging multiple templates:

- Rename meta-agents to avoid naming conflicts
- Use more specific keywords for disambiguation
- Leverage `project_context` matchers for clarity
- Consider using different meta-agents for different contexts

---

## Troubleshooting

### Template Not Matching

If routing doesn't work as expected:

1. **Check rule order** - First match wins
2. **Verify project context** - Ensure `has_files` paths match your structure
3. **Debug with analytics** - See which rules are firing
4. **Enable routing logs**:

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

### Multiple Templates Conflict

When merging templates with overlapping keywords:

1. Rename meta-agents to avoid conflicts
2. Use more specific keywords
3. Leverage `project_context` for disambiguation
4. Consider using different meta-agents for different contexts

### Template Too Generic

If a template doesn't match your needs well:

1. Copy the closest matching template
2. Add project-specific rules
3. Remove irrelevant rules
4. Adjust prompts to your standards

### Schema Validation Errors

If you encounter validation errors:

```bash
# Validate the configuration
bun run olimpus validate olimpus.jsonc

# Check schema reference
# Ensure $schema is present and valid
```

Common issues:
- Missing `$schema` field
- Invalid JSONC syntax (comments, trailing commas)
- Unknown matcher types
- Invalid target agent names

---

## Next Steps

Now that you understand how to use templates, explore more advanced topics:

- **[Templates Reference](../templates/README.md)** - Complete catalog of available templates
- **[Quickstart Tutorial](01-quickstart.md)** - Get started with basic Olimpus configuration
- **[Monorepo Routing Tutorial](02-monorepo-routing.md)** - Advanced monorepo setup
- **[Team Workflows Tutorial](03-team-workflows.md)** - Team-specific configurations
- **[API Reference](../API.md)** - Complete TypeScript API documentation
- **[Schema Reference](../SCHEMA.md)** - JSON Schema for configuration

---

## Contributing Templates

Have a useful template? Consider contributing it:

1. Follow the template structure with all required fields
2. Use clear, descriptive names and tags
3. Include multiple examples showing common use cases
4. Write comprehensive documentation explaining the template's purpose
5. Test thoroughly with the validator: `bun run olimpus validate templates/your-template.jsonc`

Submit your template as a pull request to help other developers!

---

## See Also

- [GitHub Repository](https://github.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS)
- [oh-my-opencode Documentation](https://github.com/code-yeongyu/oh-my-opencode)
- [Templates Catalog](../templates/README.md)
