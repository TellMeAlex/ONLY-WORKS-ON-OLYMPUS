/**
 * Matcher Form Components
 *
 * Provides form components for each of the 5 matcher types:
 * - keyword: Keywords list with any/all mode
 * - complexity: Complexity threshold selector
 * - regex: Pattern input with optional flags
 * - project_context: Project files and dependencies
 * - always: Minimal UI (no configuration needed)
 */

import type {
  Matcher,
  KeywordMatcher,
  ComplexityMatcher,
  RegexMatcher,
  ProjectContextMatcher,
  AlwaysMatcher,
} from "./types";

/**
 * Complexity threshold options
 */
const COMPLEXITY_THRESHOLDS: { value: ComplexityMatcher["threshold"]; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/**
 * Regex flags options
 */
const REGEX_FLAGS = [
  { value: "g", label: "Global (g)", description: "Find all matches" },
  { value: "i", label: "Case-insensitive (i)", description: "Ignore case" },
  { value: "m", label: "Multiline (m)", description: "^ and $ match line boundaries" },
  { value: "s", label: "Dotall (s)", description: ". matches newlines" },
  { value: "u", label: "Unicode (u)", description: "Unicode support" },
];

/**
 * Create a form group with label and input
 *
 * @param labelText - The label text
 * @param inputElement - The input element
 * @param helpText - Optional help text
 * @returns The form group DOM element
 */
function createFormGroup(
  labelText: string,
  inputElement: HTMLInputElement | HTMLSelectElement,
  helpText?: string,
): HTMLElement {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.textContent = labelText;
  label.setAttribute("for", inputElement.id);

  group.appendChild(label);
  group.appendChild(inputElement);

  if (helpText) {
    const help = document.createElement("div");
    help.className = "form-help";
    help.textContent = helpText;
    group.appendChild(help);
  }

  return group;
}

/**
 * Create a tag input field for entering comma-separated values
 *
 * @param id - Input element ID
 * @param values - Current array of values
 * @param placeholder - Placeholder text
 * @param onChange - Callback when values change
 * @returns The input element
 */
function createTagInput(
  id: string,
  values: string[],
  placeholder: string,
  onChange: (values: string[]) => void,
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.name = id;
  input.value = values.join(", ");
  input.placeholder = placeholder;

  input.addEventListener("input", () => {
    const text = input.value.trim();
    const newValues = text === "" ? [] : text.split(",").map((v) => v.trim()).filter((v) => v !== "");
    onChange(newValues);
  });

  return input;
}

// ===================================
// Keyword Matcher Form
// ===================================

/**
 * Create a keyword matcher form
 *
 * @param matcher - Current keyword matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export function createKeywordMatcherForm(
  matcher: KeywordMatcher,
  onChange: (matcher: KeywordMatcher) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "matcher-form matcher-form-keyword";
  form.addEventListener("submit", (e) => e.preventDefault());

  // Keywords input (comma-separated)
  const keywordsInput = createTagInput(
    "matcher-keywords",
    matcher.keywords || [],
    "e.g., refactor, test, debug, fix",
    (keywords) => {
      onChange({ ...matcher, keywords });
    },
  );

  const keywordsGroup = createFormGroup(
    "Keywords",
    keywordsInput,
    "Enter keywords separated by commas",
  );
  form.appendChild(keywordsGroup);

  // Mode selector (any/all)
  const modeSelect = document.createElement("select");
  modeSelect.id = "matcher-keyword-mode";
  modeSelect.name = "mode";

  const anyOption = document.createElement("option");
  anyOption.value = "any";
  anyOption.textContent = "Any keyword matches";
  anyOption.selected = matcher.mode === "any";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All keywords must match";
  allOption.selected = matcher.mode === "all";

  modeSelect.appendChild(anyOption);
  modeSelect.appendChild(allOption);

  modeSelect.addEventListener("change", () => {
    onChange({ ...matcher, mode: modeSelect.value as KeywordMatcher["mode"] });
  });

  const modeGroup = createFormGroup(
    "Match Mode",
    modeSelect,
    "Match if any keyword is found, or all keywords are found",
  );
  form.appendChild(modeGroup);

  return form;
}

/**
 * Validate a keyword matcher
 *
 * @param matcher - The keyword matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateKeywordMatcher(
  matcher: KeywordMatcher,
): { isValid: boolean; error?: string } {
  if (!matcher.keywords || matcher.keywords.length === 0) {
    return { isValid: false, error: "At least one keyword is required" };
  }

  for (const keyword of matcher.keywords) {
    if (keyword.trim() === "") {
      return { isValid: false, error: "Keywords cannot be empty" };
    }
  }

  return { isValid: true };
}

// ===================================
// Complexity Matcher Form
// ===================================

/**
 * Create a complexity matcher form
 *
 * @param matcher - Current complexity matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export function createComplexityMatcherForm(
  matcher: ComplexityMatcher,
  onChange: (matcher: ComplexityMatcher) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "matcher-form matcher-form-complexity";
  form.addEventListener("submit", (e) => e.preventDefault());

  // Threshold selector
  const thresholdSelect = document.createElement("select");
  thresholdSelect.id = "matcher-complexity-threshold";
  thresholdSelect.name = "threshold";

  COMPLEXITY_THRESHOLDS.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === matcher.threshold) {
      opt.selected = true;
    }
    thresholdSelect.appendChild(opt);
  });

  thresholdSelect.addEventListener("change", () => {
    onChange({ ...matcher, threshold: thresholdSelect.value as ComplexityMatcher["threshold"] });
  });

  const thresholdGroup = createFormGroup(
    "Complexity Threshold",
    thresholdSelect,
    "Tasks at or above this threshold will match this rule",
  );
  form.appendChild(thresholdGroup);

  return form;
}

/**
 * Validate a complexity matcher
 *
 * @param matcher - The complexity matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateComplexityMatcher(
  matcher: ComplexityMatcher,
): { isValid: boolean; error?: string } {
  if (!matcher.threshold) {
    return { isValid: false, error: "Complexity threshold is required" };
  }

  if (!["low", "medium", "high"].includes(matcher.threshold)) {
    return { isValid: false, error: "Invalid complexity threshold" };
  }

  return { isValid: true };
}

// ===================================
// Regex Matcher Form
// ===================================

/**
 * Create a regex matcher form
 *
 * @param matcher - Current regex matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export function createRegexMatcherForm(
  matcher: RegexMatcher,
  onChange: (matcher: RegexMatcher) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "matcher-form matcher-form-regex";
  form.addEventListener("submit", (e) => e.preventDefault());

  // Pattern input
  const patternInput = document.createElement("input");
  patternInput.type = "text";
  patternInput.id = "matcher-regex-pattern";
  patternInput.name = "pattern";
  patternInput.value = matcher.pattern || "";
  patternInput.placeholder = 'e.g., /test|spec/i';
  patternInput.spellcheck = false;

  patternInput.addEventListener("input", () => {
    onChange({ ...matcher, pattern: patternInput.value });
  });

  const patternGroup = createFormGroup(
    "Regular Expression Pattern",
    patternInput,
    "The regex pattern to match against (without surrounding slashes)",
  );
  form.appendChild(patternGroup);

  // Flags checkboxes
  const flagsContainer = document.createElement("div");
  flagsContainer.className = "regex-flags-container";

  const flagsLabel = document.createElement("div");
  flagsLabel.className = "form-group-label";
  flagsLabel.textContent = "Flags";
  flagsContainer.appendChild(flagsLabel);

  const flagsHelp = document.createElement("div");
  flagsHelp.className = "form-help";
  flagsHelp.textContent = "Optional regex flags";
  flagsContainer.appendChild(flagsHelp);

  const checkboxesContainer = document.createElement("div");
  checkboxesContainer.className = "regex-flags-checkboxes";

  const currentFlags = matcher.flags || "";

  REGEX_FLAGS.forEach((flag) => {
    const wrapper = document.createElement("div");
    wrapper.className = "regex-flag-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `regex-flag-${flag.value}`;
    checkbox.value = flag.value;
    checkbox.checked = currentFlags.includes(flag.value);

    checkbox.addEventListener("change", () => {
      const checkedBoxes = checkboxesContainer.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]:checked',
      );
      const newFlags = Array.from(checkedBoxes).map((cb) => cb.value).join("");
      onChange({ ...matcher, flags: newFlags || undefined });
    });

    const label = document.createElement("label");
    label.htmlFor = `regex-flag-${flag.value}`;
    label.className = "regex-flag-label";

    const labelText = document.createElement("span");
    labelText.textContent = flag.label;
    label.appendChild(labelText);

    const labelDesc = document.createElement("span");
    labelDesc.className = "regex-flag-description";
    labelDesc.textContent = flag.description;
    label.appendChild(labelDesc);

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    checkboxesContainer.appendChild(wrapper);
  });

  flagsContainer.appendChild(checkboxesContainer);
  form.appendChild(flagsContainer);

  // Pattern validation preview
  const previewContainer = document.createElement("div");
  previewContainer.className = "regex-preview-container";

  const previewLabel = document.createElement("div");
  previewLabel.className = "form-group-label";
  previewLabel.textContent = "Pattern Preview";
  previewContainer.appendChild(previewLabel);

  const previewOutput = document.createElement("div");
  previewOutput.className = "regex-preview-output";
  previewOutput.textContent = `/${matcher.pattern || ""}/${currentFlags}`;

  patternInput.addEventListener("input", () => {
    previewOutput.textContent = `/${patternInput.value || ""}/${currentFlags}`;
  });

  checkboxesContainer.addEventListener("change", () => {
    const checkedBoxes = checkboxesContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:checked',
    );
    const newFlags = Array.from(checkedBoxes).map((cb) => cb.value).join("");
    previewOutput.textContent = `/${patternInput.value || ""}/${newFlags}`;
  });

  previewContainer.appendChild(previewOutput);
  form.appendChild(previewContainer);

  return form;
}

/**
 * Validate a regex matcher
 *
 * @param matcher - The regex matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateRegexMatcher(
  matcher: RegexMatcher,
): { isValid: boolean; error?: string } {
  if (!matcher.pattern || matcher.pattern.trim() === "") {
    return { isValid: false, error: "Pattern is required" };
  }

  try {
    const flags = matcher.flags || "";
    new RegExp(matcher.pattern, flags);
  } catch (e) {
    return {
      isValid: false,
      error: `Invalid regex pattern: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }

  return { isValid: true };
}

// ===================================
// Project Context Matcher Form
// ===================================

/**
 * Create a project context matcher form
 *
 * @param matcher - Current project context matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export function createProjectContextMatcherForm(
  matcher: ProjectContextMatcher,
  onChange: (matcher: ProjectContextMatcher) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "matcher-form matcher-form-project-context";
  form.addEventListener("submit", (e) => e.preventDefault());

  // has_files input
  const hasFilesInput = createTagInput(
    "matcher-has-files",
    matcher.has_files || [],
    "e.g., package.json, tsconfig.json, vite.config.ts",
    (has_files) => {
      onChange({ ...matcher, has_files });
    },
  );

  const hasFilesGroup = createFormGroup(
    "Has Files",
    hasFilesInput,
    "Match if the project contains these files (comma-separated)",
  );
  form.appendChild(hasFilesGroup);

  // has_deps input
  const hasDepsInput = createTagInput(
    "matcher-has-deps",
    matcher.has_deps || [],
    "e.g., react, vue, typescript, lodash",
    (has_deps) => {
      onChange({ ...matcher, has_deps });
    },
  );

  const hasDepsGroup = createFormGroup(
    "Has Dependencies",
    hasDepsInput,
    "Match if the project depends on these packages (comma-separated)",
  );
  form.appendChild(hasDepsGroup);

  // Help note
  const note = document.createElement("div");
  note.className = "matcher-form-note";
  note.textContent = "At least one condition (files or dependencies) should be specified";
  form.appendChild(note);

  return form;
}

/**
 * Validate a project context matcher
 *
 * @param matcher - The project context matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateProjectContextMatcher(
  matcher: ProjectContextMatcher,
): { isValid: boolean; error?: string } {
  const hasFiles = matcher.has_files && matcher.has_files.length > 0;
  const hasDeps = matcher.has_deps && matcher.has_deps.length > 0;

  if (!hasFiles && !hasDeps) {
    return {
      isValid: false,
      error: "At least one condition (files or dependencies) must be specified",
    };
  }

  return { isValid: true };
}

// ===================================
// Always Matcher Form (Minimal)
// ===================================

/**
 * Create an always matcher form (minimal UI)
 *
 * @param matcher - Current always matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export function createAlwaysMatcherForm(
  matcher: AlwaysMatcher,
  onChange: (matcher: AlwaysMatcher) => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "matcher-form matcher-form-always";
  form.addEventListener("submit", (e) => e.preventDefault());

  const info = document.createElement("div");
  info.className = "matcher-always-info";
  info.textContent = "This rule will always match and should typically be used as a fallback rule";
  form.appendChild(info);

  return form;
}

/**
 * Validate an always matcher
 *
 * @param _matcher - The always matcher to validate
 * @returns Always valid
 */
export function validateAlwaysMatcher(
  _matcher: AlwaysMatcher,
): { isValid: boolean; error?: string } {
  return { isValid: true };
}

// ===================================
// Generic Matcher Form Factory
// ===================================

/**
 * Create a matcher form based on the matcher type
 *
 * @param matcher - The matcher to create a form for
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 * @throws Error if matcher type is unknown
 */
export function createMatcherForm(
  matcher: Matcher,
  onChange: (matcher: Matcher) => void,
): HTMLFormElement {
  switch (matcher.type) {
    case "keyword":
      return createKeywordMatcherForm(
        matcher,
        (updated) => onChange(updated),
      );
    case "complexity":
      return createComplexityMatcherForm(
        matcher,
        (updated) => onChange(updated),
      );
    case "regex":
      return createRegexMatcherForm(
        matcher,
        (updated) => onChange(updated),
      );
    case "project_context":
      return createProjectContextMatcherForm(
        matcher,
        (updated) => onChange(updated),
      );
    case "always":
      return createAlwaysMatcherForm(
        matcher,
        (updated) => onChange(updated),
      );
    default:
      throw new Error(`Unknown matcher type: ${(matcher as Matcher).type}`);
  }
}

/**
 * Validate a matcher based on its type
 *
 * @param matcher - The matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateMatcher(
  matcher: Matcher,
): { isValid: boolean; error?: string } {
  switch (matcher.type) {
    case "keyword":
      return validateKeywordMatcher(matcher);
    case "complexity":
      return validateComplexityMatcher(matcher);
    case "regex":
      return validateRegexMatcher(matcher);
    case "project_context":
      return validateProjectContextMatcher(matcher);
    case "always":
      return validateAlwaysMatcher(matcher);
    default:
      return { isValid: false, error: `Unknown matcher type: ${(matcher as Matcher).type}` };
  }
}

/**
 * Render a matcher form into a container
 *
 * @param container - The container element to render into
 * @param matcher - The matcher to create a form for
 * @param onChange - Callback when matcher data changes
 * @throws Error if container is not found
 */
export function renderMatcherForm(
  container: HTMLElement,
  matcher: Matcher,
  onChange: (matcher: Matcher) => void,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  container.innerHTML = "";
  const form = createMatcherForm(matcher, onChange);
  container.appendChild(form);
}

/**
 * Initialize a matcher form with update/destroy methods
 *
 * @param containerId - The ID of the container element
 * @param matcher - The matcher to create a form for
 * @param onChange - Callback when matcher data changes
 * @returns Object with update and destroy methods
 */
export function initializeMatcherForm(
  containerId: string,
  matcher: Matcher,
  onChange: (matcher: Matcher) => void,
): {
  update: (matcher: Matcher) => void;
  destroy: () => void;
} {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }

  let currentMatcher: Matcher = { ...matcher };

  const handleChange = (updatedMatcher: Matcher): void => {
    currentMatcher = updatedMatcher;
    onChange(updatedMatcher);
  };

  renderMatcherForm(container, currentMatcher, handleChange);

  return {
    update: (newMatcher: Matcher): void => {
      currentMatcher = { ...newMatcher };
      renderMatcherForm(container, currentMatcher, handleChange);
    },
    destroy: (): void => {
      container.innerHTML = "";
    },
  };
}
