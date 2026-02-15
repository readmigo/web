/**
 * API Client — all requests go through /api/proxy/ which reads the
 * httpOnly JWT cookie server-side and attaches the Bearer token.
 * No tokens are stored or accessible in client-side JavaScript.
 */

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
  skipAuth?: boolean;
  /** When true, 401 responses throw ApiError instead of redirecting to /login */
  noRedirectOn401?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private proxyBase: string;

  constructor() {
    // All requests go through the Next.js API proxy
    // In the browser, use relative URL; on server-side (SSR), use full URL
    this.proxyBase = '/api/proxy';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, skipAuth: _skipAuth, noRedirectOn401, ...fetchOptions } = options;

    let url = `${this.proxyBase}${endpoint}`;
    if (params) {
      // Filter out undefined/null values and convert to strings for URLSearchParams
      const filteredParams: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          filteredParams[k] = String(v);
        }
      }
      if (Object.keys(filteredParams).length > 0) {
        const searchParams = new URLSearchParams(filteredParams);
        url += `?${searchParams.toString()}`;
      }
    }

    // Cookies (including the NextAuth session cookie) are sent automatically
    // The proxy route reads the JWT and attaches the Bearer token
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'same-origin',
    });

    // Handle 401 — redirect to login (unless caller opted out)
    if (response.status === 401) {
      if (!noRedirectOn401 && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorData);
    }

    return response.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T = any>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async put<T = any>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patch<T = any>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

/**
 * Update user activity (lastActiveAt)
 * Uses server-side debouncing (5 minutes) to prevent excessive database updates
 */
export async function updateActivity(): Promise<void> {
  try {
    await apiClient.post('/users/me/activity', undefined, { noRedirectOn401: true });
  } catch (error) {
    // Silent fail - activity updates should not disrupt user experience
    console.debug('Failed to update activity:', error);
  }
}
