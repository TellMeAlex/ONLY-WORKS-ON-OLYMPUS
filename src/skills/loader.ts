import { existsSync, readFileSync } from "fs";
import { resolve, extname } from "path";
import type {
  SkillDefinition,
  SkillMetadata,
  CommandDefinition,
} from "./types.js";
import { warning, error, bold, dim } from "../utils/colors.js";

const FRONTMATTER_DELIMITER = "---";
const OLIMPUS_PREFIX = "olimpus:";

function parseFrontmatter(content: string): {
  metadata: SkillMetadata;
  template: string;
} {
  const lines = content.split("\n");

  if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) {
    return {
      metadata: {},
      template: content,
    };
  }

  let endDelimiterIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === FRONTMATTER_DELIMITER) {
      endDelimiterIdx = i;
      break;
    }
  }

  if (endDelimiterIdx === -1) {
    return {
      metadata: {},
      template: content,
    };
  }

  const frontmatterLines = lines.slice(1, endDelimiterIdx);
  const metadata = parseFrontmatterLines(frontmatterLines);

  const template = lines
    .slice(endDelimiterIdx + 1)
    .join("\n")
    .trim();

  return { metadata, template };
}

function parseFrontmatterLines(lines: string[]): SkillMetadata {
  const metadata: SkillMetadata = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) {
      continue;
    }

    const key = trimmed.substring(0, colonIdx).trim();
    const value = trimmed.substring(colonIdx + 1).trim();

    (metadata as Record<string, string | boolean | string[]>)[key] =
      parseYamlValue(value);
  }

  return metadata;
}

function parseYamlValue(value: string): string | boolean | string[] {
  if (value === "true") return true;
  if (value === "false") return false;

  if (value.startsWith("[") && value.endsWith("]")) {
    const items = value
      .slice(1, -1)
      .split(",")
      .map((item) => {
        const trimmed = item.trim();
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
    return items.filter((item) => item.length > 0);
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function extractSkillName(filePath: string): string {
  const fileName = filePath.split("/").pop() || "";
  return fileName.replace(/\.[^.]+$/, "");
}

/**
 * Load Olimpus skills from specified paths
 * Reads markdown files and parses frontmatter + template
 * Returns array of SkillDefinitions with olimpus: prefix applied
 */
export function loadOlimpusSkills(
  skillPaths: string[],
  projectDir: string
): SkillDefinition[] {
  const skills: SkillDefinition[] = [];

  for (const skillPath of skillPaths) {
    const resolvedPath = skillPath.startsWith("/")
      ? skillPath
      : resolve(projectDir, skillPath);

    if (!existsSync(resolvedPath)) {
      console.warn(
        `${bold("[Olimpus]")} ${warning("Skill file not found:")} ${dim(resolvedPath)}`,
      );
      continue;
    }

    if (extname(resolvedPath) !== ".md") {
      console.warn(
        `${bold("[Olimpus]")} ${warning("Skipping non-markdown file:")} ${dim(resolvedPath)}`,
      );
      continue;
    }

    try {
      const content = readFileSync(resolvedPath, "utf-8");
      const { metadata, template } = parseFrontmatter(content);

      const baseName = extractSkillName(resolvedPath);
      const skillName = `${OLIMPUS_PREFIX}${baseName}`;

      const definition: CommandDefinition = {
        name: skillName,
        description: metadata.description,
        template,
        agent: metadata.agent,
        model: metadata.model,
        subtask: metadata.subtask,
        argumentHint: metadata["argument-hint"]
          ? String(metadata["argument-hint"])
          : undefined,
      };

      let allowedTools: string[] | undefined;
      if (metadata["allowed-tools"]) {
        allowedTools = Array.isArray(metadata["allowed-tools"])
          ? metadata["allowed-tools"]
          : String(metadata["allowed-tools"])
              .split(",")
              .map((t) => t.trim());
      }

      const skill: SkillDefinition = {
        name: skillName,
        path: skillPath,
        resolvedPath,
        definition,
        scope: "olimpus",
        license: metadata.license ? String(metadata.license) : undefined,
        compatibility: metadata.compatibility
          ? String(metadata.compatibility)
          : undefined,
        metadata: metadata.metadata,
        allowedTools,
      };

      skills.push(skill);
    } catch (error) {
      console.warn(
        `${bold("[Olimpus]")} ${error("Error loading skill from")} ${dim(resolvedPath)}: ${dim(
          error instanceof Error ? error.message : String(error),
        )}`,
      );
      continue;
    }
  }

  return skills;
}

/**
 * Merge base skills (from oh-my-opencode) with Olimpus skills
 * Olimpus skills use olimpus: prefix to avoid naming conflicts
 * Olimpus skills are appended (do not overwrite base skills)
 */
export function mergeSkills(
  baseSkills: SkillDefinition[],
  olimpusSkills: SkillDefinition[]
): SkillDefinition[] {
  const baseNames = new Set(baseSkills.map((s) => s.name));

  const uniqueOlimpusSkills = olimpusSkills.filter(
    (skill) => !baseNames.has(skill.name)
  );

  return [...baseSkills, ...uniqueOlimpusSkills];
}
