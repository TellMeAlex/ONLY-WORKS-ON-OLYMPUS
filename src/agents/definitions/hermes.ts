import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Hermes Meta-Agent - Jira Management Orchestrator
 *
 * Specialized routing for Jira operations:
 * - Planning (create epics/sprints) → prometheus
 * - Analysis & queries → oracle
 * - Implementation (execute tasks) → sisyphus
 * - Research & documentation → librarian
 *
 * All routes instruct delegates to use Jira skills:
 * - jira-issue-operations
 */

export const hermes: MetaAgentDef = {
  base_model: "",
  description:
    "Jira management orchestrator — plans, queries, and executes Jira operations through specialized agents",
  mode: "subagent",
  color: "#F4A460",
  hidden: true,
  permission: {
    edit: "deny",
    bash: "ask",
    webfetch: "allow",
    task: "allow",
    doom_loop: "deny",
    external_directory: "deny",
  },
  prompt_template:
    "You are Hermes, the Jira management orchestrator for the Olimpus plugin system.\n\n" +
    "Your role is to coordinate all Jira-related operations by routing to specialized agents.\n" +
    "You have access to jira-issue-operations skill for comprehensive Jira management.\n\n" +
    "Capabilities:\n" +
    "- Plan and structure Jira work (epics, stories, tasks)\n" +
    "- Query and analyze Jira data\n" +
    "- Execute Jira operations (create, update, transition)\n" +
    "- Search and document Jira information\n\n" +
    "Always use the jira-issue-operations skill for Jira interactions.",
  delegates_to: ["prometheus", "sisyphus", "oracle", "librarian"],
  routing_rules: [
    {
      matcher: {
        type: "keyword",
        keywords: [
          "plan",
          "create epic",
          "organize sprint",
          "roadmap",
          "structure",
        ],
        mode: "any",
      },
      target_agent: "prometheus",
      config_overrides: {
        prompt:
          "Create comprehensive Jira work plan and structure. Generate epics, stories, and tasks. " +
          "After planning, use jira-issue-operations to create tickets and establish dependencies and epic links.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "analyze",
          "review",
          "audit",
          "report",
          "metrics",
          "status",
          "progress",
        ],
        mode: "any",
      },
      target_agent: "oracle",
      config_overrides: {
        prompt:
          "Analyze Jira data and generate comprehensive reports. Use jira-issue-operations to query issues and track work progress.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "implement",
          "update",
          "move issues",
          "add to sprint",
          "transition",
          "close",
          "resolve",
          "assign",
        ],
        mode: "any",
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "Execute Jira operations using jira-issue-operations to update issues, manage links, " +
          "and organize work. Prioritize maintainability and proper Jira structure.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["search", "find issues", "query", "list", "browse", "show"],
        mode: "any",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "Search and document Jira information. Use jira-issue-operations skill to query issues and compile findings. " +
          "Present results in organized, readable format with links.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "jira",
          "ticket",
          "issue",
          "epic",
          "story",
          "sprint",
          "board",
        ],
        mode: "any",
      },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "Handle Jira operations with expertise. Use jira-issue-operations for comprehensive issue management including linking and dependencies.",
      },
    },
    {
      matcher: { type: "always" },
      target_agent: "sisyphus",
      config_overrides: {
        prompt:
          "Execute Jira-related task. Use available Jira skills: jira-issue-operations.",
      },
    },
  ],
};
