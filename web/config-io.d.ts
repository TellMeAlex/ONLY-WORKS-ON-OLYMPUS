/**
 * Configuration I/O utilities for Olimpus web editor
 * Handles JSONC parsing, URL encoding, and file import/export
 */
import type { OlimpusConfig } from "./types";
export declare function parseJsonc(content: string): OlimpusConfig;
/**
 * Export configuration as JSONC with schema reference
 *
 * @param config - Configuration to export
 * @param pretty - Whether to pretty-print with 2-space indentation
 * @returns JSONC string with schema reference header
 */
export declare function exportJsonc(config: OlimpusConfig, pretty?: boolean): string;
/**
 * Encode configuration as base64 URL parameter
 * Used for sharing configurations via URL
 *
 * @param config - Configuration to encode
 * @returns URL-safe encoded string
 */
export declare function encodeConfigForUrl(config: OlimpusConfig): string;
/**
 * Decode configuration from URL parameter
 *
 * @param encoded - URL-safe encoded configuration string
 * @returns Decoded configuration object
 * @throws Error if encoding is invalid
 */
export declare function decodeConfigFromUrl(encoded: string): OlimpusConfig;
/**
 * Get configuration from current URL parameters
 *
 * @returns Configuration from URL or null if not present
 */
export declare function getConfigFromUrl(): OlimpusConfig | null;
/**
 * Update URL with encoded configuration
 * Replaces history state without reloading page
 *
 * @param config - Configuration to encode and add to URL
 */
export declare function updateUrlWithConfig(config: OlimpusConfig): void;
/**
 * Remove configuration from URL
 */
export declare function clearConfigFromUrl(): void;
/**
 * Download configuration as JSONC file
 *
 * @param config - Configuration to download
 * @param filename - Name of file to download (default: olimpus.jsonc)
 */
export declare function downloadConfigAsFile(config: OlimpusConfig, filename?: string): void;
/**
 * Read configuration from file input
 *
 * @param file - File to read
 * @returns Promise that resolves to parsed configuration
 */
export declare function readConfigFromFile(file: File): Promise<OlimpusConfig>;
/**
 * Check if a string is valid JSONC
 *
 * @param content - Content to validate
 * @returns true if valid JSONC, false otherwise
 */
export declare function isValidJsonc(content: string): boolean;
/**
 * Generate shareable URL with encoded configuration
 *
 * @param config - Configuration to share
 * @returns Full URL with config parameter
 */
export declare function generateShareUrl(config: OlimpusConfig): string;
/**
 * Copy shareable URL to clipboard
 *
 * @param config - Configuration to share
 * @returns Promise that resolves when URL is copied
 */
export declare function copyShareUrl(config: OlimpusConfig): Promise<void>;
/**
 * Extract JSONC parse errors from content
 * Useful for displaying specific error locations to users
 *
 * @param content - Content to validate
 * @returns Array of error messages with line information
 */
export declare function getJsoncErrors(content: string): string[];
//# sourceMappingURL=config-io.d.ts.map