import type {
  CreateUrlRequest,
  InspectItemRequest,
  DecodeHexRequest,
  ValidateUrlRequest,
  AnalyzeUrlRequest,
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
    options: RequestInit = {}
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        }));

        return {
          success: false,
          error: errorData.error || {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      const data = await response.json();
      return data as ApiResponse<T>;
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

  async inspectItem(request: InspectItemRequest): Promise<ApiResponse<unknown>> {
    return this.request('/api/inspect/inspect-item', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async decodeMaskedOnly(request: InspectItemRequest): Promise<ApiResponse<unknown>> {
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

  async validateUrl(request: ValidateUrlRequest): Promise<ApiResponse<{ valid: boolean; urlInfo: unknown }>> {
    return this.request('/api/inspect/validate-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeUrl(request: AnalyzeUrlRequest): Promise<ApiResponse<unknown>> {
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
    return this.request('/api/status');
  }

  async getHealth(): Promise<ApiResponse<{
    status: string;
    ready: boolean;
    checks: Record<string, { status: string; message?: string }>;
  }>> {
    return this.request('/api/health');
  }
}

// Export singleton instance
export const steamServiceClient = new SteamServiceClient();

// Export class for testing/custom instances
export { SteamServiceClient };
