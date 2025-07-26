/**
 * Input Sanitization Utility
 *
 * Provides functions to sanitize user inputs before database storage
 */

/**
 * Sanitize text input by removing potentially dangerous characters
 */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize HTML content (basic implementation)
 * In production, use a proper HTML sanitization library like DOMPurify
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);

    // Only allow HTTP and HTTPS protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    // Basic validation
    if (url.hostname.length === 0 || url.hostname.length > 253) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize DID (Decentralized Identifier)
 */
export function sanitizeDid(input: string): string | null {
  const cleaned = input.trim().toLowerCase();

  // Basic DID format validation
  if (!/^did:(plc|web):[a-zA-Z0-9._-]+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.length > 500) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize handle (AT Protocol handle)
 */
export function sanitizeHandle(input: string): string | null {
  const cleaned = input.trim().toLowerCase();

  // Basic handle format validation
  if (!/^[a-zA-Z0-9.-]+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.length === 0 || cleaned.length > 253) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize session ID
 */
export function sanitizeSessionId(input: string): string | null {
  const cleaned = input.trim();

  // Must start with sess_ and contain only safe characters
  if (!/^sess_[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.length > 128) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize device ID
 */
export function sanitizeDeviceId(input: string): string | null {
  const cleaned = input.trim();

  // Must start with dev_ and contain only safe characters
  if (!/^dev_[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.length > 128) {
    return null;
  }

  return cleaned;
}
