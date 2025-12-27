import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  ApiResponse,
  ApiError,
  TaskStatus 
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Custom error class for task operations
export class TaskServiceError extends Error {
  public code?: string;
  public status?: number;

  constructor(
    message: string,
    code?: string,
    status?: number
  ) {
    super(message);
    this.name = 'TaskServiceError';
    this.code = code;
    this.status = status;
  }
}

// Result pattern for better error handling
export type Result<T, E = TaskServiceError> = 
  | { success: true; data: T }
  | { success: false; error: E };

class TaskService {
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

  private clearTasksCache(): void {
    // Clear all cache entries that are related to task lists
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith('/api/tasks')) {
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

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return {
          success: false,
          error: new TaskServiceError(
            `Too many requests. ${retryAfter ? `Please wait ${retryAfter} seconds before trying again.` : 'Please try again later.'}`,
            'RATE_LIMIT_EXCEEDED',
            429
          ),
        };
      }

      if (!response.ok) {
        let errorData: ApiError;
        
        try {
          // Try to parse as JSON first
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, create error based on status code
          if (response.status === 404) {
            errorData = {
              error: 'Task not found',
              code: 'TASK_NOT_FOUND'
            };
          } else if (response.status === 401) {
            errorData = {
              error: 'Authentication required',
              code: 'UNAUTHORIZED'
            };
          } else if (response.status === 403) {
            errorData = {
              error: 'Access denied',
              code: 'FORBIDDEN'
            };
          } else {
            errorData = {
              error: 'Network error occurred',
              code: 'NETWORK_ERROR'
            };
          }
        }
        
        return {
          success: false,
          error: new TaskServiceError(
            errorData.error || 'An error occurred',
            errorData.code || 'UNKNOWN_ERROR',
            response.status
          )
        };
      }

      // Handle successful responses
      if (response.status === 204 || options.method === 'DELETE') {
        // No content expected for DELETE operations or 204 responses
        return { success: true, data: undefined as T };
      }

      try {
        const result: ApiResponse<T> = await response.json();
        return { success: true, data: result.data };
      } catch {
        // If we can't parse JSON but response was successful, assume no content
        return { success: true, data: undefined as T };
      }
    } catch (error) {
      return {
        success: false,
        error: new TaskServiceError(
          error instanceof Error ? error.message : 'Network error',
          'NETWORK_ERROR'
        )
      };
    }
  }

  async getTasks(filters?: {
    project_id?: string;
    status?: TaskStatus;
  }): Promise<Result<Task[]>> {
    const searchParams = new URLSearchParams();
    if (filters?.project_id) searchParams.append('project_id', filters.project_id);
    if (filters?.status) searchParams.append('status', filters.status);
    
    const query = searchParams.toString();
    const endpoint = `/api/tasks${query ? `?${query}` : ''}`;
    
    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, filters);
    const cachedEntry = this.cache[cacheKey];
    
    if (cachedEntry && this.isValidCache(cachedEntry)) {
      return { success: true, data: cachedEntry.data as Task[] };
    }
    
    const result = await this.request<Task[]>(endpoint);
    
    // Cache successful results
    if (result.success) {
      this.cache[cacheKey] = {
        data: result.data,
        timestamp: Date.now()
      };
    }
    
    return result;
  }

  async getTask(id: string): Promise<Result<Task>> {
    return this.request<Task>(`/api/tasks/${id}`);
  }

  async createTask(taskData: CreateTaskRequest): Promise<Result<Task>> {
    const result = await this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    
    // Clear cache after successful creation
    if (result.success) {
      this.clearTasksCache();
    }
    
    return result;
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Result<Task>> {
    const result = await this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    // Clear cache after successful update
    if (result.success) {
      this.clearTasksCache();
    }
    
    return result;
  }

  async deleteTask(id: string): Promise<Result<void>> {
    const result = await this.request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    
    // Clear cache after successful deletion
    if (result.success) {
      this.clearTasksCache();
    }
    
    return result;
  }
}

// Export singleton instance
export const taskService = new TaskService();
export default taskService;