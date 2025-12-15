import type {
  CreateUrlRequest,
  InspectUrlRequest,
  DecodeHexRequest,
} from '~/server/types/inspect';

interface SteamServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class SteamServiceClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config?: Partial<SteamServiceConfig>) {
    this.baseUrl = config?.baseUrl || process.env.STEAM_SERVICE_URL || 'http://localhost:3001';
    this.apiKey = config?.apiKey || process.env.STEAM_SERVICE_API_KEY || '';
    this.timeout = config?.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowNon2xxJson: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Try to parse JSON body (even on non-2xx if allowNon2xxJson is enabled)
      const parsed = await response.json().catch(() => undefined);

      // If the upstream already uses our { success, data, error } envelope, pass it through
      if (parsed && typeof parsed === 'object' && 'success' in parsed) {
        return parsed as ApiResponse<T>;
      }

      // Non-2xx handling
      if (!response.ok) {
        if (allowNon2xxJson && parsed !== undefined) {
          // Treat "non-ready" health responses (503 with JSON body) as reachable data,
          // so callers can interpret status/ready themselves.
          return {
            success: true,
            data: parsed as T,
            error: {
              code: 'UPSTREAM_HTTP',
              message: `HTTP ${response.status}: ${response.statusText}`,
              details: { status: response.status, statusText: response.statusText },
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: parsed,
          },
        };
      }

      // 2xx but no envelope → wrap it
      return {
        success: true,
        data: parsed as T,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request to steam service timed out',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      };
    }
  }

  async createInspectUrl(request: CreateUrlRequest): Promise<ApiResponse<{ inspectUrl: string; itemData: unknown; itemType: string }>> {
    return this.request('/api/inspect/create-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async inspectItem(request: InspectUrlRequest): Promise<ApiResponse<unknown>> {
    return this.request('/api/inspect/inspect-item', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async decodeMaskedOnly(request: InspectUrlRequest): Promise<ApiResponse<unknown>> {
    return this.request('/api/inspect/decode-masked-only', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async decodeHexData(request: DecodeHexRequest): Promise<ApiResponse<unknown>> {
    return this.request('/api/inspect/decode-hex-data', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async validateUrl(request: InspectUrlRequest): Promise<ApiResponse<{ valid: boolean; urlInfo: unknown }>> {
    return this.request('/api/inspect/validate-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeUrl(request: InspectUrlRequest): Promise<ApiResponse<unknown>> {
    return this.request('/api/inspect/analyze-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getStatus(): Promise<ApiResponse<{
    steamClient: { available: boolean; status: string };
    queue: { pending: number; processing: number; maxSize: number };
    server: { uptime: number; version: string };
  }>> {
    return this.request('/api/status', {}, true);
  }

  async getHealth(): Promise<ApiResponse<{
    status: string;
    ready: boolean;
    checks: Record<string, { status: string; message?: string }>;
  }>> {
    return this.request('/api/health', {}, true);
  }

  async getReady(): Promise<ApiResponse<{
    status: string;
    ready: boolean;
    checks: Record<string, { status: string; message?: string }>;
  }>> {
    return this.request('/api/health/ready', {}, true);
  }
}

// Export singleton instance
export const steamServiceClient = new SteamServiceClient();

// Export class for testing/custom instances
export { SteamServiceClient };
