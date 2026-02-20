import * as fs from "fs";
import * as path from "path";
import { parse } from "jsonc-parser";
import { TemplateSchema, type Template } from "../config/schema.js";

/**
 * Options for loading templates
 */
export interface LoadTemplatesOptions {
  /**
   * Directory path to load templates from
   * @default "./templates"
   */
  templatesDir?: string;
  /**
   * Whether to validate templates against schema
   * @default true
   */
  validate?: boolean;
  /**
   * Whether to skip invalid templates or throw error
   * @default false
   */
  skipInvalid?: boolean;
}

/**
 * Load template definitions from the templates directory.
 * Searches recursively for .jsonc files and parses them.
 * Returns a record of template names to validated template objects.
 *
 * Template files are organized by category (language/, workflow/, team/, domain/).
 * The template name is derived from the file name (without extension).
 *
 * @param options - Optional configuration for loading templates
 * @returns Record of template names to validated template objects
 * @throws Error if a template fails validation and skipInvalid is false
 */
export function loadTemplates(
  options?: LoadTemplatesOptions,
): Record<string, Template> {
  const templatesDir = options?.templatesDir ?? "./templates";
  const shouldValidate = options?.validate ?? true;
  const skipInvalid = options?.skipInvalid ?? false;

  const templates: Record<string, Template> = {};

  if (!fs.existsSync(templatesDir)) {
    return templates;
  }

  const templateFiles = findTemplateFiles(templatesDir);

  for (const filePath of templateFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = parseJsonc(content, filePath);

      if (!parsed || typeof parsed !== "object") {
        const errorMsg = `Invalid template format in ${filePath}`;
        if (!skipInvalid) {
          throw new Error(errorMsg);
        }
        continue;
      }

      const templateData = parsed as Record<string, unknown>;

      // Validate against schema if enabled
      if (shouldValidate) {
        const result = TemplateSchema.safeParse(templateData);
        if (!result.success) {
          const errors = result.error.issues
            .map((issue) => `  ${issue.path.join(".")} - ${issue.message}`)
            .join("\n");
          const errorMsg = `Invalid template in ${filePath}:\n${errors}`;
          if (!skipInvalid) {
            throw new Error(errorMsg);
          }
          continue;
        }
        templates[result.data.name] = result.data;
      } else {
        // Skip validation, just use the parsed data
        // Cast to Template type - unsafe but follows options
        const name = templateData.name as string;
        if (name) {
          templates[name] = templateData as Template;
        }
      }
    } catch (error) {
      const errorMsg = `Error loading template from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      if (!skipInvalid) {
        throw new Error(errorMsg);
      }
      // Skip invalid templates silently if skipInvalid is true
    }
  }

  return templates;
}

/**
 * Load a single template by name from the templates directory.
 *
 * @param name - Name of the template to load
 * @param options - Optional configuration for loading templates
 * @returns Template object if found, undefined otherwise
 * @throws Error if template is found but fails validation and skipInvalid is false
 */
export function loadTemplate(
  name: string,
  options?: LoadTemplatesOptions,
): Template | undefined {
  const templatesDir = options?.templatesDir ?? "./templates";
  const skipInvalid = options?.skipInvalid ?? false;

  // Try to find template file by name
  const filePath = findTemplateFile(name, templatesDir);
  if (!filePath) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseJsonc(content, filePath);

    if (!parsed || typeof parsed !== "object") {
      const errorMsg = `Invalid template format in ${filePath}`;
      if (!skipInvalid) {
        throw new Error(errorMsg);
      }
      return undefined;
    }

    const templateData = parsed as Record<string, unknown>;

    // Validate against schema if enabled
    const shouldValidate = options?.validate ?? true;
    if (shouldValidate) {
      const result = TemplateSchema.safeParse(templateData);
      if (!result.success) {
        const errors = result.error.issues
          .map((issue) => `  ${issue.path.join(".")} - ${issue.message}`)
          .join("\n");
        const errorMsg = `Invalid template in ${filePath}:\n${errors}`;
        if (!skipInvalid) {
          throw new Error(errorMsg);
        }
        return undefined;
      }
      return result.data;
    } else {
      // Skip validation, just use the parsed data
      const templateName = templateData.name as string;
      if (templateName === name) {
        return templateData as Template;
      }
    }
  } catch (error) {
    const errorMsg = `Error loading template from ${filePath}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    if (!skipInvalid) {
      throw new Error(errorMsg);
    }
    return undefined;
  }

  return undefined;
}

/**
 * Get all available template names from the templates directory.
 *
 * @param options - Optional configuration for loading templates
 * @returns Array of template names
 */
export function listTemplates(options?: LoadTemplatesOptions): string[] {
  const templates = loadTemplates({
    ...options,
    validate: false, // Don't validate for listing
  });
  return Object.keys(templates);
}

/**
 * Get templates filtered by category.
 *
 * @param category - Category to filter by (language, workflow, team, domain)
 * @param options - Optional configuration for loading templates
 * @returns Record of template names to template objects for the specified category
 */
export function listTemplatesByCategory(
  category: "language" | "workflow" | "team" | "domain",
  options?: LoadTemplatesOptions,
): Record<string, Template> {
  const allTemplates = loadTemplates(options);
  const filtered: Record<string, Template> = {};

  for (const [name, template] of Object.entries(allTemplates)) {
    if (template.category === category) {
      filtered[name] = template;
    }
  }

  return filtered;
}

/**
 * Search templates by tag.
 *
 * @param tag - Tag to search for
 * @param options - Optional configuration for loading templates
 * @returns Record of template names to template objects that have the specified tag
 */
export function searchTemplatesByTag(
  tag: string,
  options?: LoadTemplatesOptions,
): Record<string, Template> {
  const allTemplates = loadTemplates(options);
  const filtered: Record<string, Template> = {};

  for (const [name, template] of Object.entries(allTemplates)) {
    if (template.tags && template.tags.includes(tag)) {
      filtered[name] = template;
    }
  }

  return filtered;
}

/**
 * Find all .jsonc template files in a directory recursively.
 *
 * @param dir - Directory to search
 * @returns Array of absolute file paths
 */
function findTemplateFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findTemplateFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".jsonc")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Find a template file by name in the templates directory.
 * Searches subdirectories as well.
 *
 * @param name - Name of the template (without .jsonc extension)
 * @param dir - Directory to search
 * @returns Absolute file path if found, undefined otherwise
 */
function findTemplateFile(name: string, dir: string): string | undefined {
  if (!fs.existsSync(dir)) {
    return undefined;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const found = findTemplateFile(name, fullPath);
      if (found) {
        return found;
      }
    } else if (entry.isFile() && entry.name === `${name}.jsonc`) {
      return fullPath;
    }
  }

  return undefined;
}

/**
 * Parse JSONC string and return parsed object or throw error.
 */
function parseJsonc(content: string, filePath: string): unknown {
  const errors: Array<{ error: number; offset: number; length: number }> = [];
  const parsed = parse(content, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => {
        const line = content.substring(0, err.offset).split("\n").length;
        return `  Offset ${err.offset} (line ${line}): error code ${err.error}`;
      })
      .join("\n");
    throw new Error(`JSONC parse error in ${filePath}:\n${errorMessages}`);
  }

  return parsed;
}
