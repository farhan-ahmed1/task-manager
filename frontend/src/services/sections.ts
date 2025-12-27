import type { Section, CreateSectionRequest, UpdateSectionRequest, ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Custom error class for section operations
export class SectionServiceError extends Error {
  public code?: string;
  public status?: number;

  constructor(
    message: string,
    code?: string,
    status?: number
  ) {
    super(message);
    this.name = 'SectionServiceError';
    this.code = code;
    this.status = status;
  }
}

// Result pattern for better error handling
export type Result<T, E = SectionServiceError> = 
  | { success: true; data: T }
  | { success: false; error: E };

class SectionService {
  private cache: { [key: string]: { data: unknown; timestamp: number } } = {};
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getCacheKey(endpoint: string, params?: unknown): string {
    return `${endpoint}_${params ? JSON.stringify(params) : ''}`;
  }

  private isValidCache(cacheEntry: { data: unknown; timestamp: number }): boolean {
    return Date.now() - cacheEntry.timestamp < this.CACHE_DURATION;
  }

  private clearSectionsCache(): void {
    // Clear all cache entries that are related to section lists
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith('/api/sections')) {
        delete this.cache[key];
      }
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        let errorCode = 'UNKNOWN_ERROR';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code || errorCode;
        } catch {
          // If JSON parsing fails, use status-based error messages
          if (response.status === 404) {
            errorMessage = 'Section not found';
            errorCode = 'SECTION_NOT_FOUND';
          } else if (response.status === 401) {
            errorMessage = 'Authentication required';
            errorCode = 'UNAUTHORIZED';
          } else if (response.status === 403) {
            errorMessage = 'Access denied';
            errorCode = 'FORBIDDEN';
          }
        }
        
        return {
          success: false,
          error: new SectionServiceError(errorMessage, errorCode, response.status)
        };
      }

      // Handle successful responses
      if (response.status === 204 || options.method === 'DELETE') {
        return { success: true, data: undefined as T };
      }

      try {
        const result: ApiResponse<T> = await response.json();
        return { success: true, data: result.data };
      } catch {
        return { success: true, data: undefined as T };
      }
    } catch (error) {
      return {
        success: false,
        error: new SectionServiceError(
          error instanceof Error ? error.message : 'Network error',
          'NETWORK_ERROR'
        )
      };
    }
  }

  async getSections(projectId?: string): Promise<Result<Section[]>> {
    const searchParams = new URLSearchParams();
    if (projectId) searchParams.append('project_id', projectId);
    
    const query = searchParams.toString();
    const endpoint = `/api/sections${query ? `?${query}` : ''}`;
    
    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, { projectId });
    const cachedEntry = this.cache[cacheKey];
    
    if (cachedEntry && this.isValidCache(cachedEntry)) {
      return { success: true, data: cachedEntry.data as Section[] };
    }
    
    const result = await this.request<Section[]>(endpoint);
    
    // Cache successful results
    if (result.success) {
      this.cache[cacheKey] = {
        data: result.data,
        timestamp: Date.now()
      };
    }
    
    return result;
  }

  async getSection(id: string): Promise<Result<Section>> {
    return this.request<Section>(`/api/sections/${id}`);
  }

  async createSection(sectionData: CreateSectionRequest): Promise<Result<Section>> {
    const result = await this.request<Section>('/api/sections', {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
    
    // Clear cache after successful creation
    if (result.success) {
      this.clearSectionsCache();
    }
    
    return result;
  }

  async updateSection(id: string, updates: UpdateSectionRequest): Promise<Result<Section>> {
    const result = await this.request<Section>(`/api/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    // Clear cache after successful update
    if (result.success) {
      this.clearSectionsCache();
    }
    
    return result;
  }

  async deleteSection(id: string): Promise<Result<void>> {
    const result = await this.request<void>(`/api/sections/${id}`, {
      method: 'DELETE',
    });
    
    // Clear cache after successful deletion
    if (result.success) {
      this.clearSectionsCache();
    }
    
    return result;
  }
}

// Export singleton instance
export const sectionService = new SectionService();
export default sectionService;