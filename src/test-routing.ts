import {
  evaluateRoutingRules,
  evaluateMatcher,
  type RoutingContext,
} from "./agents/routing.js";
import type { RoutingRule } from "./config/schema.js";

const testContext: RoutingContext = {
  prompt: "I need help with database architecture optimization",
  projectDir: "/test",
  projectDeps: ["react", "typescript"],
};

const testRules: RoutingRule[] = [
  {
    matcher: { type: "keyword", keywords: ["database"], mode: "any" },
    target_agent: "oracle",
  },
  {
    matcher: { type: "keyword", keywords: ["ui", "button"], mode: "all" },
    target_agent: "sisyphus",
  },
  {
    matcher: { type: "always" },
    target_agent: "hephaestus",
  },
];

console.log("Testing keyword matcher (should match first rule):");
const result1 = evaluateRoutingRules(testRules, testContext);
console.log("Result:", result1);
console.log("Expected: target_agent=oracle\n");

console.log("Testing first-match-wins (database matches before always):");
const testContext2: RoutingContext = {
  prompt: "help with ui buttons",
  projectDir: "/test",
};
const result2 = evaluateRoutingRules(testRules, testContext2);
console.log("Result:", result2);
console.log(
  "Expected: target_agent=hephaestus (no keyword match for ui+button)\n"
);

console.log("Testing regex matcher:");
const regexRules: RoutingRule[] = [
  {
    matcher: { type: "regex", pattern: "^(design|ui|front)" },
    target_agent: "sisyphus",
  },
];
const regexContext: RoutingContext = {
  prompt: "design a new landing page",
  projectDir: "/test",
};
const result3 = evaluateRoutingRules(regexRules, regexContext);
console.log("Result:", result3);
console.log("Expected: target_agent=sisyphus\n");

console.log("Testing complexity matcher:");
const complexityRules: RoutingRule[] = [
  {
    matcher: { type: "complexity", threshold: "high" },
    target_agent: "metis",
  },
];
const complexContext: RoutingContext = {
  prompt: `I need help with:
- Database architecture optimization
- API integration patterns
- Security and encryption strategies
- Deployment infrastructure
- Performance profiling
- Concurrent async algorithms
- Authentication mechanisms`,
  projectDir: "/test",
};
const result4 = evaluateRoutingRules(complexityRules, complexContext);
console.log("Result:", result4);
console.log("Expected: target_agent=metis\n");

console.log("All tests completed");
