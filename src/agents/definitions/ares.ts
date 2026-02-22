import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Ares - Testing & Debugging Meta-Agent
 * Handles test execution, debugging workflows, and troubleshooting
 * Routes based on keywords: test/run → sisyphus, debug/error → explore or multimodal-looker
 * Always falls back to explore for general debugging and code investigation
 */
export const ares: MetaAgentDef = {
  base_model: "", // Uses default from config
  delegates_to: ["sisyphus", "explore", "multimodal-looker"],
  routing_rules: [
    {
      matcher: {
        type: "keyword",
        keywords: [
          "test",
          "tests",
          "testing",
          "run test",
          "run tests",
          "test runner",
          "unit test",
          "integration test",
          "e2e test",
          "test suite",
          "coverage",
          "assertion",
          "mock",
          "fixture",
        ],
        mode: "any",
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "You are a testing and validation specialist. Execute tests, analyze test results, and ensure comprehensive test coverage. Use available test running tools to validate code changes and identify regressions.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "debug",
          "debugging",
          "error",
          "bug",
          "fix",
          "troubleshoot",
          "crash",
          "exception",
          "traceback",
          "stack trace",
          "segmentation fault",
          "panic",
        ],
        mode: "any",
      },
      target_agent: "explore",
      config_overrides: {
        prompt:
          "You are a debugging specialist. Investigate errors and bugs by analyzing the codebase, examining stack traces, and understanding error conditions. Search for related code, patterns, and similar issues to identify the root cause.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "visual",
          "screenshot",
          "screenshot",
          "image",
          "look at",
          "see the",
          "analyze image",
          "inspect image",
        ],
        mode: "any",
      },
      target_agent: "multimodal-looker",
      config_overrides: {
        prompt:
          "You are a visual debugging specialist. Analyze images, screenshots, and visual artifacts to understand bugs, UI issues, or visual problems. Provide detailed observations about what you see and relate it to the code.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["performance", "slow", "optimize", "profiling", "benchmark"],
        mode: "any",
      },
      target_agent: "explore",
      config_overrides: {
        prompt:
          "You are a performance debugging specialist. Analyze performance issues, identify bottlenecks, and search for inefficient code patterns. Consider algorithmic complexity, I/O operations, and resource usage.",
      },
    },
    {
      matcher: {
        type: "always",
      },
      target_agent: "explore",
      config_overrides: {
        prompt:
          "You are a debugging and investigation specialist. Explore the codebase to understand issues, find relevant code, and provide analysis to help resolve problems.",
      },
    },
  ],
  prompt_template:
    "Debug and investigate: {input}\n\nProvide:\n- Root cause analysis\n- Relevant code locations\n- Suggested fixes or next steps\n- Related patterns or similar issues",
};
