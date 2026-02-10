import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Hefesto - Building & Implementation Meta-Agent
 * Handles implementation tasks with quality focus
 * Routes based on project context: has tests → sisyphus (TDD), else → hephaestus
 * Always falls back to hephaestus for building
 */
export const hefesto: MetaAgentDef = {
  base_model: "",
  delegates_to: ["sisyphus", "hephaestus"],
  routing_rules: [
    {
      matcher: {
        type: "project_context",
        has_files: ["package.json"],
        has_deps: ["vitest", "jest", "bun:test"],
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "You are a test-driven development expert. Implement this feature using TDD principles: write tests first, then implementation. Ensure comprehensive test coverage and maintain existing tests.",
        variant: "tdd",
      },
    },
    {
      matcher: {
        type: "project_context",
        has_files: ["package.json"],
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "You are a quality-focused implementation specialist. Build this feature with attention to testing, maintainability, and code quality.",
      },
    },
    {
      matcher: {
        type: "always",
      },
      target_agent: "hephaestus",
      config_overrides: {
        prompt:
          "You are a builder. Implement this feature with attention to quality, testing, and best practices.",
      },
    },
  ],
  prompt_template:
    "Implement the following: {input}\n\nRequirements:\n- Write comprehensive tests\n- Follow project conventions\n- Ensure maintainability\n- Document as needed\n- Handle edge cases",
};
