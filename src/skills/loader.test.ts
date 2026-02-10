import { test, expect } from "bun:test";
import { loadOlimpusSkills, mergeSkills } from "./loader.js";
import type { SkillDefinition } from "./types.js";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

const TEST_DIR = ".test-skills";

function createTestSkill(filename: string, content: string) {
  mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(join(TEST_DIR, filename), content);
}

function cleanup() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

import { existsSync } from "fs";

test("loadOlimpusSkills: parse markdown with frontmatter", () => {
  createTestSkill(
    "test-skill.md",
    `---
description: A test skill
model: claude-3-sonnet
subtask: true
---
This is the skill template content.`
  );

  const skills = loadOlimpusSkills([join(TEST_DIR, "test-skill.md")], ".");
  expect(skills).toHaveLength(1);
  expect(skills[0]?.name).toBe("olimpus:test-skill");
  expect(skills[0]?.definition.description).toBe("A test skill");
  expect(skills[0]?.definition.model).toBe("claude-3-sonnet");
  expect(skills[0]?.definition.subtask).toBe(true);
  expect(skills[0]?.definition.template).toContain(
    "This is the skill template"
  );
  cleanup();
});

test("loadOlimpusSkills: parse metadata with arrays", () => {
  createTestSkill(
    "array-skill.md",
    `---
name: array-test
allowed-tools: ["tool1", "tool2", "tool3"]
---
Template here.`
  );

  const skills = loadOlimpusSkills([join(TEST_DIR, "array-skill.md")], ".");
  expect(skills).toHaveLength(1);
  expect(skills[0]?.allowedTools).toEqual(["tool1", "tool2", "tool3"]);
  cleanup();
});

test("loadOlimpusSkills: apply olimpus: prefix", () => {
  createTestSkill("prefixed.md", "---\n---\nContent");

  const skills = loadOlimpusSkills([join(TEST_DIR, "prefixed.md")], ".");
  expect(skills[0]?.name).toMatch(/^olimpus:/);
  cleanup();
});

test("loadOlimpusSkills: skip non-markdown files", () => {
  mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(join(TEST_DIR, "skip-me.txt"), "content");

  const skills = loadOlimpusSkills([join(TEST_DIR, "skip-me.txt")], ".");
  expect(skills).toHaveLength(0);
  cleanup();
});

test("loadOlimpusSkills: warn on missing file", () => {
  const skills = loadOlimpusSkills([join(TEST_DIR, "nonexistent.md")], ".");
  expect(skills).toHaveLength(0);
  cleanup();
});

test("mergeSkills: append olimpus skills without overwrite", () => {
  const baseSkills: SkillDefinition[] = [
    {
      name: "base-skill",
      definition: { name: "base-skill", template: "base" },
      scope: "config",
    },
  ];

  const olimpusSkills: SkillDefinition[] = [
    {
      name: "olimpus:custom",
      definition: { name: "olimpus:custom", template: "olimpus" },
      scope: "olimpus",
    },
  ];

  const merged = mergeSkills(baseSkills, olimpusSkills);
  expect(merged).toHaveLength(2);
  expect(merged[0]?.name).toBe("base-skill");
  expect(merged[1]?.name).toBe("olimpus:custom");
});

test("mergeSkills: filter conflicting olimpus skills", () => {
  const baseSkills: SkillDefinition[] = [
    {
      name: "shared-skill",
      definition: { name: "shared-skill", template: "base" },
      scope: "config",
    },
  ];

  const olimpusSkills: SkillDefinition[] = [
    {
      name: "shared-skill",
      definition: { name: "shared-skill", template: "olimpus" },
      scope: "olimpus",
    },
    {
      name: "olimpus:unique",
      definition: { name: "olimpus:unique", template: "olimpus" },
      scope: "olimpus",
    },
  ];

  const merged = mergeSkills(baseSkills, olimpusSkills);
  expect(merged).toHaveLength(2);
  expect(merged.map((s) => s.name)).toEqual(["shared-skill", "olimpus:unique"]);
});

test("mergeSkills: preserve order", () => {
  const baseSkills: SkillDefinition[] = [
    {
      name: "base1",
      definition: { name: "base1", template: "" },
      scope: "config",
    },
    {
      name: "base2",
      definition: { name: "base2", template: "" },
      scope: "config",
    },
  ];

  const olimpusSkills: SkillDefinition[] = [
    {
      name: "olimpus:new1",
      definition: { name: "olimpus:new1", template: "" },
      scope: "olimpus",
    },
    {
      name: "olimpus:new2",
      definition: { name: "olimpus:new2", template: "" },
      scope: "olimpus",
    },
  ];

  const merged = mergeSkills(baseSkills, olimpusSkills);
  expect(merged.map((s) => s.name)).toEqual([
    "base1",
    "base2",
    "olimpus:new1",
    "olimpus:new2",
  ]);
});
