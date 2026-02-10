/**
 * Skill Definition and related types for Olimpus skill bundling system
 */

export type SkillScope = "builtin" | "config" | "user" | "project" | "olimpus";

/**
 * Skill metadata parsed from markdown frontmatter
 */
export interface SkillMetadata {
  name?: string;
  description?: string;
  model?: string;
  "argument-hint"?: string;
  agent?: string;
  subtask?: boolean;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  "allowed-tools"?: string | string[];
}

/**
 * Handoff definition for skill workflows
 */
export interface HandoffDefinition {
  label: string;
  agent: string;
  prompt: string;
  send?: boolean;
}

/**
 * Command/Skill definition (compatible with oh-my-opencode format)
 */
export interface CommandDefinition {
  name: string;
  description?: string;
  template: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  argumentHint?: string;
  handoffs?: HandoffDefinition[];
}

/**
 * Loaded skill definition with metadata and scope
 */
export interface SkillDefinition {
  name: string;
  path?: string;
  resolvedPath?: string;
  definition: CommandDefinition;
  scope: SkillScope;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string[];
}
