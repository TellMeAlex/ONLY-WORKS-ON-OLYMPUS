import { writeFileSync } from "fs";
import { join } from "path";
function generateOlimpusSchema() {
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json",
    title: "Olimpus Plugin Configuration",
    description:
      "Configuration schema for Olimpus meta-orchestrator plugin - extends oh-my-opencode",

    allOf: [
      {
        $ref: "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
      },
      {
        type: "object",
        properties: {
          meta_agents: {
            type: "object",
            title: "Meta-Agents",
            description:
              "Define custom meta-agents that route user requests to builtin agents",
            additionalProperties: {
              $ref: "#/definitions/MetaAgent",
            },
          },

          providers: {
            $ref: "#/definitions/ProviderConfig",
          },

          settings: {
            $ref: "#/definitions/OlimpusSettings",
          },

          skills: {
            type: "array",
            title: "Custom Skills",
            description:
              "Paths to skill definition files (relative to project root or absolute)",
            items: {
              type: "string",
            },
          },
        },
      },
    ],

    definitions: {
      MetaAgent: {
        type: "object",
        title: "Meta-Agent Definition",
        description:
          "A routing coordinator that delegates to builtin oh-my-opencode agents",
        required: ["base_model", "delegates_to", "routing_rules"],
        properties: {
          base_model: {
            type: "string",
            title: "Base Model",
            description: "LLM model to use (e.g., claude-3-5-sonnet-20241022)",
            examples: ["claude-3-5-sonnet-20241022", "gpt-4-turbo"],
          },

          delegates_to: {
            type: "array",
            title: "Delegates To",
            description:
              "Builtin agents this meta-agent can delegate to (must have >=1)",
            minItems: 1,
            items: {
              $ref: "#/definitions/BuiltinAgentName",
            },
          },

          routing_rules: {
            type: "array",
            title: "Routing Rules",
            description:
              "Rules evaluated in order; first match wins. Must have >=1",
            minItems: 1,
            items: {
              $ref: "#/definitions/RoutingRule",
            },
          },

          prompt_template: {
            type: "string",
            title: "Prompt Template",
            description: "Optional base system prompt for this meta-agent",
          },

          temperature: {
            type: "number",
            title: "Temperature",
            description:
              "LLM temperature (0-1). Lower = deterministic, Higher = creative",
            minimum: 0,
            maximum: 1,
          },
        },
        additionalProperties: false,
      },

      RoutingRule: {
        type: "object",
        title: "Routing Rule",
        description:
          "A rule that matches user prompts and routes to a target agent",
        required: ["matcher", "target_agent"],
        properties: {
          matcher: {
            $ref: "#/definitions/Matcher",
          },

          target_agent: {
            $ref: "#/definitions/BuiltinAgentName",
          },

          config_overrides: {
            $ref: "#/definitions/ConfigOverrides",
          },
        },
        additionalProperties: false,
      },

      Matcher: {
        title: "Matcher",
        description:
          "Condition that determines if a routing rule applies (discriminated union by type)",
        oneOf: [
          { $ref: "#/definitions/KeywordMatcher" },
          { $ref: "#/definitions/ComplexityMatcher" },
          { $ref: "#/definitions/RegexMatcher" },
          { $ref: "#/definitions/ProjectContextMatcher" },
          { $ref: "#/definitions/AlwaysMatcher" },
        ],
      },

      KeywordMatcher: {
        type: "object",
        title: "Keyword Matcher",
        description:
          "Matches if prompt contains specified keywords (case-insensitive)",
        required: ["type", "keywords", "mode"],
        properties: {
          type: {
            const: "keyword",
            title: "Matcher Type",
          },

          keywords: {
            type: "array",
            title: "Keywords",
            description: "Keywords to match against prompt (case-insensitive)",
            minItems: 1,
            items: {
              type: "string",
            },
            examples: [
              ["docs", "documentation"],
              ["bug", "error", "fix"],
            ],
          },

          mode: {
            enum: ["any", "all"],
            title: "Match Mode",
            description:
              "any = OR logic (>=1 keyword), all = AND logic (all keywords required)",
          },
        },
        additionalProperties: false,
      },

      ComplexityMatcher: {
        type: "object",
        title: "Complexity Matcher",
        description:
          "Routes based on heuristic complexity score (line count + keyword density)",
        required: ["type", "threshold"],
        properties: {
          type: {
            const: "complexity",
            title: "Matcher Type",
          },

          threshold: {
            enum: ["low", "medium", "high"],
            title: "Complexity Threshold",
            description:
              "Route if complexity >= threshold. Scoring: base + keywords",
          },
        },
        additionalProperties: false,
      },

      RegexMatcher: {
        type: "object",
        title: "Regex Matcher",
        description: "Routes based on regex pattern matching against prompt",
        required: ["type", "pattern"],
        properties: {
          type: {
            const: "regex",
            title: "Matcher Type",
          },

          pattern: {
            type: "string",
            title: "Regex Pattern",
            description:
              "JavaScript regex pattern (no leading/trailing slashes)",
            minLength: 1,
            examples: [
              "^(design|ui|component)",
              "(database|sql|postgres)",
              "(performance|optimization)",
            ],
          },

          flags: {
            type: "string",
            title: "Regex Flags",
            description:
              "JavaScript regex flags (default: i for case-insensitive)",
            default: "i",
            examples: ["i", "gi", "im"],
          },
        },
        additionalProperties: false,
      },

      ProjectContextMatcher: {
        type: "object",
        title: "Project Context Matcher",
        description:
          "Routes based on project structure (files and dependencies present)",
        required: ["type"],
        properties: {
          type: {
            const: "project_context",
            title: "Matcher Type",
          },

          has_files: {
            type: "array",
            title: "Required Files",
            description:
              "Project must have ALL these files/directories to match",
            items: {
              type: "string",
            },
            examples: [["package.json", "src/"], ["Makefile"]],
          },

          has_deps: {
            type: "array",
            title: "Required Dependencies",
            description:
              "Project must have ANY ONE of these dependencies to match",
            items: {
              type: "string",
            },
            examples: [
              ["vitest", "jest", "bun:test"],
              ["@angular/core", "@react", "vue"],
            ],
          },
        },
        additionalProperties: false,
      },

      AlwaysMatcher: {
        type: "object",
        title: "Always Matcher",
        description:
          "Catch-all fallback (matches everything). Use as final rule.",
        required: ["type"],
        properties: {
          type: {
            const: "always",
            title: "Matcher Type",
          },
        },
        additionalProperties: false,
      },

      ConfigOverrides: {
        type: "object",
        title: "Config Overrides",
        description: "Override agent configuration for a specific routing rule",
        properties: {
          model: {
            type: "string",
            title: "Model Override",
            description: "Override the LLM model for this route",
            examples: ["gpt-4-turbo", "claude-3-5-sonnet-20241022"],
          },

          temperature: {
            type: "number",
            title: "Temperature Override",
            description: "Override LLM temperature (0-1)",
            minimum: 0,
            maximum: 1,
          },

          prompt: {
            type: "string",
            title: "System Prompt Override",
            description: "Override system prompt for this route",
          },

          variant: {
            type: "string",
            title: "Variant Tag",
            description: "Agent variant/tag (e.g., tdd, analysis, refactor)",
            examples: ["tdd", "analysis", "refactor", "debug"],
          },
        },
        additionalProperties: false,
      },

      ProviderConfig: {
        type: "object",
        title: "Provider Configuration",
        description:
          "Configure provider chains and model selection strategy following oh-my-opencode conventions",
        properties: {
          priority_chain: {
            type: "array",
            title: "Global Priority Chain",
            description:
              "Provider fallback chain: system tries providers in order until available",
            items: {
              type: "string",
            },
            examples: [
              ["anthropic/claude-opus-4-6", "openai/gpt-5.2", "google/gemini-3-pro"],
            ],
          },

          research_providers: {
            type: "array",
            title: "Research Providers",
            description:
              "Cheap models for background research tasks (fire & forget)",
            items: {
              type: "string",
            },
            examples: [
              ["anthropic/claude-haiku-4-5", "openai/gpt-4-turbo"],
            ],
          },

          strategy_providers: {
            type: "array",
            title: "Strategy Providers",
            description: "Expensive models for architectural decisions",
            items: {
              type: "string",
            },
            examples: [
              ["anthropic/claude-opus-4-6", "openai/gpt-5.2"],
            ],
          },

          config: {
            type: "object",
            title: "Per-Provider Configuration",
            description: "Optional configuration per provider",
            additionalProperties: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        additionalProperties: false,
      },

      OlimpusSettings: {
        type: "object",
        title: "Olimpus Settings",
        description:
          "Olimpus-specific configuration with oh-my-opencode integration",
        properties: {
          namespace_prefix: {
            type: "string",
            title: "Namespace Prefix",
            description:
              "Prefix applied to bundled skills to avoid naming conflicts",
            default: "olimpus",
          },

          max_delegation_depth: {
            type: "integer",
            title: "Max Delegation Depth",
            description:
              "Maximum chain depth to prevent infinite delegation cycles (A->B->C->A)",
            default: 3,
            minimum: 1,
          },

          background_parallelization: {
            type: "object",
            title: "Background Parallelization",
            description:
              "Fire background researcher agents while main agent works",
            properties: {
              enabled: {
                type: "boolean",
                default: true,
              },
              max_parallel_tasks: {
                type: "integer",
                minimum: 1,
                default: 3,
              },
              timeout_ms: {
                type: "integer",
                minimum: 1000,
                default: 30000,
              },
            },
          },

          adaptive_model_selection: {
            type: "object",
            title: "Adaptive Model Selection",
            description:
              "Route cheap models to research, expensive to strategy (multi-model optimization)",
            properties: {
              enabled: {
                type: "boolean",
                default: true,
              },
              research_model: {
                type: "string",
                default: "anthropic/claude-haiku-4-5",
              },
              strategy_model: {
                type: "string",
                default: "anthropic/claude-opus-4-6",
              },
              default_model: {
                type: "string",
                default: "anthropic/claude-3-5-sonnet-20241022",
              },
            },
          },

          ultrawork_enabled: {
            type: "boolean",
            title: "Ultrawork Mode",
            description: "Enable relentless execution (include 'ulw' in prompt)",
            default: true,
          },

          todo_continuation: {
            type: "boolean",
            title: "Todo Continuation",
            description: "Force agent to continue if it stops halfway",
            default: true,
          },

          verify_before_completion: {
            type: "boolean",
            title: "Verify Before Completion",
            description: "Double-check work before declaring task done",
            default: true,
          },

          lsp_refactoring_preferred: {
            type: "boolean",
            title: "LSP Refactoring",
            description: "Use LSP/AST for surgical code changes (no string replacement)",
            default: true,
          },

          aggressive_comment_pruning: {
            type: "boolean",
            title: "Aggressive Comment Pruning",
            description: "No AI slop in comments - prune unnecessary documentation",
            default: true,
          },
        },
        additionalProperties: false,
      },

      BuiltinAgentName: {
        enum: [
          "sisyphus",
          "hephaestus",
          "oracle",
          "librarian",
          "explore",
          "multimodal-looker",
          "metis",
          "momus",
          "atlas",
          "prometheus",
        ],
        title: "Builtin Agent Name",
        description: "Valid oh-my-opencode builtin agent names",
      },
    },

    examples: [
      {
        meta_agents: {
          atenea: {
            base_model: "claude-3-5-sonnet-20241022",
            delegates_to: ["oracle", "prometheus"],
            routing_rules: [
              {
                matcher: {
                  type: "complexity",
                  threshold: "high",
                },
                target_agent: "oracle",
                config_overrides: {
                  prompt:
                    "You are a strategic advisor. Analyze from first principles.",
                },
              },
              {
                matcher: {
                  type: "always",
                },
                target_agent: "prometheus",
              },
            ],
          },
        },
        settings: {
          namespace_prefix: "olimpus",
          max_delegation_depth: 3,
        },
      },
    ],
  };

  return schema;
}

const schema = generateOlimpusSchema();
const assetPath = join(process.cwd(), "assets", "olimpus.schema.json");

try {
  writeFileSync(assetPath, JSON.stringify(schema, null, 2) + "\n");
  console.log(`✅ Schema generated: ${assetPath}`);
  console.log(`\n📋 Schema details:`);
  console.log(`   - ID: ${schema.$id}`);
  console.log(`   - Extends: oh-my-opencode base schema`);
  console.log(
    `   - Definitions: ${Object.keys(schema.definitions).length} types`,
  );
} catch (error) {
  console.error(`❌ Failed to generate schema:`, error);
  process.exit(1);
}
