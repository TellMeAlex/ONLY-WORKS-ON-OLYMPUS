/**
 * Deprecation warning utilities for API stability policy.
 *
 * @since 0.4.0
 * @stable
 *
 * This module provides utilities for emitting and tracking deprecation warnings
 * in accordance with the API Stability Policy defined in STABILITY.md.
 *
 * @see {@link https://github.com/anthropics/olimpus/blob/main/docs/STABILITY.md | STABILITY.md} for the full deprecation policy
 */

/**
 * Set of deprecation warnings that have already been emitted during this session.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * Used to prevent duplicate warnings from being emitted multiple times.
 */
const EMITTED_WARNINGS = new Set<string>();

/**
 * Configuration options for deprecation warnings.
 *
 * @since 0.4.0
 * @stable
 *
 * @example
 * ```ts
 * deprecationWarn({
 *   api: "OldFunction",
 *   version: "0.4.0",
 *   replacement: "newFunction",
 *   removal: "1.0.0",
 *   docsUrl: "./docs/migration-v0.4.0.md"
 * });
 * ```
 */
export interface DeprecationOptions {
  /** The name of the deprecated API (function, class, config field, etc.) */
  api: string;
  /** The version when this API was deprecated */
  version: string;
  /** The name of the replacement API (if applicable) */
  replacement?: string;
  /** The version when this API will be removed */
  removal?: string;
  /** URL to migration documentation */
  docsUrl?: string;
  /** Additional context or information for the deprecation */
  message?: string;
}

/**
 * Formats a deprecation warning message for display.
 *
 * @since 0.4.0
 * @stable
 *
 * Creates a formatted warning message with ANSI colors for terminal display.
 *
 * @param options - Deprecation configuration options
 * @returns Formatted warning message string
 *
 * @example
 * ```ts
 * const message = formatDeprecationMessage({
 *   api: "OldFunction",
 *   version: "0.4.0",
 *   replacement: "newFunction",
 *   removal: "1.0.0"
 * });
 * // Returns:
 * // [DEPRECATION WARNING] OldFunction is deprecated since v0.4.0.
 * //   Replacement: newFunction
 * //   Will be removed in: v1.0.0
 * ```
 */
export function formatDeprecationMessage(options: DeprecationOptions): string {
  const { api, version, replacement, removal, docsUrl, message } = options;

  let warning = `[DEPRECATION WARNING] ${api} is deprecated since v${version}.`;

  if (message) {
    warning += `\n  ${message}`;
  }

  if (replacement) {
    warning += `\n  Replacement: ${replacement}`;
  }

  if (removal) {
    warning += `\n  Will be removed in: v${removal}`;
  }

  if (docsUrl) {
    warning += `\n  Documentation: ${docsUrl}`;
  }

  return warning;
}

/**
 * Emits a deprecation warning to stderr.
 *
 * @since 0.4.0
 * @stable
 *
 * Emits a formatted deprecation warning to stderr. Each unique deprecation
 * is only emitted once per session to avoid spamming the console.
 *
 * @param options - Deprecation configuration options
 *
 * @example
 * ```ts
 * export function oldFunction(): string {
 *   deprecationWarn({
 *     api: "oldFunction",
 *     version: "0.4.0",
 *     replacement: "newFunction",
 *     removal: "1.0.0",
 *     docsUrl: "./docs/migration-v0.4.0.md"
 *   });
 *   return newFunction();
 * }
 * ```
 */
export function deprecationWarn(options: DeprecationOptions): void {
  const { api, version } = options;

  // Create a unique key for this deprecation
  const key = `${api}:${version}`;

  // Only warn once per session per API version
  if (EMITTED_WARNINGS.has(key)) {
    return;
  }

  // Mark this warning as emitted
  EMITTED_WARNINGS.add(key);

  // Format and emit the warning
  const message = formatDeprecationMessage(options);
  console.warn(message);
}

/**
 * Checks if an API has been marked as deprecated and emits a warning if so.
 *
 * @since 0.4.0
 * @stable
 *
 * Conditional warning emission - only emits if the current version meets
 * the deprecation threshold. Useful for gradual deprecation rollout.
 *
 * @param api - The name of the API to check
 * @param deprecatedSince - The version when the API was deprecated
 * @param currentVersion - The current version (defaults to package version if available)
 * @param options - Additional deprecation configuration
 * @returns true if the API is deprecated and a warning was emitted
 *
 * @example
 * ```ts
 * if (isDeprecated("oldConfig", "0.4.0", "0.5.0", {
 *   replacement: "newConfig",
 *   removal: "1.0.0"
 * })) {
 *   // Migration handling...
 * }
 * ```
 */
export function isDeprecated(
  api: string,
  deprecatedSince: string,
  currentVersion: string | undefined = undefined,
  options?: Partial<DeprecationOptions>,
): boolean {
  // If currentVersion not provided, we can't compare - emit warning
  // This is conservative behavior - assume deprecated
  if (!currentVersion) {
    deprecationWarn({ api, version: deprecatedSince, ...options });
    return true;
  }

  // Simple version comparison (works for 0.x versions)
  const isDeprecatedVersion =
    compareVersions(currentVersion, deprecatedSince) > 0;

  if (isDeprecatedVersion) {
    deprecationWarn({ api, version: deprecatedSince, ...options });
    return true;
  }

  return false;
}

/**
 * Compares two version strings.
 *
 * @since 0.4.0
 * @internal
 * Not intended for external use.
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Positive if a > b, negative if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string): number[] => {
    // Remove 'v' prefix and split by '.'
    const clean = v.replace(/^v/, "");
    return clean.split(".").map((part) => parseInt(part, 10) || 0);
  };

  const partsA = parseVersion(a);
  const partsB = parseVersion(b);

  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i] ?? 0;
    const partB = partsB[i] ?? 0;

    if (partA > partB) return 1;
    if (partA < partB) return -1;
  }

  return 0;
}

/**
 * Clears the cache of emitted deprecation warnings.
 *
 * @since 0.4.0
 * @stable
 *
 * Primarily used in testing to reset warning state between test cases.
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   clearEmittedWarnings();
 * });
 * ```
 */
export function clearEmittedWarnings(): void {
  EMITTED_WARNINGS.clear();
}

/**
 * Gets the set of warnings that have been emitted.
 *
 * @since 0.4.0
 * @stable
 *
 * Useful for testing to verify that expected warnings were emitted.
 *
 * @returns Set of warning keys that have been emitted
 *
 * @example
 * ```ts
 * deprecationWarn({ api: "test", version: "0.4.0" });
 * const emitted = getEmittedWarnings();
 * // emitted contains "test:0.4.0"
 * ```
 */
export function getEmittedWarnings(): Set<string> {
  return new Set(EMITTED_WARNINGS);
}

/**
 * Checks if a specific deprecation warning has been emitted.
 *
 * @since 0.4.0
 * @stable
 *
 * @param api - The name of the API
 * @param version - The deprecation version
 * @returns true if the warning has been emitted
 *
 * @example
 * ```ts
 * if (!hasEmittedWarning("OldFunction", "0.4.0")) {
 *   deprecationWarn({ api: "OldFunction", version: "0.4.0" });
 * }
 * ```
 */
export function hasEmittedWarning(api: string, version: string): boolean {
  const key = `${api}:${version}`;
  return EMITTED_WARNINGS.has(key);
}

/**
 * Creates a deprecation error for throwing when deprecated APIs are called.
 *
 * @since 0.4.0
 * @stable
 *
 * Use this when you want to throw an error instead of just emitting a warning.
 * This is useful for APIs that are no longer supported.
 *
 * @param options - Deprecation configuration options
 * @returns Error object with formatted deprecation message
 *
 * @example
 * ```ts
 * export function removedFunction(): never {
 *   throw createDeprecationError({
 *     api: "removedFunction",
 *     version: "0.4.0",
 *     removal: "0.5.0",
 *     message: "This function was removed and is no longer available."
 *   });
 * }
 * ```
 */
export function createDeprecationError(options: DeprecationOptions): Error {
  const message = formatDeprecationMessage(options);
  return new Error(message);
}
