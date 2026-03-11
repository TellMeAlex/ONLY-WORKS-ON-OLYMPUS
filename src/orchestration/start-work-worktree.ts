import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

interface CommandExecuteBeforeInput {
  sessionID: string;
  command: string;
  arguments?: string;
}

interface OutputPart {
  type: string;
  text?: string;
}

interface CommandExecuteBeforeOutput {
  parts: OutputPart[];
}

function stripWorktreeFlag(args: string): string {
  return args.replace(/--worktree(?:\s+\S+)?/g, "").trim();
}

function derivePlanName(args: string): string | null {
  const cleaned = stripWorktreeFlag(args)
    .replace(/\b(ultrawork|ulw)\b/gi, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function nowSuffix(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function createWorktree(directory: string, planName: string): string | null {
  try {
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const slug = slugify(planName || "plan") || "plan";
    const suffix = nowSuffix();
    const branchName = `worktree/${slug}-${suffix}`;
    const worktreePath = join(
      repoRoot,
      ".sisyphus",
      "worktrees",
      `${slug}-${suffix}`,
    );

    mkdirSync(join(repoRoot, ".sisyphus", "worktrees"), { recursive: true });

    execFileSync(
      "git",
      ["worktree", "add", "-b", branchName, worktreePath, "HEAD"],
      {
        cwd: repoRoot,
        encoding: "utf-8",
        timeout: 20000,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    return worktreePath;
  } catch {
    return null;
  }
}

function injectWorktreeArg(parts: OutputPart[], worktreePath: string): boolean {
  const requestRegex = /<user-request>\s*([\s\S]*?)\s*<\/user-request>/i;

  for (const part of parts) {
    if (!part.text) {
      continue;
    }

    const match = part.text.match(requestRegex);
    if (!match) {
      continue;
    }

    const currentRequest = match[1]?.trim() ?? "";
    if (currentRequest.includes("--worktree")) {
      return true;
    }

    const nextRequest = `${currentRequest} --worktree ${worktreePath}`.trim();
    part.text = part.text.replace(
      requestRegex,
      `<user-request>\n${nextRequest}\n</user-request>`,
    );
    return true;
  }

  return false;
}

export function createStartWorkWorktreeHook(directory: string) {
  return async (
    input: CommandExecuteBeforeInput,
    output: CommandExecuteBeforeOutput,
  ): Promise<void> => {
    if (input.command !== "start-work") {
      return;
    }

    const args = input.arguments?.trim() ?? "";
    if (!args || args.includes("--worktree")) {
      return;
    }

    const planName = derivePlanName(args);
    if (!planName) {
      return;
    }

    const worktreePath = createWorktree(directory, planName);
    if (!worktreePath) {
      return;
    }

    const mutableInput = input as { arguments?: string };
    mutableInput.arguments = `${args} --worktree ${worktreePath}`;

    injectWorktreeArg(output.parts, worktreePath);
  };
}

export const __testables = {
  derivePlanName,
  slugify,
  stripWorktreeFlag,
  injectWorktreeArg,
};
