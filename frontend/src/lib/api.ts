function resolveApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // 1. Server-side runtime (SSR / Server Components):
  if (typeof window === 'undefined') {
    // Injected by Vercel service binding on frontend service
    const serviceUrl = process.env.BACKEND_SERVICE_URL;
    if (serviceUrl) {
      const baseWithPrefix = new URL('api/v1/', serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`);
      return new URL(cleanEndpoint, baseWithPrefix).toString();
    }
    const fallbackBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    return `${fallbackBase.replace(/\/$/, '')}/${cleanEndpoint}`;
  }

  // 2. Client-side browser runtime:
  // If an absolute URL is explicitly configured, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/${cleanEndpoint}`;
  }

  // When deployed under Vercel multi-service with rewrite /api/(.*) -> backend,
  // same-origin relative path /api/v1 routes automatically to the backend service.
  return `/api/v1/${cleanEndpoint}`;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    message: string;
    details?: any;
    code?: string;
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;
  public code?: string;

  constructor(message: string, statusCode = 400, details?: any, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ckk_access_token');
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ckk_access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('ckk_refresh_token', refreshToken);
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ckk_access_token');
  localStorage.removeItem('ckk_refresh_token');
  localStorage.removeItem('ckk_user_profile');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredAccessToken();
  const url = resolveApiUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      data: null as any,
      error: { message: `HTTP ${response.status}: Failed to parse server response` },
    }));

    if (!response.ok || !data.success) {
      const errorMsg = data.error?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, data.error?.details, data.error?.code);
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error occurred. Please check backend connection.', 500);
  }
}

export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),
  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
  patch: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),
  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
};
