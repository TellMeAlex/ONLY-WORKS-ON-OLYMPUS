# Troubleshooting

**Common problems, their causes, and solutions for Olimpus Plugin.**

This guide helps you diagnose and fix issues with Olimpus configuration, routing, and integration with oh-my-opencode.

---

## Table of Contents

- [Configuration Issues](#configuration-issues)
  - [Config Not Loading](#config-not-loading)
  - [Invalid olimpus config Error](#invalid-olimpus-config-error)
  - [JSONC Parse Error](#jsonc-parse-error)
  - [Config Not Merging Correctly](#config-not-merging-correctly)
- [Routing Issues](#routing-issues)
  - [Routing Not Matching](#routing-not-matching)
  - [Always Routes to Same Agent](#always-routes-to-same-agent)
  - [Regex Not Matching](#regex-not-matching)
  - [Project Context Not Detected](#project-context-not-detected)
- [Circular Dependency Issues](#circular-dependency-issues)
  - [Circular Dependency Detected Error](#circular-dependency-detected-error)
  - [Max Delegation Depth Exceeded](#max-delegation-depth-exceeded)
- [Agent Reference Issues](#agent-reference-issues)
  - [Invalid Agent Reference Error](#invalid-agent-reference-error)
  - [Meta-agent Not Registered Error](#meta-agent-not-registered-error)
- [Performance Issues](#performance-issues)
  - [Slow Routing Decisions](#slow-routing-decisions)
  - [Regex Performance Warning](#regex-performance-warning)
- [Integration Issues](#integration-issues)
  - [Plugin Not Loading](#plugin-not-loading)
  - [Skills Not Loading](#skills-not-loading)
  - [Wizard Mode Issues](#wizard-mode-issues)
- [Debugging Tools](#debugging-tools)
  - [Using the Routing Logger](#using-the-routing-logger)
  - [Validating Configuration](#validating-configuration)
  - [Testing Routing Rules](#testing-routing-rules)
- [Common Patterns and Gotchas](#common-patterns-and-gotchas)

---

## Configuration Issues

### Config Not Loading

**Symptoms:**
- Default configuration is used instead of your custom config
- Meta-agents are not available when running oh-my-opencode
- No error messages, but behavior is unexpected

**Causes:**
1. Config file is in wrong location
2. Config file has wrong name
3. Config file has syntax errors

**Solutions:**

#### 1. Verify Config Location

Olimpus searches for config in this order (first found wins):

```bash
# Check project root config (highest priority)
test -f ./olimpus.jsonc && echo "Found: ./olimpus.jsonc"

# Check user config (fallback)
test -f ~/.config/opencode/olimpus.jsonc && echo "Found: ~/.config/opencode/olimpus.jsonc"
```

Your config should be in one of these locations:
- `./olimpus.jsonc` (project root - highest priority)
- `~/.config/opencode/olimpus.jsonc` (user config - fallback)

#### 2. Verify File Name

Ensure the file is named exactly `olimpus.jsonc` (not `olimpus.json` or `config.jsonc`).

```bash
# List JSONC files in current directory
ls -la *.jsonc
```

#### 3. Check for Syntax Errors

If your config has syntax errors, it will silently fail to load. Validate it:

```bash
# Validate your config
bun run olimpus validate ./olimpus.jsonc
```

---

### Invalid olimpus config Error

**Symptoms:**
```
Error: Invalid olimpus config:
  meta_agents.my_agent.delegates_to.0 - Invalid enum value. Expected 'oracle', received 'unknown'
```

**Causes:**
- Schema validation failed
- Invalid enum values
- Missing required fields
- Incorrect data types

**Solutions:**

#### 1. Check the Error Message

The error message tells you exactly which field is invalid:

```
meta_agents.my_agent.delegates_to.0 - Invalid enum value
```

This means: In `meta_agents.my_agent.delegates_to[0]`, the value is not a valid agent name.

#### 2. Verify Valid Agent Names

Valid builtin agents are: `sisyphus`, `hephaestus`, `oracle`, `librarian`, `explore`, `multimodal-looker`, `metis`, `momus`, `atlas`, `prometheus`.

```jsonc
// ❌ INVALID - "unknown" is not a valid agent
{
  "meta_agents": {
    "my_agent": {
      "delegates_to": ["unknown"],  // Invalid agent name
      "routing_rules": []
    }
  }
}

// ✅ VALID
{
  "meta_agents": {
    "my_agent": {
      "delegates_to": ["oracle", "sisyphus"],  // Valid builtin agents
      "routing_rules": []
    }
  }
}
```

#### 3. Check Required Fields

Each meta-agent requires these fields:

```jsonc
{
  "meta_agents": {
    "my_agent": {
      "base_model": "claude-3-5-sonnet-20241022",  // Required
      "delegates_to": ["oracle"],                      // Required
      "routing_rules": [{                              // Required
        "matcher": { "type": "always" },
        "target_agent": "oracle"
      }]
    }
  }
}
```

#### 4. Use Schema Validation

Add the `$schema` reference for IDE validation:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",
  "meta_agents": { /* ... */ }
}
```

---

### JSONC Parse Error

**Symptoms:**
```
Error: JSONC parse error in /path/to/olimpus.jsonc:
  Offset 123 (line 10): error code 3
```

**Causes:**
- Invalid JSON syntax
- Missing commas
- Trailing commas (not allowed in strict JSON)
- Unclosed brackets or braces
- Invalid escape sequences

**Solutions:**

#### 1. Check for Common Syntax Errors

```jsonc
// ❌ INVALID - Missing comma
{
  "meta_agents": {
    "atenea": { /* ... */ }
    "hermes": { /* ... */ }  // Missing comma between objects
  }
}

// ✅ VALID - Proper comma placement
{
  "meta_agents": {
    "atenea": { /* ... */ },
    "hermes": { /* ... */ }
  }
}
```

#### 2. Use a JSON Validator

Copy your config to a JSON validator to find syntax errors:

```bash
# Use jq to validate JSON syntax
cat ./olimpus.jsonc | jq . > /dev/null
```

#### 3. Check for Invalid Characters

```jsonc
// ❌ INVALID - Unescaped quotes in string
{
  "meta_agents": {
    "agent": {
      "prompt_template": "Say "hello" to user"  // Unescaped quotes
    }
  }
}

// ✅ VALID - Properly escaped quotes
{
  "meta_agents": {
    "agent": {
      "prompt_template": "Say \"hello\" to user"  // Escaped quotes
    }
  }
}
```

---

### Config Not Merging Correctly

**Symptoms:**
- User config is not being overridden by project config
- Expected values are missing from merged config
- Arrays are being merged instead of replaced

**Causes:**
- Misunderstanding of merge behavior
- Arrays are replaced, not merged
- Project config path is incorrect

**Solutions:**

#### 1. Understand Merge Behavior

- **Objects:** Deep merged (project config overrides user config)
- **Arrays:** Replaced entirely (not merged)

```jsonc
// User config: ~/.config/opencode/olimpus.jsonc
{
  "meta_agents": {
    "atenea": {
      "base_model": "claude-3-5-sonnet-20241022",
      "temperature": 0.5
    }
  }
}

// Project config: ./olimpus.jsonc
{
  "meta_agents": {
    "atenea": {
      "temperature": 0.3  // Overrides user config value
    }
  }
}

// Result: temperature is 0.3, base_model is from user config
```

#### 2. Verify Config Search Order

Project config has higher priority than user config. Check which config is being used:

```bash
# Find which config file is being used
# Project config takes precedence
if [ -f "./olimpus.jsonc" ]; then
  echo "Using: ./olimpus.jsonc (project config)"
elif [ -f "$HOME/.config/opencode/olimpus.jsonc" ]; then
  echo "Using: ~/.config/opencode/olimpus.jsonc (user config)"
else
  echo "No config found - using defaults"
fi
```

#### 3. Array Replacement Behavior

```jsonc
// User config
{
  "skills": ["skill-a.md", "skill-b.md"]
}

// Project config
{
  "skills": ["skill-c.md"]
}

// Result: Only ["skill-c.md"] - arrays are replaced, not merged
```

If you want to merge arrays, include all values in the project config:

```jsonc
// Project config with merged skills
{
  "skills": ["skill-a.md", "skill-b.md", "skill-c.md"]
}
```

---

## Routing Issues

### Routing Not Matching

**Symptoms:**
- Prompt is not being routed as expected
- Always routes to fallback agent
- Specific rules are never triggered

**Causes:**
1. Matcher type doesn't match the prompt
2. Rule order is incorrect (first match wins)
3. Case sensitivity issues
4. Prompt preprocessing differences

**Solutions:**

#### 1. Test Individual Matchers

```typescript
import { evaluateMatcher } from "olimpus-plugin/agents/routing";

// Test keyword matcher
const keywordMatcher = {
  type: "keyword" as const,
  keywords: ["bug", "error", "fix"],
  mode: "any" as const
};

const context = {
  prompt: "Fix the bug in the login system",
  projectDir: "/path/to/project"
};

const matched = evaluateMatcher(keywordMatcher, context);
console.log("Matched:", matched); // Should be true
```

#### 2. Check Rule Order

Rules are evaluated in order, and the first match wins:

```jsonc
{
  "routing_rules": [
    // ❌ WRONG - This rule catches everything first
    {
      "matcher": { "type": "always" },
      "target_agent": "fallback"
    },
    {
      "matcher": {
        "type": "keyword",
        "keywords": ["bug", "error"]
      },
      "target_agent": "debugger"  // Never reached!
    }
  ]
}

// ✅ CORRECT - Specific rules first, fallback last
{
  "routing_rules": [
    {
      "matcher": {
        "type": "keyword",
        "keywords": ["bug", "error"]
      },
      "target_agent": "debugger"  // Matched first
    },
    {
      "matcher": { "type": "always" },
      "target_agent": "fallback"
    }
  ]
}
```

#### 3. Check Case Sensitivity

Keyword matchers are case-insensitive, but regex matchers are not (unless you use the `i` flag):

```jsonc
// Keyword matcher - case-insensitive
{
  "matcher": {
    "type": "keyword",
    "keywords": ["DEBUG"]  // Matches "debug", "DEBUG", "Debug"
  },
  "target_agent": "debugger"
}

// Regex matcher - case-sensitive by default
{
  "matcher": {
    "type": "regex",
    "pattern": "^debug",  // Only matches "debug", not "DEBUG"
    "flags": "i"  // Add this flag for case-insensitive matching
  },
  "target_agent": "debugger"
}
```

#### 4. Enable Debug Mode

Use the routing logger to see which rules are being evaluated:

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "console",
      "debug_mode": true  // Show all evaluations
    }
  }
}
```

Output will show:
```
[Olimpus] Evaluating routing rules for prompt: "Fix the bug"
[Olimpus]   Rule 1: keyword [bug, error] - NOT MATCHED
[Olimpus]   Rule 2: always - MATCHED
[Olimpus] Routing to: fallback
```

---

### Always Routes to Same Agent

**Symptoms:**
- All prompts route to the same agent regardless of content
- Specific rules never trigger

**Causes:**
- `always` matcher is placed too early
- All other matchers are failing
- Fallback rule is missing or misplaced

**Solutions:**

#### 1. Move `always` Matcher to End

The `always` matcher should always be the last rule as a fallback:

```jsonc
{
  "routing_rules": [
    // Specific rules first
    {
      "matcher": {
        "type": "keyword",
        "keywords": ["bug", "error", "fix"]
      },
      "target_agent": "debugger"
    },
    {
      "matcher": {
        "type": "keyword",
        "keywords": ["docs", "documentation"]
      },
      "target_agent": "researcher"
    },
    // Fallback last
    {
      "matcher": { "type": "always" },
      "target_agent": "default"
    }
  ]
}
```

#### 2. Check Why Other Rules Fail

Enable debug mode to see why rules are not matching:

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "debug_mode": true
    }
  }
}
```

#### 3. Verify Keyword Matcher Mode

```jsonc
// ❌ WRONG - "all" mode requires ALL keywords
{
  "matcher": {
    "type": "keyword",
    "keywords": ["bug", "error", "fix"],
    "mode": "all"  // Requires prompt to contain ALL three words
  }
}

// ✅ CORRECT - "any" mode matches ANY keyword
{
  "matcher": {
    "type": "keyword",
    "keywords": ["bug", "error", "fix"],
    "mode": "any"  // Matches if ANY keyword is present
  }
}
```

---

### Regex Not Matching

**Symptoms:**
- Regex matcher never triggers
- Expected patterns are not recognized

**Causes:**
- Regex pattern is incorrect
- Missing regex flags
- Pattern doesn't match actual prompt format
- Regex syntax errors

**Solutions:**

#### 1. Test Regex Pattern

Test your regex against actual prompts:

```javascript
// Test in browser console or Node.js
const pattern = /^(design|ui|component|button|form|style)/i;
const prompt = "Design a new button component";
console.log(pattern.test(prompt)); // true or false
```

#### 2. Add the Case-Insensitive Flag

```jsonc
// ❌ WRONG - Case-sensitive (only matches lowercase)
{
  "matcher": {
    "type": "regex",
    "pattern": "^(design|ui|component)"
  }
}

// ✅ CORRECT - Case-insensitive with "i" flag
{
  "matcher": {
    "type": "regex",
    "pattern": "^(design|ui|component)",
    "flags": "i"  // Case-insensitive
  }
}
```

#### 3. Check Anchors

Regex anchors can cause patterns to fail:

```jsonc
// ❌ WRONG - ^ anchor requires pattern at START of prompt
{
  "matcher": {
    "type": "regex",
    "pattern": "^button"  // Only matches "Design a button" not "Create a new button"
  }
}

// ✅ CORRECT - No anchor matches anywhere in prompt
{
  "matcher": {
    "type": "regex",
    "pattern": "\\bbutton\\b"  // Word boundary matches anywhere
  }
}
```

#### 4. Escape Special Characters

```jsonc
// ❌ WRONG - Unescaped special characters
{
  "matcher": {
    "type": "regex",
    "pattern": "C:\Users\Name"  // Invalid regex syntax
  }
}

// ✅ CORRECT - Properly escaped
{
  "matcher": {
    "type": "regex",
    "pattern": "C:\\\\Users\\\\Name"  // Double-escaped for JSON
  }
}
```

---

### Project Context Not Detected

**Symptoms:**
- `project_context` matcher never triggers
- Project files/deps are not recognized

**Causes:**
- Files/dependencies paths are incorrect
- `projectFiles` not provided in routing context
- Dependency names don't match

**Solutions:**

#### 1. Verify Project File Paths

```jsonc
// Check what files actually exist
{
  "matcher": {
    "type": "project_context",
    "has_files": ["package.json"]  // Must be exact file name in project root
  }
}
```

```bash
# List files in project root to verify names
ls -la
```

#### 2. Verify Dependency Names

```jsonc
// Check what's actually in package.json
{
  "matcher": {
    "type": "project_context",
    "has_deps": ["vitest", "jest"]  // Must match package.json names exactly
  }
}
```

```bash
# Check dependencies in package.json
cat package.json | jq '.dependencies, .devDependencies'
```

#### 3. Provide Project Context in Routing

The routing context must include project information:

```typescript
const context: RoutingContext = {
  prompt: "Write tests",
  projectDir: "/path/to/project",
  projectFiles: ["package.json", "src/index.ts"],  // Required for project_context
  projectDeps: ["vitest", "react"]               // Required for project_context
};
```

#### 4. Check Nested Files

`has_files` matches files in project root, not nested paths:

```jsonc
// ❌ WRONG - Nested path won't match
{
  "matcher": {
    "type": "project_context",
    "has_files": ["src/index.ts"]  // Won't match nested files
  }
}

// ✅ CORRECT - Root files only
{
  "matcher": {
    "type": "project_context",
    "has_files": ["package.json", "tsconfig.json"]
  }
}
```

---

## Circular Dependency Issues

### Circular Dependency Detected Error

**Symptoms:**
```
Error: Circular dependency detected: "agent_a" can route to "agent_b" which can route back to "agent_a"
```

**Causes:**
- Meta-agents delegate to each other in a loop
- Routing creates an infinite cycle

**Solutions:**

#### 1. Identify the Circular Dependency

The error message shows which agents are involved:

```
Circular dependency: "agent_a" -> "agent_b" -> "agent_a"
```

This means:
- `agent_a` delegates to `agent_b`
- `agent_b` can route back to `agent_a`

#### 2. Break the Cycle

Remove one of the delegation paths:

```jsonc
// ❌ INVALID - Circular dependency
{
  "meta_agents": {
    "agent_a": {
      "delegates_to": ["agent_b"],
      "routing_rules": [{
        "matcher": { "type": "always" },
        "target_agent": "agent_b"
      }]
    },
    "agent_b": {
      "delegates_to": ["agent_a"],
      "routing_rules": [{
        "matcher": { "type": "always" },
        "target_agent": "agent_a"
      }]
    }
  }
}

// ✅ CORRECT - Break the cycle by routing to builtin agent
{
  "meta_agents": {
    "agent_a": {
      "delegates_to": ["agent_b"],
      "routing_rules": [{
        "matcher": { "type": "always" },
        "target_agent": "agent_b"
      }]
    },
    "agent_b": {
      "delegates_to": ["oracle"],  // Route to builtin, not agent_a
      "routing_rules": [{
        "matcher": { "type": "always" },
        "target_agent": "oracle"
      }]
    }
  }
}
```

#### 3. Use Hierarchical Design

Design meta-agents with a hierarchy, not a mesh:

```jsonc
// ✅ CORRECT - Hierarchical design
{
  "meta_agents": {
    "strategist": {
      "delegates_to": ["analyst", "planner"],
      "routing_rules": [/* ... */]
    },
    "analyst": {
      "delegates_to": ["oracle"],  // Only routes to builtin
      "routing_rules": [/* ... */]
    },
    "planner": {
      "delegates_to": ["prometheus"],  // Only routes to builtin
      "routing_rules": [/* ... */]
    }
  }
}
```

#### 4. Validate Before Running

```bash
# Check for circular dependencies
bun run olimpus validate ./olimpus.jsonc
```

---

### Max Delegation Depth Exceeded

**Symptoms:**
```
Error: Max delegation depth exceeded
```

**Causes:**
- Delegation chain is too long
- `max_delegation_depth` setting is too low
- Complex multi-agent routing

**Solutions:**

#### 1. Increase Max Delegation Depth

```jsonc
{
  "settings": {
    "max_delegation_depth": 5  // Increase from default of 3
  }
}
```

#### 2. Simplify Delegation Chain

Reduce the number of hops between agents:

```jsonc
// ❌ COMPLEX - 4-hop chain
{
  "meta_agents": {
    "level1": { "delegates_to": ["level2"] },
    "level2": { "delegates_to": ["level3"] },
    "level3": { "delegates_to": ["level4"] },
    "level4": { "delegates_to": ["oracle"] }
  }
}

// ✅ SIMPLE - 1-hop chain
{
  "meta_agents": {
    "router": {
      "delegates_to": ["oracle"],
      "routing_rules": [
        // All logic here, no intermediate agents
      ]
    }
  }
}
```

#### 3. Use Direct Builtin Agent Routing

Route directly to builtin agents instead of through intermediate meta-agents:

```jsonc
// ❌ INDIRECT - Routes through meta-agent
{
  "routing_rules": [{
    "matcher": { "type": "keyword", "keywords": ["bug"] },
    "target_agent": "my_debugger"  // Another meta-agent
  }]
}

// ✅ DIRECT - Routes to builtin agent
{
  "routing_rules": [{
    "matcher": { "type": "keyword", "keywords": ["bug"] },
    "target_agent": "oracle"  // Builtin agent
  }]
}
```

---

## Agent Reference Issues

### Invalid Agent Reference Error

**Symptoms:**
```
Error: Invalid agent reference: "unknown_agent" is not a recognized agent. Valid agents are: sisyphus, hephaestus, oracle, ...
```

**Causes:**
- Typo in agent name
- Using non-existent agent
- Case sensitivity issues

**Solutions:**

#### 1. Verify Valid Agent Names

Valid builtin agents are:
- `sisyphus` - Implementation/TDD
- `hephaestus` - Building
- `oracle` - Analysis/Strategy
- `librarian` - Documentation/Research
- `explore` - Code exploration
- `multimodal-looker` - Multimodal analysis
- `metis` - Technical analysis
- `momus` - Critique/Review
- `atlas` - Architecture analysis
- `prometheus` - Strategic planning

#### 2. Check for Typos

```jsonc
// ❌ WRONG - Typo in agent name
{
  "meta_agents": {
    "my_agent": {
      "delegates_to": ["oracl"],  // Typo: should be "oracle"
      "routing_rules": []
    }
  }
}

// ✅ CORRECT - Correct spelling
{
  "meta_agents": {
    "my_agent": {
      "delegates_to": ["oracle"],  // Correct name
      "routing_rules": []
    }
  }
}
```

#### 3. Case Sensitivity

Agent names are case-sensitive:

```jsonc
// ❌ WRONG - Wrong case
{
  "delegates_to": ["Oracle"]  // Should be lowercase "oracle"
}

// ✅ CORRECT - Correct case
{
  "delegates_to": ["oracle"]  // All lowercase
}
```

#### 4. Use Meta-Agent References

You can also reference other meta-agents (if they're defined):

```jsonc
{
  "meta_agents": {
    "frontend": {
      "delegates_to": ["builder", "analyst"]
    },
    "builder": {
      "delegates_to": ["hephaestus"]
    },
    "analyst": {
      "delegates_to": ["oracle"]
    }
  }
}
```

---

### Meta-agent Not Registered Error

**Symptoms:**
```
Error: Meta-agent "my_agent" not registered
```

**Causes:**
- Attempting to resolve a meta-agent that doesn't exist
- Typo in meta-agent name
- Config not loaded correctly

**Solutions:**

#### 1. Verify Meta-Agent Name

```jsonc
{
  "meta_agents": {
    "my_agent": { /* ... */ }  // Meta-agent name
  }
}
```

#### 2. Check Config Loading

Ensure config is loaded and meta-agents are registered:

```typescript
import { loadOlimpusConfig } from "olimpus-plugin/config/loader";

const config = await loadOlimpusConfig("/path/to/project");

console.log("Meta-agents:", Object.keys(config.meta_agents ?? {}));
// Should output: ["my_agent", ...]
```

#### 3. Use Correct Name When Resolving

```typescript
import { MetaAgentRegistry } from "olimpus-plugin/agents/registry";

const registry = new MetaAgentRegistry();

// Register meta-agent
registry.register("my_agent", agentDef);

// Resolve using the same name
const resolved = registry.resolve("my_agent", context);
```

---

## Performance Issues

### Slow Routing Decisions

**Symptoms:**
- Routing takes noticeable time before execution
- High CPU usage during routing
- Lag in oh-my-opencode responses

**Causes:**
- Complex regex patterns
- Many routing rules
- Inefficient matcher combinations

**Solutions:**

#### 1. Simplify Regex Patterns

```jsonc
// ❌ SLOW - Complex nested quantifiers
{
  "matcher": {
    "type": "regex",
    "pattern": "^(?:(?:[a-z]+)+)+$"  // Catastrophic backtracking risk
  }
}

// ✅ FAST - Simple pattern
{
  "matcher": {
    "type": "regex",
    "pattern": "^[a-z]+$"  // Simple and fast
  }
}
```

#### 2. Reduce Number of Rules

Use fewer, more specific rules:

```jsonc
// ❌ MANY RULES - 20 different keyword rules
{
  "routing_rules": [
    { "matcher": { "type": "keyword", "keywords": ["word1"] }, "target_agent": "agent1" },
    { "matcher": { "type": "keyword", "keywords": ["word2"] }, "target_agent": "agent2" },
    // ... 18 more rules
  ]
}

// ✅ FEWER RULES - One regex rule
{
  "routing_rules": [
    {
      "matcher": {
        "type": "regex",
        "pattern": "^(word1|word2|word3|...)$"
      },
      "target_agent": "agent"
    }
  ]
}
```

#### 3. Order Rules by Specificity

Place most specific rules first to short-circuit evaluation:

```jsonc
{
  "routing_rules": [
    // Most specific - exact match
    {
      "matcher": {
        "type": "regex",
        "pattern": "^fix authentication bug$"
      },
      "target_agent": "debugger"
    },
    // Less specific - keyword match
    {
      "matcher": {
        "type": "keyword",
        "keywords": ["bug"]
      },
      "target_agent": "debugger"
    },
    // Least specific - fallback
    {
      "matcher": { "type": "always" },
      "target_agent": "default"
    }
  ]
}
```

---

### Regex Performance Warning

**Symptoms:**
```
[WARNING] meta_agents.my_agent.routing_rules.0.matcher.pattern: Regex pattern may cause performance issues: Nested quantifiers can cause catastrophic backtracking
```

**Causes:**
- Nested quantifiers (`(a+)+`, `(.*)*`)
- Excessive alternation (`a|b|c|d|e|f|g|h|i|j`)
- Unbounded patterns (`.*`)
- Backreferences (`\1`)

**Solutions:**

#### 1. Fix Nested Quantifiers

```jsonc
// ❌ SLOW - Nested quantifier
{
  "matcher": {
    "type": "regex",
    "pattern": "(\\w+)+"
  }
}

// ✅ FAST - Single quantifier
{
  "matcher": {
    "type": "regex",
    "pattern": "\\w+"
  }
}
```

#### 2. Reduce Alternation Count

```jsonc
// ❌ WARNING - Too many alternations
{
  "matcher": {
    "type": "regex",
    "pattern": "a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z"
  }
}

// ✅ FAST - Use character class
{
  "matcher": {
    "type": "regex",
    "pattern": "[a-z]"
  }
}
```

#### 3. Avoid Unbounded Patterns

```jsonc
// ❌ WARNING - Unbounded dot star
{
  "matcher": {
    "type": "regex",
    "pattern": "^.*design.*$"  // Matches entire prompt
  }
}

// ✅ FAST - Be more specific
{
  "matcher": {
    "type": "regex",
    "pattern": "\\bdesign\\b"  // Matches word only
  }
}
```

#### 4. Use Keyword Matcher Instead

For simple keyword matching, use the keyword matcher:

```jsonc
// ❌ SLOW - Regex for simple keywords
{
  "matcher": {
    "type": "regex",
    "pattern": "bug|error|fix"
  }
}

// ✅ FAST - Keyword matcher
{
  "matcher": {
    "type": "keyword",
    "keywords": ["bug", "error", "fix"],
    "mode": "any"
  }
}
```

---

## Integration Issues

### Plugin Not Loading

**Symptoms:**
- Olimpus meta-agents not available
- oh-my-opencode behaves as if Olimpus is not installed

**Causes:**
- Plugin not registered in `.opencode.jsonc`
- Wrong module name
- Installation error

**Solutions:**

#### 1. Verify Plugin Registration

Check `.opencode.jsonc`:

```jsonc
{
  "plugins": [
    {
      "name": "olimpus",
      "module": "olimpus-plugin"
    }
  ]
}
```

#### 2. Verify Installation

```bash
# Check if olimpus-plugin is installed
bunpm list olimpus-plugin

# Reinstall if needed
bun install olimpus-plugin
```

#### 3. Check Module Resolution

Verify the module can be resolved:

```bash
# Try importing the plugin
node -e "console.log(require('olimpus-plugin'))"
```

---

### Skills Not Loading

**Symptoms:**
- Custom skills are not available
- `olimpus:` prefixed skills missing

**Causes:**
- Skill paths are incorrect
- Files don't exist
- Invalid skill format

**Solutions:**

#### 1. Verify Skill Paths

```jsonc
{
  "skills": [
    "docs/skills/my-skill.md",        // Relative to project root
    "/absolute/path/to/another.md"     // Absolute path
  ]
}
```

```bash
# Check if files exist
test -f docs/skills/my-skill.md && echo "Found" || echo "Not found"
```

#### 2. Check Skill Format

Skills must have YAML frontmatter:

```markdown
---
description: My custom skill
agent: oracle
model: claude-3-5-sonnet-20241022
---

Skill template content here.
```

#### 3. Verify Namespace Prefix

Skills are prefixed with `olimpus:` by default:

```jsonc
{
  "settings": {
    "namespace_prefix": "olimpus"
  }
}
```

Skill named `my-skill.md` becomes `olimpus:my-skill`.

---

### Wizard Mode Issues

**Symptoms:**
- Wizard starts unexpectedly
- Wizard doesn't start when expected
- Scaffolded config is incorrect

**Solutions:**

#### 1. Skip Wizard When Needed

Set environment variable to skip wizard:

```bash
export OLIMPUS_SKIP_WIZARD=1
```

#### 2. Verify Wizard Triggers

Wizard starts when:
- No config exists in project root
- No config exists in user directory
- `OLIMPUS_SKIP_WIZARD` is not set

#### 3. Re-run Wizard

Delete config and restart wizard:

```bash
rm ./olimpus.jsonc
# Restart oh-my-opencode - wizard will start
```

---

## Debugging Tools

### Using the Routing Logger

The routing logger provides detailed information about routing decisions.

#### Enable in Config

```jsonc
{
  "settings": {
    "routing_logger": {
      "enabled": true,
      "output": "console",     // or "file" or "disabled"
      "log_file": "olimpus-routing.log",
      "debug_mode": true       // Show all evaluations
    }
  }
}
```

#### Output Examples

**Basic mode:**
```
[Olimpus] Routed to: oracle (matcher: keyword, keywords: bug, error)
```

**Debug mode:**
```
[Olimpus] Evaluating routing rules for prompt: "Fix the bug"
[Olimpus]   Rule 0: keyword [bug, error] - MATCHED
[Olimpus]   Rule 1: complexity [high] - SKIPPED (already matched)
[Olimpus] Routing to: oracle
[Olimpus] Config overrides: { prompt: "You are a debugging expert" }
```

**File output:**
```
# olimpus-routing.log
2024-02-19T10:30:00Z [Olimpus] Routing to: oracle
2024-02-19T10:30:05Z [Olimpus] Routing to: sisyphus
```

---

### Validating Configuration

Use the built-in validator to check for errors.

#### Command Line

```bash
# Validate config file
bun run olimpus validate ./olimpus.jsonc

# Validate with specific checks
bun run olimpus validate ./olimpus.jsonc --check-circular --check-refs

# Validate example config
bun run olimpus validate ./example/olimpus.jsonc
```

#### Programmatic Validation

```typescript
import { loadOlimpusConfig } from "olimpus-plugin/config/loader";

try {
  const config = await loadOlimpusConfig("/path/to/project", {
    validate: true,
    checkCircularDependencies: true,
    checkAgentReferences: true,
    checkRegexPerformance: true
  });
  console.log("Config is valid!");
} catch (error) {
  console.error("Config validation failed:", error.message);
}
```

---

### Testing Routing Rules

Test your routing rules with sample prompts.

#### Test Script

```typescript
import { evaluateRoutingRules } from "olimpus-plugin/agents/routing";
import type { RoutingRule } from "olimpus-plugin/config/schema";

const rules: RoutingRule[] = [
  {
    matcher: { type: "keyword", keywords: ["bug", "error"], mode: "any" },
    target_agent: "debugger"
  },
  {
    matcher: { type: "always" },
    target_agent: "default"
  }
];

const prompts = [
  "Fix the bug in the login system",
  "Write documentation for the API",
  "Add a new feature"
];

for (const prompt of prompts) {
  const route = evaluateRoutingRules(rules, {
    prompt,
    projectDir: "/path/to/project"
  });

  console.log(`Prompt: "${prompt}"`);
  console.log(`Route: ${route?.target_agent ?? "No match"}`);
  console.log("---");
}
```

#### Expected Output

```
Prompt: "Fix the bug in the login system"
Route: debugger
---
Prompt: "Write documentation for the API"
Route: default
---
Prompt: "Add a new feature"
Route: default
---
```

---

## Common Patterns and Gotchas

### First Match Wins

Rules are evaluated in order. The first match wins, and remaining rules are skipped.

```jsonc
{
  "routing_rules": [
    // This matches "bug" but also "debug"
    { "matcher": { "type": "keyword", "keywords": ["bug"] }, "target_agent": "bugger" },
    // This never runs for prompts containing "bug"
    { "matcher": { "type": "keyword", "keywords": ["debug"] }, "target_agent": "debugger" }
  ]
}
```

**Solution:** Order rules from most specific to least specific.

### Keyword vs Regex

Use keyword matcher for simple word matching, regex for complex patterns.

```jsonc
// ❌ UNNECESSARY - Regex for simple keywords
{
  "matcher": {
    "type": "regex",
    "pattern": "\\b(bug|error|fix)\\b"
  }
}

// ✅ BETTER - Keyword matcher
{
  "matcher": {
    "type": "keyword",
    "keywords": ["bug", "error", "fix"],
    "mode": "any"
  }
}
```

### Always Include Fallback

Always end routing rules with an `always` matcher to prevent unmatched prompts.

```jsonc
{
  "routing_rules": [
    // Specific rules
    { "matcher": { "type": "keyword", "keywords": ["bug"] }, "target_agent": "debugger" },
    { "matcher": { "type": "keyword", "keywords": ["docs"] }, "target_agent": "researcher" },
    // ALWAYS include fallback
    { "matcher": { "type": "always" }, "target_agent": "default" }
  ]
}
```

### Config Merging Behavior

- **Objects:** Deep merged (project overrides user)
- **Arrays:** Replaced entirely

```jsonc
// User config
{
  "meta_agents": {
    "agent": { "temperature": 0.5 }
  },
  "skills": ["skill-a.md"]
}

// Project config
{
  "meta_agents": {
    "agent": { "temperature": 0.3 }  // Overrides user
  },
  "skills": ["skill-b.md"]  // Replaces user, not merged
}
```

### Case Sensitivity

- **Keywords:** Case-insensitive
- **Regex:** Case-sensitive unless `i` flag is set
- **Agent names:** Case-sensitive

```jsonc
{
  "routing_rules": [
    // Keyword - matches "BUG", "bug", "Bug"
    { "matcher": { "type": "keyword", "keywords": ["BUG"] }, "target_agent": "agent" },
    // Regex - only matches "bug" without flag
    { "matcher": { "type": "regex", "pattern": "^bug" }, "target_agent": "agent" },
    // Regex - matches "BUG", "bug", "Bug" with flag
    { "matcher": { "type": "regex", "pattern": "^bug", "flags": "i" }, "target_agent": "agent" }
  ]
}
```

---

## Getting Help

If you've tried the solutions above and still have issues:

1. **Enable debug mode** and share the output
2. **Run validator** and share the results: `bun run olimpus validate ./olimpus.jsonc`
3. **Check the logs** in `olimpus-routing.log` if file output is enabled
4. **Report issues** with:
   - Your `olimpus.jsonc` (redact sensitive info)
   - The error message
   - Expected vs actual behavior
   - Debug output

---

## See Also

- [README.md](../README.md) - Main project documentation
- [API Reference](./API.md) - Complete API documentation
- [Configuration](../README.md#configuration) - Configuration reference
- [Example Config](../example/olimpus.jsonc) - Full configuration example
