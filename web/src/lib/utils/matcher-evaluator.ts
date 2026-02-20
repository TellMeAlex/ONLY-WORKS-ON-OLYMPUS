import type { RoutingRule } from "$lib/types";

interface RuleEvaluation {
  rule: RoutingRule;
  matched: boolean;
  reason: string;
}

export function evaluateAllRules(
  rules: RoutingRule[],
  prompt: string,
): RuleEvaluation[] {
  return rules.map((rule) => {
    const { matched, reason } = evaluateMatcher(rule, prompt);
    return { rule, matched, reason };
  });
}

function evaluateMatcher(
  rule: RoutingRule,
  prompt: string,
): { matched: boolean; reason: string } {
  const matcher = rule.matcher;
  const lowerPrompt = prompt.toLowerCase();

  switch (matcher.type) {
    case "keyword": {
      const matchedKeywords = matcher.keywords.filter((k) =>
        lowerPrompt.includes(k.toLowerCase()),
      );
      if (matcher.mode === "any") {
        const matched = matchedKeywords.length > 0;
        return {
          matched,
          reason: matched
            ? `Matched keywords: ${matchedKeywords.join(", ")}`
            : `No keywords found (need any of: ${matcher.keywords.join(", ")})`,
        };
      }
      const matched = matchedKeywords.length === matcher.keywords.length;
      return {
        matched,
        reason: matched
          ? `All keywords matched: ${matchedKeywords.join(", ")}`
          : `Missing keywords: ${matcher.keywords.filter((k) => !matchedKeywords.includes(k)).join(", ")}`,
      };
    }

    case "complexity": {
      const len = prompt.length;
      let level: "low" | "medium" | "high";
      if (len < 100) level = "low";
      else if (len < 300) level = "medium";
      else level = "high";

      const thresholdOrder = { low: 0, medium: 1, high: 2 };
      const matched =
        thresholdOrder[level] >= thresholdOrder[matcher.threshold];
      return {
        matched,
        reason: `Estimated complexity: ${level} (threshold: ${matcher.threshold}, prompt length: ${len})`,
      };
    }

    case "regex": {
      try {
        const re = new RegExp(matcher.pattern, matcher.flags ?? "i");
        const match = re.test(prompt);
        return {
          matched: match,
          reason: match
            ? `Regex /${matcher.pattern}/${matcher.flags ?? "i"} matched`
            : `Regex /${matcher.pattern}/${matcher.flags ?? "i"} did not match`,
        };
      } catch {
        return {
          matched: false,
          reason: `Invalid regex pattern: ${matcher.pattern}`,
        };
      }
    }

    case "project_context":
      return {
        matched: false,
        reason: "Project context matcher unavailable in browser",
      };

    case "always":
      return { matched: true, reason: "Always matcher (catch-all)" };
  }
}
