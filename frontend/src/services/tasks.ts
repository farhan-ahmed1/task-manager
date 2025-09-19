import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  ApiResponse,
  ApiError,
  TaskStatus 
} from '@/types/api';

const API_BASE_URL = 'http://localhost:3001';

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
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
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
    
    return this.request<Task[]>(endpoint);
  }

  async getTask(id: string): Promise<Result<Task>> {
    return this.request<Task>(`/api/tasks/${id}`);
  }

  async createTask(taskData: CreateTaskRequest): Promise<Result<Task>> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Result<Task>> {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<Result<void>> {
    return this.request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const taskService = new TaskService();
export default taskService;