import type { MetaAgentDef } from "../../config/schema.js";

/**
 * Atenea Meta-Agent - Framework & Component Research Orchestrator
 *
 * Specialized routing for researching frameworks, libraries, and components:
 * - Framework detection → librarian (research phase)
 * - Component search → librarian (catalog search)
 * - Codebase patterns → explore (pattern matching)
 * - Planning with research → prometheus (planning phase with findings)
 *
 * All routes instruct delegates to:
 * 1. Research available components/patterns
 * 2. Document findings in .sisyphus/research/{framework-name}.md
 * 3. Delegate to prometheus with research context for planning
 *
 * Priority: Inditex libraries (amiga-fwk-web, amiga-*, @inditex/*) > External libraries
 */

export const atenea: MetaAgentDef = {
  base_model: "",
  description:
    "Framework and component research orchestrator — investigates libraries with Inditex ecosystem priority",
  mode: "subagent",
  color: "#E8A317",
  hidden: true,
  permission: {
    edit: "deny",
    bash: "ask",
    webfetch: "allow",
    task: "allow",
    doom_loop: "deny",
    external_directory: "deny",
  },
  prompt_template:
    "You are Atenea, the research orchestrator for the Olimpus plugin system.\n\n" +
    "Your role is to investigate frameworks, libraries, and components before implementation.\n" +
    "You prioritize Inditex ecosystem libraries (amiga-fwk-web, amiga-*, @inditex/*).\n\n" +
    "Research workflow:\n" +
    "1. Check if the component/pattern exists in Inditex ecosystem first\n" +
    "2. Search external libraries only if not found internally\n" +
    "3. Document findings in .sisyphus/research/ directory\n" +
    "4. Delegate to prometheus with research context for planning\n\n" +
    "Always document research findings before delegating implementation.",
  delegates_to: ["librarian", "explore", "prometheus"],
  routing_rules: [
    {
      matcher: {
        type: "regex",
        pattern:
          "(amiga-fwk-web|amiga|inditex|radix|chakra|mantine|material-ui|tailwind|next\\.js|react|vue|angular|zod|tanstack)",
        flags: "i",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "PHASE 1: FRAMEWORK RESEARCH (MANDATORY)\n\n" +
          "Extract the framework/library mentioned in the request.\n\n" +
          "Research Priority:\n" +
          "1. **Inditex Libraries** (HIGHEST PRIORITY):\n" +
          "   - amiga-fwk-web documentation and components\n" +
          "   - Other Inditex internal libraries\n" +
          "   - Inditex GitHub repos with examples\n\n" +
          "2. **External Libraries** (if not in Inditex ecosystem):\n" +
          "   - Official documentation\n" +
          "   - Production examples (1000+ stars repos)\n" +
          "   - Integration patterns\n\n" +
          "Document findings in .sisyphus/research/{framework-name}.md with this structure:\n\n" +
          "# {Framework} Research\n\n" +
          "## Available in Inditex?\n" +
          "[YES/NO - if yes, specify repo/package]\n\n" +
          "## Official Docs\n" +
          "[URL]\n\n" +
          "## Key Components/Patterns\n" +
          "[List with code examples]\n\n" +
          "## Integration Steps\n" +
          "[Installation + setup]\n\n" +
          "## Inditex Examples\n" +
          "[Links to internal repos using this]\n\n" +
          "## Best Practices\n" +
          "[From official docs or Inditex standards]\n\n" +
          "After completing research, delegate to prometheus with the research findings.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "component",
          "library",
          "pattern",
          "example",
          "exists",
          "available",
        ],
        mode: "any",
      },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "Search for existing components/patterns with these priorities:\n\n" +
          "1. Check amiga-fwk-web component catalog\n" +
          "2. Search Inditex GitHub repos for similar implementations\n" +
          "3. Search external component libraries if not found internally\n\n" +
          "Report findings with:\n" +
          "- Component/pattern name\n" +
          "- Location (file path or package)\n" +
          "- Code examples showing usage\n" +
          "- Links to documentation or source\n" +
          "- Whether it's from Inditex or external\n\n" +
          "Save research to .sisyphus/research/{component-type}.md",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: [
          "how do we",
          "similar to",
          "like we did",
          "pattern in our code",
        ],
        mode: "any",
      },
      target_agent: "explore",
      config_overrides: {
        prompt:
          "Search the codebase for similar implementations and patterns.\n\n" +
          "Find:\n" +
          "- Existing code patterns that match the request\n" +
          "- Conventions used in this project\n" +
          "- Similar solutions already implemented\n" +
          "- File paths with context\n\n" +
          "Return file paths and code snippets showing relevant patterns.",
      },
    },
    {
      matcher: {
        type: "keyword",
        keywords: ["plan", "implement", "create", "add"],
        mode: "any",
      },
      target_agent: "prometheus",
      config_overrides: {
        prompt:
          "Create a comprehensive work plan that incorporates research findings.\n\n" +
          "Prioritization:\n" +
          "1. Use existing Inditex/amiga-fwk-web components when available\n" +
          "2. Follow established patterns from codebase research\n" +
          "3. Include setup steps for new dependencies\n" +
          "4. Plan integration with existing systems\n\n" +
          "The plan should reference research findings and existing patterns discovered by previous agents.\n" +
          "Include implementation steps, testing strategy, and integration points.",
      },
    },
    {
      matcher: { type: "always" },
      target_agent: "librarian",
      config_overrides: {
        prompt:
          "Research and document frameworks, libraries, or patterns relevant to this request.\n\n" +
          "Focus on:\n" +
          "1. Inditex ecosystem first (amiga-fwk-web, amiga-*, @inditex/*)\n" +
          "2. External libraries and best practices\n" +
          "3. Integration patterns\n\n" +
          "Save findings to .sisyphus/research/ directory for future reference.",
      },
    },
  ],
};
