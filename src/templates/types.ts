/**
 * Template type definitions for meta-agent templates library.
 *
 * This module provides type definitions and schemas for working with
 * meta-agent templates. Templates are reusable configurations that can be
 * used as starting points for creating custom meta-agents.
 *
 * Templates are organized by category:
 * - language: Templates for language-specific routing patterns
 * - workflow: Templates for team workflows and processes
 * - team: Templates for team size and structure
 * - domain: Templates for domain-specific use cases
 */

/**
 * Re-export template schema and types from config schema.
 * This maintains a single source of truth while providing
 * a clean import path for template-related functionality.
 */

export {
  TemplateSchema,
  MetaAgentSchema,
  RoutingRuleSchema,
  MatcherSchema,
  KeywordMatcherSchema,
  ComplexityMatcherSchema,
  RegexMatcherSchema,
  ProjectContextMatcherSchema,
  AlwaysMatcherSchema,
  type MetaAgentDef,
  type RoutingRule,
  type Matcher,
  type KeywordMatcher,
  type ComplexityMatcher,
  type RegexMatcher,
  type ProjectContextMatcher,
  type AlwaysMatcher,
} from "../config/schema.js";

// Import Template type for use in this file
import type { Template } from "../config/schema.js";

// Re-export Template type
export type { Template } from "../config/schema.js";

/**
 * Template categories for organizing templates.
 */
export const TEMPLATE_CATEGORIES = [
  "language",
  "workflow",
  "team",
  "domain",
] as const;

/**
 * Template category type.
 */
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/**
 * Template metadata without the full meta_agent configuration.
 * Useful for previewing templates without loading the full configuration.
 */
export interface TemplateMetadata {
  /**
   * Unique identifier for the template
   */
  name: string;

  /**
   * Human-readable description of what the template does
   */
  description: string;

  /**
   * Category the template belongs to
   */
  category: TemplateCategory;

  /**
   * Optional tags for filtering and searching
   */
  tags?: string[];

  /**
   * Optional documentation or usage notes
   */
  documentation?: string;

  /**
   * Optional examples of how to use the template
   */
  examples?: string[];
}

/**
 * Template validation options for loading and processing templates.
 */
export interface TemplateValidationOptions {
  /**
   * Whether to validate templates against the schema
   * @default true
   */
  validate?: boolean;

  /**
   * Whether to skip invalid templates instead of throwing errors
   * @default false
   */
  skipInvalid?: boolean;
}

/**
 * Template loading result with metadata about success/failure.
 */
export interface TemplateLoadResult {
  /**
   * Name of the template
   */
  name: string;

  /**
   * Whether the template was successfully loaded
   */
  success: boolean;

  /**
   * The loaded template if successful
   */
  template?: Template;

  /**
   * Error message if loading failed
   */
  error?: string;

  /**
   * Path to the template file
   */
  path?: string;
}

/**
 * Template search criteria for filtering templates.
 */
export interface TemplateSearchCriteria {
  /**
   * Filter by category
   */
  category?: TemplateCategory;

  /**
   * Filter by tags (matches any tag if multiple provided)
   */
  tags?: string[];

  /**
   * Filter by name (substring match)
   */
  nameContains?: string;

  /**
   * Filter by keywords in description
   */
  descriptionContains?: string;
}
