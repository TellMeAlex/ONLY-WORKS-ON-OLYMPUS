/**
 * Matcher Type Selector Component
 *
 * Provides a UI for selecting between the 5 matcher types:
 * - keyword: Match based on keywords with any/all mode
 * - complexity: Match based on task complexity threshold
 * - regex: Match based on regular expression pattern
 * - project_context: Match based on project files/dependencies
 * - always: Always match (fallback rule)
 */

import type { Matcher, KeywordMatcher, ComplexityMatcher, RegexMatcher, ProjectContextMatcher, AlwaysMatcher } from "./types";

/**
 * Available matcher types with their display labels and descriptions
 */
export interface MatcherTypeOption {
  value: Matcher["type"];
  label: string;
  description: string;
}

/**
 * All available matcher type options
 */
export const MATCHER_TYPES: MatcherTypeOption[] = [
  {
    value: "keyword",
    label: "Keyword",
    description: "Match based on presence of specific keywords",
  },
  {
    value: "complexity",
    label: "Complexity",
    description: "Match based on task complexity (low/medium/high)",
  },
  {
    value: "regex",
    label: "Regular Expression",
    description: "Match based on a regular expression pattern",
  },
  {
    value: "project_context",
    label: "Project Context",
    description: "Match based on project files or dependencies",
  },
  {
    value: "always",
    label: "Always (Fallback)",
    description: "Always match, typically used as a fallback rule",
  },
];

/**
 * Get the default matcher object for a given type
 *
 * @param type - The matcher type
 * @returns A default matcher object for the type
 */
export function getDefaultMatcher(type: Matcher["type"]): Matcher {
  switch (type) {
    case "keyword":
      return {
        type: "keyword",
        keywords: [],
        mode: "any",
      } as KeywordMatcher;
    case "complexity":
      return {
        type: "complexity",
        threshold: "medium",
      } as ComplexityMatcher;
    case "regex":
      return {
        type: "regex",
        pattern: "",
      } as RegexMatcher;
    case "project_context":
      return {
        type: "project_context",
      } as ProjectContextMatcher;
    case "always":
      return {
        type: "always",
      } as AlwaysMatcher;
    default:
      throw new Error(`Unknown matcher type: ${type}`);
  }
}

/**
 * Create a matcher type selector as a radio button group
 *
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @returns The selector DOM element
 */
export function createMatcherSelector(
  selectedType: Matcher["type"],
  onChange: (type: Matcher["type"]) => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "matcher-selector";
  container.setAttribute("role", "radiogroup");
  container.setAttribute("aria-label", "Matcher type selection");

  const label = document.createElement("label");
  label.className = "matcher-selector-label";
  label.textContent = "Matcher Type";
  container.appendChild(label);

  const help = document.createElement("div");
  help.className = "form-help";
  help.textContent = "Select how this rule should match incoming requests";
  container.appendChild(help);

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "matcher-selector-options";

  MATCHER_TYPES.forEach((option) => {
    const optionWrapper = document.createElement("div");
    optionWrapper.className = "matcher-selector-option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.id = `matcher-type-${option.value}`;
    radio.name = "matcher-type";
    radio.value = option.value;
    radio.checked = selectedType === option.value;
    radio.setAttribute("aria-label", option.label);

    radio.addEventListener("change", () => {
      if (radio.checked) {
        onChange(option.value);
      }
    });

    const optionLabel = document.createElement("label");
    optionLabel.htmlFor = `matcher-type-${option.value}`;
    optionLabel.className = "matcher-selector-option-label";

    const labelText = document.createElement("span");
    labelText.className = "matcher-option-title";
    labelText.textContent = option.label;

    const labelDesc = document.createElement("span");
    labelDesc.className = "matcher-option-description";
    labelDesc.textContent = option.description;

    optionLabel.appendChild(labelText);
    optionLabel.appendChild(labelDesc);

    optionWrapper.appendChild(radio);
    optionWrapper.appendChild(optionLabel);
    optionsContainer.appendChild(optionWrapper);
  });

  container.appendChild(optionsContainer);

  return container;
}

/**
 * Create a matcher type selector as a dropdown (select element)
 *
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @param id - Optional ID for the select element
 * @returns The select element wrapped in a container
 */
export function createMatcherSelectorDropdown(
  selectedType: Matcher["type"],
  onChange: (type: Matcher["type"]) => void,
  id: string = "matcher-type-select",
): HTMLElement {
  const container = document.createElement("div");
  container.className = "form-group";

  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = "Matcher Type";
  container.appendChild(label);

  const select = document.createElement("select");
  select.id = id;
  select.className = "form-group-select";

  MATCHER_TYPES.forEach((option) => {
    const selectOption = document.createElement("option");
    selectOption.value = option.value;
    selectOption.textContent = option.label;
    if (option.value === selectedType) {
      selectOption.selected = true;
    }
    select.appendChild(selectOption);
  });

  select.addEventListener("change", () => {
    onChange(select.value as Matcher["type"]);
  });

  container.appendChild(select);

  // Add help text showing description of selected type
  const help = document.createElement("div");
  help.className = "form-help";
  help.id = `${id}-help`;

  const updateHelpText = (type: Matcher["type"]): void => {
    const selectedOption = MATCHER_TYPES.find((opt) => opt.value === type);
    if (selectedOption) {
      help.textContent = selectedOption.description;
    }
  };

  updateHelpText(selectedType);
  container.appendChild(help);

  // Update help text when selection changes
  select.addEventListener("change", () => {
    updateHelpText(select.value as Matcher["type"]);
  });

  return container;
}

/**
 * Validate a matcher type value
 *
 * @param value - The value to validate
 * @returns True if the value is a valid matcher type
 */
export function isValidMatcherType(value: string): value is Matcher["type"] {
  return MATCHER_TYPES.some((opt) => opt.value === value);
}

/**
 * Get matcher type option by value
 *
 * @param value - The matcher type value
 * @returns The matcher type option or undefined if not found
 */
export function getMatcherTypeOption(
  value: Matcher["type"],
): MatcherTypeOption | undefined {
  return MATCHER_TYPES.find((opt) => opt.value === value);
}

/**
 * Render a matcher selector into a container
 *
 * @param container - The container element to render into
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @param useDropdown - Whether to use dropdown (true) or radio buttons (false)
 */
export function renderMatcherSelector(
  container: HTMLElement,
  selectedType: Matcher["type"],
  onChange: (type: Matcher["type"]) => void,
  useDropdown: boolean = false,
): void {
  if (!container) {
    throw new Error("Container element is required");
  }

  container.innerHTML = "";

  if (useDropdown) {
    const selector = createMatcherSelectorDropdown(selectedType, onChange);
    container.appendChild(selector);
  } else {
    const selector = createMatcherSelector(selectedType, onChange);
    container.appendChild(selector);
  }
}

/**
 * Initialize a matcher selector with event handling
 *
 * @param containerId - The ID of the container element
 * @param selectedType - Currently selected matcher type
 * @param onChange - Callback when selection changes
 * @param useDropdown - Whether to use dropdown (true) or radio buttons (false)
 * @returns Object with update and destroy methods
 */
export function initializeMatcherSelector(
  containerId: string,
  selectedType: Matcher["type"],
  onChange: (type: Matcher["type"]) => void,
  useDropdown: boolean = false,
): {
  update: (type: Matcher["type"]) => void;
  destroy: () => void;
} {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(`Container element with ID "${containerId}" not found`);
  }

  if (!isValidMatcherType(selectedType)) {
    throw new Error(`Invalid matcher type: ${selectedType}`);
  }

  let currentType = selectedType;

  const handleChange = (type: Matcher["type"]): void => {
    if (isValidMatcherType(type)) {
      currentType = type;
      onChange(type);
    }
  };

  renderMatcherSelector(container, currentType, handleChange, useDropdown);

  return {
    update: (type: Matcher["type"]): void => {
      if (isValidMatcherType(type)) {
        currentType = type;
        renderMatcherSelector(container, currentType, handleChange, useDropdown);
      }
    },
    destroy: (): void => {
      container.innerHTML = "";
    },
  };
}
