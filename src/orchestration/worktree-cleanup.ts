import { resolve } from "node:path";

export interface WorktreeInfo {
  path: string;
  branch?: string;
}

export function parseWorktreeListPorcelain(output: string): WorktreeInfo[] {
  const lines = output.split("\n");
  const result: WorktreeInfo[] = [];

  let current: WorktreeInfo | null = null;

  for (const line of lines) {
    if (line.startsWith("worktree ")) {
      if (current?.path) {
        result.push(current);
      }
      current = {
        path: line.slice("worktree ".length).trim(),
      };
      continue;
    }

    if (line.startsWith("branch ") && current) {
      current.branch = line.slice("branch ".length).trim();
    }
  }

  if (current?.path) {
    result.push(current);
  }

  return result;
}

export function normalizeForCompare(input: string): string {
  return resolve(input);
}

export function isManagedWorktreePath(
  worktreePath: string,
  repoRoot: string,
): boolean {
  const normalizedPath = normalizeForCompare(worktreePath);
  const managedRoots = [
    normalizeForCompare(`${repoRoot}/.sisyphus/worktrees`),
    normalizeForCompare(`${repoRoot}/.auto-claude/worktrees/tasks`),
  ];

  if (managedRoots.some((root) => normalizedPath.startsWith(root))) {
    return true;
  }

  return /\/tmp\/olympus-pr[0-9-]/.test(normalizedPath);
}

export function stripHeadsPrefix(ref: string | undefined): string {
  if (!ref) {
    return "";
  }
  return ref.replace(/^refs\/heads\//, "");
}
