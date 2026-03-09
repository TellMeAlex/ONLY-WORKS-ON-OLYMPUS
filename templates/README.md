# Olimpus Meta-Agent Templates

**Pre-configured meta-agent definitions for common development workflows, languages, and project structures.**

This directory contains a collection of ready-to-use meta-agent templates that you can import into your `olimpus.jsonc` configuration. Each template is optimized for a specific use case and includes intelligent routing rules, specialized prompts, and examples.

---

## Overview

Templates are pre-configured meta-agents that save you time by providing battle-tested routing configurations. Instead of writing routing rules from scratch, you can:

1. **Browse templates** by category (language, workflow, team, domain)
2. **Copy relevant templates** to your project
3. **Customize** as needed for your specific needs

### Why Use Templates?

- **Immediate productivity**: Start with working configurations
- **Best practices**: Templates follow proven patterns
- **Reduced complexity**: No need to design routing rules from scratch
- **Consistency**: Standardized approaches across projects

---

## Template Structure

Each template file is a JSONC document with the following structure:

```jsonc
{
  // Template metadata
  "name": "template-name",
  "description": "Human-readable description",
  "category": "language|workflow|team|domain",
  "tags": ["tag1", "tag2"],

  // Meta-agent configuration
  "meta_agent": {
    "base_model": "claude-3-5-sonnet-20241022",
    "delegates_to": ["agent1", "agent2"],
    "routing_rules": [
      {
        "matcher": { /* matcher config */ },
        "target_agent": "target",
        "config_overrides": { /* optional overrides */ }
      }
    ],
    "prompt_template": "Template with {input} placeholder"
  },

  // Documentation and examples
  "documentation": "Detailed description...",
  "examples": ["Example prompt 1", "Example prompt 2"]
}
```

---

## Categories

### 📝 Language Templates

Specialized meta-agents for programming languages and their ecosystems.

| Template | Description | Frameworks |
|----------|-------------|------------|
| [python-dev.jsonc](./language/python-dev.jsonc) | Python development including Django, FastAPI, Flask, data science, and ML | Django, FastAPI, Flask, Pandas, NumPy, PyTorch, TensorFlow |
| [typescript-dev.jsonc](./language/typescript-dev.jsonc) | TypeScript/JavaScript development with React, Node.js, and modern tooling | React, Next.js, Vite, Node.js, Express |
| [rust-dev.jsonc](./language/rust-dev.jsonc) | Rust development with focus on safety, performance, and async patterns | Tokio, Actix, Axum, Diesel |
| [go-dev.jsonc](./language/go-dev.jsonc) | Go development with idiomatic patterns and concurrency | Gin, Echo, standard library |

#### Python Example

```bash
# Copy template to your project
cp templates/language/python-dev.jsonc olimpus.jsonc
```

```jsonc
{
  "meta_agents": {
    "python": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle", "librarian"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["django", "model", "view", "migrate"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "You are a Django expert. Follow Django best practices..."
          }
        }
        // ... more rules
      ]
    }
  }
}
```

---

### 🔧 Workflow Templates

Meta-agents optimized for specific development workflows and methodologies.

| Template | Description | Focus |
|----------|-------------|-------|
| [debugger.jsonc](./workflow/debugger.jsonc) | Systematic debugging including error analysis, root cause investigation, log analysis | Debugging strategies, error types |
| [refactor.jsonc](./workflow/refactor.jsonc) | Code refactoring and cleanup with focus on maintainability and performance | Code quality, patterns |
| [tdd.jsonc](./workflow/tdd.jsonc) | Test-driven development with test-first implementation | Testing, pytest, TDD |

#### Debugger Example

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
```

---

### 👥 Team Templates

Meta-agents optimized for different team sizes and collaboration models.

| Template | Description | Best For |
|----------|-------------|----------|
| [solo-dev.jsonc](./team/solo-dev.jsonc) | Solo developer with emphasis on autonomy and rapid development | Individual projects, freelancers |
| [small-team.jsonc](./team/small-team.jsonc) | Small teams with focus on collaboration and code review | Startups, small companies |
| [enterprise.jsonc](./team/enterprise.jsonc) | Enterprise environments with governance and process requirements | Large organizations |

#### Solo Developer Example

The solo-dev template emphasizes:

- **Rapid development**: Get features working quickly
- **Autonomy**: Self-contained solutions without team dependencies
- **Pragmatic testing**: Appropriate test coverage for solo work
- **Full-stack awareness**: Handle frontend, backend, and deployment

```jsonc
{
  "meta_agents": {
    "solo": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle", "metis", "explore", "librarian"],
      "routing_rules": [
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["build", "create", "implement", "add"],
            "mode": "any"
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "You are a solo developer building a feature quickly. Focus on getting functionality working first, then refine for quality."
          }
        }
        // ... more rules
      ]
    }
  }
}
```

---

### 🌐 Domain Templates

Meta-agents for specific domains and project architectures.

| Template | Description | Use Cases |
|----------|-------------|-----------|
| [monorepo.jsonc](./domain/monorepo.jsonc) | Monorepo routing with package-aware coordination | Turborepo, Nx, workspaces |
| [cicd.jsonc](./domain/cicd.jsonc) | CI/CD pipeline and deployment workflows | GitHub Actions, GitLab CI, Jenkins |
| [api-first.jsonc](./domain/api-first.jsonc) | API-first development with contract-driven design | REST, GraphQL, OpenAPI |
| [data-analysis.jsonc](./domain/data-analysis.jsonc) | Data analysis, visualization, and ML workflows | Jupyter, Pandas, ML |
| [documentation.jsonc](./domain/documentation.jsonc) | Documentation generation and maintenance | Docusaurus, MDX, Sphinx |
| [security-audit.jsonc](./domain/security-audit.jsonc) | Security review and vulnerability analysis | OWASP, dependencies, auth |

#### Monorepo Example

The monorepo template provides:

- **Package-aware routing**: Detects which package you're working in
- **Language-based routing**: Different rules for TypeScript, Rust, Go, Python
- **Cross-package coordination**: Handles changes that affect multiple packages
- **Build system integration**: Works with Turborepo, Nx, workspaces

```jsonc
{
  "meta_agents": {
    "monorepo": {
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["hephaestus", "sisyphus", "oracle", "atlas", "prometheus", "metis", "explore", "librarian"],
      "routing_rules": [
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/web/package.json", "apps/web/package.json"],
            "has_deps": ["react", "@vitejs/plugin-react", "next"]
          },
          "target_agent": "hephaestus",
          "config_overrides": {
            "prompt": "React/TypeScript frontend specialist. Build with TypeScript, hooks, and modern React patterns.",
            "variant": "react"
          }
        },
        {
          "matcher": {
            "type": "project_context",
            "has_files": ["packages/api/package.json", "apps/api/package.json"],
            "has_deps": ["express", "fastify", "nest"]
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Node.js API specialist. Build REST endpoints with Express/Fastify or NestJS.",
            "variant": "nodejs"
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
@monorepo Add a user profile card component to the web package
@monorepo Create a DELETE /api/users/:id endpoint in the API package
@monorepo Update the User interface to include a phoneNumber field in the shared types
```

---

## Using Templates

### Quick Start: Copy a Template

```bash
# Copy a template to your project root
cp templates/language/python-dev.jsonc olimpus.jsonc

# Or copy to your user config
cp templates/workflow/debugger.jsonc ~/.config/opencode/olimpus.jsonc
```

### Merge Multiple Templates

To use multiple templates together, merge their `meta_agent` definitions:

```jsonc
// olimpus.jsonc
{
  "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",

  "meta_agents": {
    // Merge language template
    "python": {
      // ... python-dev.jsonc meta_agent content
    },

    // Merge workflow template
    "debugger": {
      // ... debugger.jsonc meta_agent content
    },

    // Merge domain template
    "monorepo": {
      // ... monorepo.jsonc meta_agent content
    }
  },

  "settings": {
    "max_delegation_depth": 3
  }
}
```

### Customize Templates

After copying, customize the template to fit your needs:

1. **Adjust the name** to match your preferences
2. **Modify routing rules** for your specific patterns
3. **Update prompts** to match your coding standards
4. **Add custom matchers** for project-specific patterns

---

## Template Reference

### Language Templates

#### python-dev.jsonc

**Features:**
- Django model/view/template routing
- FastAPI async/await patterns
- Flask blueprint organization
- Data science (Pandas, NumPy) routing
- ML framework support (PyTorch, TensorFlow, scikit-learn)
- PEP 8 style enforcement
- pytest TDD workflow

**Examples:**
```
Create a Django model for user profiles with proper relationships
Build a FastAPI endpoint with Pydantic validation
Optimize this pandas operation for performance
Set up a pytest suite for my Flask app
```

#### typescript-dev.jsonc

**Features:**
- React component development
- Next.js routing and SSR
- Node.js API development
- Type error resolution
- ESLint/Prettier integration
- Testing with Vitest/Jest

**Examples:**
```
Create a React hook for managing form state
Build a Next.js API route with TypeScript
Fix this TypeScript error in the user service
Add tests to the authentication module
```

#### rust-dev.jsonc

**Features:**
- Safe Rust patterns
- Async/await with Tokio
- Web framework routing (Actix, Axum)
- Error handling with `Result` types
- Zero-cost abstractions
- Cargo workflow integration

**Examples:**
```
Create an async handler for user registration
Fix this borrow checker error
Implement a WebSocket connection handler
Add tests to the data processing module
```

#### go-dev.jsonc

**Features:**
- Idiomatic Go patterns
- Concurrent programming with goroutines
- Web framework routing (Gin, Echo)
- Error handling best practices
- Standard library focus
- `go test` workflow

**Examples:**
```
Create a REST API for managing users
Add goroutine-based parallel processing
Fix this race condition in the cache
Write unit tests for the auth package
```

### Workflow Templates

#### debugger.jsonc

**Features:**
- Error type detection (null references, race conditions, type errors)
- Stack trace analysis
- Log analysis and interpretation
- Systematic debugging approach
- Performance debugging
- Regression analysis

**Examples:**
```
Debug this null pointer error in the user service
Analyze this stack trace and find the root cause
Fix the race condition in payment processing
Why is this API request timing out?
Debug the memory leak in the dashboard component
```

#### refactor.jsonc

**Features:**
- Code smell detection
- Pattern extraction
- Complexity reduction
- Performance optimization
- Type safety improvements
- Test refactoring

**Examples:**
```
Refactor this component to use composition
Extract a reusable hook from this logic
Simplify the conditional logic in the validator
Improve the performance of this data processing
```

#### tdd.jsonc

**Features:**
- Test-first development
- Failing test to passing test
- Test organization (describe, test, it)
- Mock and stub strategies
- Coverage optimization
- Regression prevention

**Examples:**
```
Implement the user service using TDD
Add tests for the authentication flow
Write a failing test for the new feature
Refactor to improve test coverage
```

### Team Templates

#### solo-dev.jsonc

**Features:**
- Rapid development focus
- Full-stack awareness
- Pragmatic testing
- Deployment guidance
- Feature evaluation

**Examples:**
```
Build a simple REST API for a todo app
Debug why my authentication isn't working
Plan the architecture for a SaaS MVP
Add testing to this existing codebase
Deploy this Next.js app to production
```

#### small-team.jsonc

**Features:**
- Code review focus
- Collaboration patterns
- Documentation emphasis
- PR workflow support
- Team conventions

**Examples:**
```
Review this PR for the user feature
Add inline comments to explain this complex logic
Create a pull request template for the team
Set up automated testing for CI
```

#### enterprise.jsonc

**Features:**
- Governance and compliance
- Approval workflows
- Security first
- Audit trails
- Process enforcement

**Examples:**
```
Implement role-based access control
Add audit logging to the payment service
Ensure GDPR compliance for user data
Create an approval workflow for production changes
```

### Domain Templates

#### monorepo.jsonc

**Features:**
- Package-aware routing (web, api, core, cli)
- Language-based routing
- Cross-package coordination
- Turborepo/Nx integration
- Workspace protocol support
- Dependency update handling

**Examples:**
```
Add a user profile card component to the web package
Create a DELETE /api/users/:id endpoint in the API package
Update the User interface to include a phoneNumber field in the shared types
Fix TypeScript error in the core package's user types
Optimize Turborepo build configuration for better caching
```

#### cicd.jsonc

**Features:**
- GitHub Actions workflow routing
- GitLab CI patterns
- Docker container optimization
- Deployment strategies
- Environment configuration
- Secrets management

**Examples:**
```
Create a GitHub Action for running tests on push
Set up a production deployment workflow
Optimize Docker image build time
Add environment variable validation to CI
```

#### api-first.jsonc

**Features:**
- OpenAPI specification routing
- Contract-first development
- REST/GraphQL routing
- API versioning
- Client generation
- Mock server setup

**Examples:**
```
Define the OpenAPI spec for the user API
Generate TypeScript types from the OpenAPI schema
Create a mock server for frontend development
Version the API endpoints for backward compatibility
```

#### data-analysis.jsonc

**Features:**
- Jupyter notebook routing
- Pandas workflow optimization
- Data visualization
- ML model development
- Feature engineering
- Model deployment

**Examples:**
```
Analyze the user engagement dataset
Create a visualization of monthly revenue
Build a classification model for user churn
Optimize this pandas data processing pipeline
```

#### documentation.jsonc

**Features:**
- Markdown/MDX routing
- Docusaurus integration
- API documentation generation
- Tutorial writing
- Code examples
- Multi-language docs

**Examples:**
```
Generate API documentation from TypeScript types
Create a getting started tutorial
Set up Docusaurus for the project
Add code examples to the user guide
```

#### security-audit.jsonc

**Features:**
- OWASP Top 10 routing
- Dependency vulnerability scanning
- Authentication/authorization patterns
- Secrets detection
- Penetration testing guidance
- Security headers configuration

**Examples:**
```
Audit the authentication flow for security issues
Check dependencies for known vulnerabilities
Implement CSRF protection for the API
Add security headers to the web server
Review the code for SQL injection risks
```

---

## Customizing Templates

### Adding Custom Rules

Add project-specific routing rules:

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
            "prompt": "Custom: Follow our company's Django model conventions..."
          }
        }
      ]
    }
  }
}
```

### Combining Categories

Mix and match templates from different categories:

```jsonc
{
  "meta_agents": {
    "python-web": {
      // From python-dev.jsonc
      "base_model": "claude-3-5-sonnet-20241022",
      "delegates_to": ["sisyphus", "hephaestus", "oracle"],
      "routing_rules": [
        // Django rules from language template
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["django", "model", "view"],
            "mode": "any"
          },
          "target_agent": "sisyphus",
          "config_overrides": {
            "prompt": "Django expert..."
          }
        },
        // Debugging rules from workflow template
        {
          "matcher": {
            "type": "keyword",
            "keywords": ["debug", "bug", "error"],
            "mode": "any"
          },
          "target_agent": "metis",
          "config_overrides": {
            "prompt": "Debugging expert..."
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

### 5. Share Customizations

If you create a useful variant, consider sharing it as a new template:

1. Copy your custom `meta_agent` definition
2. Add `name`, `description`, `category`, `tags`
3. Include `documentation` and `examples`
4. Submit as a contribution

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

---

## Contributing Templates

To contribute a new template:

1. **Follow the template structure** with all required fields
2. **Use clear, descriptive names** and tags
3. **Include multiple examples** showing common use cases
4. **Write comprehensive documentation** explaining the template's purpose
5. **Test thoroughly** with the validator: `bun run olimpus validate templates/your-template.jsonc`

Submit your template as a pull request to help other developers!

---

## See Also

- [Main README](../README.md) - Olimpus plugin documentation
- [Quickstart Tutorial](../docs/tutorials/01-quickstart.md) - Get started with Olimpus
- [Configuration Reference](../docs/API.md) - Full API documentation
- [Schema Reference](../SCHEMA.md) - JSON schema for configuration
