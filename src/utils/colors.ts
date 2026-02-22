/**
 * ANSI Color Codes for terminal output
 *
 * Provides helper functions for colored and styled console output.
 * Colors include success (green), warning (yellow), error (red), info (cyan).
 * Styles include bold, dim, and reset.
 */

/**
 * ANSI escape codes for terminal colors and styles
 */
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
} as const;

/**
 * Wraps text with green color for success messages
 * @param text - The text to color
 * @returns Text wrapped with ANSI green codes
 */
export function success(text: string): string {
  return `${ANSI.green}${text}${ANSI.reset}`;
}

/**
 * Wraps text with yellow color for warning messages
 * @param text - The text to color
 * @returns Text wrapped with ANSI yellow codes
 */
export function warning(text: string): string {
  return `${ANSI.yellow}${text}${ANSI.reset}`;
}

/**
 * Wraps text with red color for error messages
 * @param text - The text to color
 * @returns Text wrapped with ANSI red codes
 */
export function error(text: string): string {
  return `${ANSI.red}${text}${ANSI.reset}`;
}

/**
 * Wraps text with cyan color for info messages
 * @param text - The text to color
 * @returns Text wrapped with ANSI cyan codes
 */
export function info(text: string): string {
  return `${ANSI.cyan}${text}${ANSI.reset}`;
}

/**
 * Wraps text with bold style for emphasis
 * @param text - The text to style
 * @returns Text wrapped with ANSI bold codes
 */
export function bold(text: string): string {
  return `${ANSI.bold}${text}${ANSI.reset}`;
}

/**
 * Wraps text with dim style for secondary information
 * @param text - The text to style
 * @returns Text wrapped with ANSI dim codes
 */
export function dim(text: string): string {
  return `${ANSI.dim}${text}${ANSI.reset}`;
}

/**
 * Resets all ANSI formatting
 * @returns The ANSI reset code
 */
export function reset(): string {
  return ANSI.reset;
}
