/**
 * Security Headers Utility
 *
 * Provides standardized security headers for API responses
 */

export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Content Security Policy for API responses
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none';",

  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(response: Response): Response {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a secure JSON response with proper headers
 */
export function createSecureResponse(
  data: unknown,
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {},
): Response {
  const response = new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...SECURITY_HEADERS,
      ...options.headers,
    },
  });

  return response;
}
