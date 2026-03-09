import { describe, expect, test } from "bun:test";
import { __testables } from "./start-work-worktree";

describe("start-work worktree helpers", () => {
  test("derives plan name stripping worktree flag and ultrawork tokens", () => {
    const plan = __testables.derivePlanName(
      "JIRA-123 ultrawork --worktree /tmp/foo",
    );
    expect(plan).toBe("JIRA-123");
  });

  test("returns null plan when only worktree flag provided", () => {
    const plan = __testables.derivePlanName("--worktree /tmp/foo");
    expect(plan).toBeNull();
  });

  test("injects worktree into user-request block", () => {
    const parts = [
      {
        type: "text",
        text: "<user-request>JIRA-123</user-request>",
      },
    ];

    const changed = __testables.injectWorktreeArg(parts, "/tmp/wt");

    expect(changed).toBe(true);
    expect(parts[0]?.text).toContain("--worktree /tmp/wt");
  });

  test("does not duplicate worktree argument", () => {
    const parts = [
      {
        type: "text",
        text: "<user-request>JIRA-123 --worktree /tmp/existing</user-request>",
      },
    ];

    const changed = __testables.injectWorktreeArg(parts, "/tmp/new");

    expect(changed).toBe(true);
    expect(parts[0]?.text).toContain("/tmp/existing");
    expect(parts[0]?.text).not.toContain("/tmp/new");
  });
});
