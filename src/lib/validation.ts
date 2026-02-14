import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Validate data against a Zod schema.
 * Returns the parsed data on success, or a NextResponse with 400 status on failure.
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    success: false,
    response: NextResponse.json(
      { error: 'Validation failed', details: errors },
      { status: 400 }
    ),
  };
}

// --- Common schemas ---

/** Email address */
export const emailSchema = z.string().email('Invalid email address').max(254);

/** Pagination query parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/**
 * Validate that a proxy path is safe (no path traversal, null bytes, etc.).
 * Returns the cleaned path or null if invalid.
 */
export function validateProxyPath(path: string): string | null {
  // Block null bytes
  if (path.includes('\0')) return null;

  // Decode and check for path traversal (../ or ..\)
  // Check both raw and decoded versions to prevent double-encoding attacks
  const decoded = decodeURIComponent(path);
  if (
    decoded.includes('../') ||
    decoded.includes('..\\') ||
    decoded === '..' ||
    path.includes('../') ||
    path.includes('..\\')
  ) {
    return null;
  }

  // Block absolute paths that try to escape (e.g., //evil.com)
  if (/^\/\//.test(decoded)) return null;

  return path;
}
