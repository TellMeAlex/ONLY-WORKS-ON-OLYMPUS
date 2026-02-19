# Tutorials

**Step-by-step guides for common Olimpus Plugin tasks and workflows.**

This directory contains practical tutorials that walk you through using Olimpus Plugin effectively, from getting started to advanced routing patterns.

---

## Overview

The tutorials are organized by complexity and cover real-world scenarios:

- **Beginner**: Get started with Olimpus and set up your first meta-agent
- **Intermediate**: Build complex routing rules for monorepos and team workflows
- **Advanced**: Language-specific routing and advanced pattern implementations

---

## Tutorial List

### 🚀 [01 - Quickstart Guide](./01-quickstart.md)

**Get started with Olimpus Plugin in 5 minutes.**

Learn how to:
- Install Olimpus Plugin
- Configure your first meta-agent
- Set up basic routing rules
- Test your configuration

**Time**: 10 minutes | **Level**: Beginner

---

### 🏗️ [02 - Monorepo Routing](./02-monorepo-routing.md)

**Configure intelligent routing for monorepo projects.**

Learn how to:
- Route requests based on package context
- Handle shared dependencies and libraries
- Set up package-specific meta-agents
- Optimize for multi-package workflows

**Time**: 20 minutes | **Level**: Intermediate

---

### 👥 [03 - Team Workflows](./03-team-workflows.md)

**Set up Olimpus for collaborative development.**

Learn how to:
- Share configuration across teams
- Define team-specific meta-agents
- Handle code review and debugging workflows
- Integrate with CI/CD pipelines

**Time**: 25 minutes | **Level**: Intermediate

---

### 🌐 [04 - Language-Specific Routing](./04-language-specific-routing.md)

**Create routing rules for different programming languages.**

Learn how to:
- Detect project languages from dependencies
- Set up language-specific matchers
- Configure optimal models per language
- Handle multi-language projects

**Time**: 20 minutes | **Level**: Advanced

---

### 🔮 [05 - Advanced Patterns](./05-advanced-patterns.md)

**Master complex routing and meta-agent patterns.**

Learn how to:
- Implement cascading routing rules
- Use project context for dynamic routing
- Build custom matcher combinations
- Handle edge cases and fallbacks

**Time**: 30 minutes | **Level**: Advanced

---

## Getting Started

If you're new to Olimpus, start with the **[Quickstart Guide](./01-quickstart.md)**. It covers everything you need to get up and running with your first meta-agent.

For more experienced users, jump directly to the tutorial that matches your use case:

- **Monorepo projects** → [Monorepo Routing](./02-monorepo-routing.md)
- **Team setup** → [Team Workflows](./03-team-workflows.md)
- **Multi-language codebases** → [Language-Specific Routing](./04-language-specific-routing.md)
- **Complex routing needs** → [Advanced Patterns](./05-advanced-patterns.md)

---

## Tutorial Structure

Each tutorial follows a consistent format:

1. **Prerequisites**: What you need before starting
2. **Learning Objectives**: What you'll achieve
3. **Step-by-Step Instructions**: Detailed implementation guide
4. **Code Examples**: Complete working examples
5. **Verification**: How to test your setup
6. **Common Issues**: Troubleshooting tips

---

## Related Documentation

- [Configuration](../README.md#configuration) - Full configuration reference
- [Meta-Agents](../README.md#meta-agents) - Meta-agent system overview
- [Routing Rules](../README.md#routing-rules) - Matcher types and usage
- [API Reference](../API.md) - Complete API documentation
- [Troubleshooting](../troubleshooting.md) - Common issues and solutions

---

## Need Help?

- Found an issue? Check [Troubleshooting](../troubleshooting.md)
- Want to contribute? See [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Questions? Open an issue on GitHub

---

## See Also

- [oh-my-opencode](https://github.com/opencode-ai/oh-my-opencode) - Base plugin framework
- [example/olimpus.jsonc](../../example/olimpus.jsonc) - Full configuration example
- [src/config/schema.ts](../../src/config/schema.ts) - Zod v4 config schema
