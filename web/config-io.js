/**
 * Configuration I/O utilities for Olimpus web editor
 * Handles JSONC parsing, URL encoding, and file import/export
 */
/**
 * Schema URL for Olimpus configuration files
 */
const SCHEMA_URL = "https://raw.githubusercontent.com/TellMeAlex/ONLY-WORKS-ON-OLYMPUS/refs/heads/master/assets/olimpus.schema.json";
/**
 * URL parameter name for encoded config
 */
const CONFIG_URL_PARAM = "c";
    *
    * ;
content - JSONC;
string;
to;
parse
    * ;
Parsed;
configuration;
object
    * ;
Error;
if (JSONC)
    is;
invalid
    * /;
export function parseJsonc(content) {
    // Remove single-line comments (//)
    const withoutSingleLine = content.replace(/\/\/.*$/gm, "");
    // Remove multi-line comments (/* */)
    const withoutMultiLine = withoutSingleLine.replace(/\/\*[\s\S]*?\*\//g, "");
    // Parse the cleaned JSON
    try {
        const parsed = JSON.parse(withoutMultiLine);
        return parsed;
    }
    catch (error) {
        throw new Error(`Invalid JSONC: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Export configuration as JSONC with schema reference
 *
 * @param config - Configuration to export
 * @param pretty - Whether to pretty-print with 2-space indentation
 * @returns JSONC string with schema reference header
 */
export function exportJsonc(config, pretty = true) {
    const indent = pretty ? 2 : 0;
    const jsonString = JSON.stringify(config, null, indent);
    // Add schema reference header
    const header = `{
  "$schema": "${SCHEMA_URL}",\n\n`;
    // Remove opening brace from config and prepend with header
    const configBody = jsonString.replace(/^\{/, "");
    return header + configBody;
}
/**
 * Encode configuration as base64 URL parameter
 * Used for sharing configurations via URL
 *
 * @param config - Configuration to encode
 * @returns URL-safe encoded string
 */
export function encodeConfigForUrl(config) {
    const jsonString = JSON.stringify(config);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join("");
    const base64 = btoa(binaryString);
    // Make URL-safe (replace + with -, / with _, remove padding)
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
/**
 * Decode configuration from URL parameter
 *
 * @param encoded - URL-safe encoded configuration string
 * @returns Decoded configuration object
 * @throws Error if encoding is invalid
 */
export function decodeConfigFromUrl(encoded) {
    // Restore base64 padding if needed
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    try {
        const binaryString = atob(base64);
        const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        const jsonString = new TextDecoder().decode(bytes);
        return JSON.parse(jsonString);
    }
    catch (error) {
        throw new Error(`Invalid encoded config: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get configuration from current URL parameters
 *
 * @returns Configuration from URL or null if not present
 */
export function getConfigFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(CONFIG_URL_PARAM);
    if (!encoded) {
        return null;
    }
    try {
        return decodeConfigFromUrl(encoded);
    }
    catch {
        // Silently return null for invalid config in URL
        // The caller can decide how to handle this case
        return null;
    }
}
/**
 * Update URL with encoded configuration
 * Replaces history state without reloading page
 *
 * @param config - Configuration to encode and add to URL
 */
export function updateUrlWithConfig(config) {
    const encoded = encodeConfigForUrl(config);
    const url = new URL(window.location.href);
    if (encoded) {
        url.searchParams.set(CONFIG_URL_PARAM, encoded);
    }
    else {
        url.searchParams.delete(CONFIG_URL_PARAM);
    }
    window.history.replaceState({}, "", url.toString());
}
/**
 * Remove configuration from URL
 */
export function clearConfigFromUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete(CONFIG_URL_PARAM);
    window.history.replaceState({}, "", url.toString());
}
/**
 * Download configuration as JSONC file
 *
 * @param config - Configuration to download
 * @param filename - Name of file to download (default: olimpus.jsonc)
 */
export function downloadConfigAsFile(config, filename = "olimpus.jsonc") {
    const jsonc = exportJsonc(config, true);
    const blob = new Blob([jsonc], { type: "application/jsonc" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
/**
 * Read configuration from file input
 *
 * @param file - File to read
 * @returns Promise that resolves to parsed configuration
 */
export async function readConfigFromFile(file) {
    const content = await file.text();
    // Try parsing as JSONC first
    try {
        return parseJsonc(content);
    }
    catch (error) {
        // If JSONC fails, try plain JSON
        try {
            return JSON.parse(content);
        }
        catch (jsonError) {
            throw new Error(`Failed to parse config file: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
    }
}
/**
 * Check if a string is valid JSONC
 *
 * @param content - Content to validate
 * @returns true if valid JSONC, false otherwise
 */
export function isValidJsonc(content) {
    try {
        parseJsonc(content);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Generate shareable URL with encoded configuration
 *
 * @param config - Configuration to share
 * @returns Full URL with config parameter
 */
export function generateShareUrl(config) {
    const encoded = encodeConfigForUrl(config);
    const url = new URL(window.location.href);
    url.searchParams.set(CONFIG_URL_PARAM, encoded);
    return url.toString();
}
/**
 * Copy shareable URL to clipboard
 *
 * @param config - Configuration to share
 * @returns Promise that resolves when URL is copied
 */
export async function copyShareUrl(config) {
    const shareUrl = generateShareUrl(config);
    try {
        await navigator.clipboard.writeText(shareUrl);
    }
    catch (error) {
        throw new Error(`Failed to copy URL to clipboard: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Extract JSONC parse errors from content
 * Useful for displaying specific error locations to users
 *
 * @param content - Content to validate
 * @returns Array of error messages with line information
 */
export function getJsoncErrors(content) {
    const errors = [];
    const lines = content.split("\n");
    try {
        // Try to parse, catch any errors
        const withoutSingleLine = content.replace(/\/\/.*$/gm, "");
        const withoutMultiLine = withoutSingleLine.replace(/\/\*[\s\S]*?\*\//g, "");
        // Use a try-catch with position tracking
        const positionTrackingJson = withoutMultiLine;
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        let escapeNext = false;
        let stringDelimiter = '"';
        for (let i = 0; i < positionTrackingJson.length; i++) {
            const char = positionTrackingJson[i];
            const lineNum = content.substring(0, i).split("\n").length;
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (inString) {
                if (char === "\\") {
                    escapeNext = true;
                }
                else if (char === stringDelimiter) {
                    inString = false;
                }
                continue;
            }
            if (char === '"' || char === "'") {
                inString = true;
                stringDelimiter = char;
                continue;
            }
            if (char === "{") {
                openBraces++;
            }
            else if (char === "}") {
                openBraces--;
                if (openBraces < 0) {
                    errors.push(`Line ${lineNum}: Unexpected closing brace }`);
                    break;
                }
            }
            else if (char === "[") {
                openBrackets++;
            }
            else if (char === "]") {
                openBrackets--;
                if (openBrackets < 0) {
                    errors.push(`Line ${lineNum}: Unexpected closing bracket ]`);
                    break;
                }
            }
        }
        if (openBraces > 0) {
            errors.push(`Missing ${openBraces} closing brace(s) }`);
        }
        if (openBrackets > 0) {
            errors.push(`Missing ${openBrackets} closing bracket(s) ]`);
        }
        // Try actual JSON parse for syntax errors
        JSON.parse(positionTrackingJson);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const match = errorMessage.match(/at position (\d+)/);
        if (match) {
            const position = parseInt(match[1], 10);
            const lineNum = content.substring(0, position).split("\n").length;
            errors.push(`Line ${lineNum}: ${errorMessage}`);
        }
        else {
            errors.push(errorMessage);
        }
    }
    return errors;
}
//# sourceMappingURL=config-io.js.map