import { describe, expect, test } from "bun:test";
import {
  normalizeForCompare,
  parseWorktreeListPorcelain,
  stripHeadsPrefix,
} from "./worktree-cleanup.js";

describe("worktree cleanup helpers", () => {
  test("parses git worktree porcelain output", () => {
    const parsed = parseWorktreeListPorcelain(
      [
        "worktree /repo",
        "HEAD abc123",
        "branch refs/heads/master",
        "",
        "worktree /repo/.sisyphus/worktrees/jira-123",
        "HEAD def456",
        "branch refs/heads/worktree/jira-123",
        "",
      ].join("\n"),
    );

    expect(parsed.length).toBe(2);
    expect(parsed[0]?.path).toBe("/repo");
    expect(parsed[0]?.branch).toBe("refs/heads/master");
    expect(parsed[1]?.path).toBe("/repo/.sisyphus/worktrees/jira-123");
  });

  test("strips refs/heads prefix", () => {
    expect(stripHeadsPrefix("refs/heads/worktree/jira-123")).toBe(
      "worktree/jira-123",
    );
    expect(stripHeadsPrefix("master")).toBe("master");
    expect(stripHeadsPrefix(undefined)).toBe("");
  });

  test("normalizes paths for compare", () => {
    expect(normalizeForCompare("/repo/./a/../b")).toBe("/repo/b");
  });
});
