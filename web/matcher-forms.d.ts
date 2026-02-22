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
import type { Matcher, KeywordMatcher, ComplexityMatcher, RegexMatcher, ProjectContextMatcher, AlwaysMatcher } from "./types";
/**
 * Create a keyword matcher form
 *
 * @param matcher - Current keyword matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export declare function createKeywordMatcherForm(matcher: KeywordMatcher, onChange: (matcher: KeywordMatcher) => void): HTMLFormElement;
/**
 * Validate a keyword matcher
 *
 * @param matcher - The keyword matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateKeywordMatcher(matcher: KeywordMatcher): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a complexity matcher form
 *
 * @param matcher - Current complexity matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export declare function createComplexityMatcherForm(matcher: ComplexityMatcher, onChange: (matcher: ComplexityMatcher) => void): HTMLFormElement;
/**
 * Validate a complexity matcher
 *
 * @param matcher - The complexity matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateComplexityMatcher(matcher: ComplexityMatcher): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a regex matcher form
 *
 * @param matcher - Current regex matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export declare function createRegexMatcherForm(matcher: RegexMatcher, onChange: (matcher: RegexMatcher) => void): HTMLFormElement;
/**
 * Validate a regex matcher
 *
 * @param matcher - The regex matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateRegexMatcher(matcher: RegexMatcher): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a project context matcher form
 *
 * @param matcher - Current project context matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export declare function createProjectContextMatcherForm(matcher: ProjectContextMatcher, onChange: (matcher: ProjectContextMatcher) => void): HTMLFormElement;
/**
 * Validate a project context matcher
 *
 * @param matcher - The project context matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateProjectContextMatcher(matcher: ProjectContextMatcher): {
    isValid: boolean;
    error?: string;
};
/**
 * Create an always matcher form (minimal UI)
 *
 * @param matcher - Current always matcher
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 */
export declare function createAlwaysMatcherForm(matcher: AlwaysMatcher, onChange: (matcher: AlwaysMatcher) => void): HTMLFormElement;
/**
 * Validate an always matcher
 *
 * @param _matcher - The always matcher to validate
 * @returns Always valid
 */
export declare function validateAlwaysMatcher(_matcher: AlwaysMatcher): {
    isValid: boolean;
    error?: string;
};
/**
 * Create a matcher form based on the matcher type
 *
 * @param matcher - The matcher to create a form for
 * @param onChange - Callback when matcher data changes
 * @returns The form DOM element
 * @throws Error if matcher type is unknown
 */
export declare function createMatcherForm(matcher: Matcher, onChange: (matcher: Matcher) => void): HTMLFormElement;
/**
 * Validate a matcher based on its type
 *
 * @param matcher - The matcher to validate
 * @returns An object with isValid flag and error message if invalid
 */
export declare function validateMatcher(matcher: Matcher): {
    isValid: boolean;
    error?: string;
};
/**
 * Render a matcher form into a container
 *
 * @param container - The container element to render into
 * @param matcher - The matcher to create a form for
 * @param onChange - Callback when matcher data changes
 * @throws Error if container is not found
 */
export declare function renderMatcherForm(container: HTMLElement, matcher: Matcher, onChange: (matcher: Matcher) => void): void;
/**
 * Initialize a matcher form with update/destroy methods
 *
 * @param containerId - The ID of the container element
 * @param matcher - The matcher to create a form for
 * @param onChange - Callback when matcher data changes
 * @returns Object with update and destroy methods
 */
export declare function initializeMatcherForm(containerId: string, matcher: Matcher, onChange: (matcher: Matcher) => void): {
    update: (matcher: Matcher) => void;
    destroy: () => void;
};
//# sourceMappingURL=matcher-forms.d.ts.map