import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ApiResponse,
  ApiError 
} from '@/types/api';

const API_BASE_URL = 'http://localhost:3000';

// Custom error class for project operations
export class ProjectServiceError extends Error {
  public code?: string;
  public status?: number;

  constructor(
    message: string,
    code?: string,
    status?: number
  ) {
    super(message);
    this.name = 'ProjectServiceError';
    this.code = code;
    this.status = status;
  }
}

// Result pattern for better error handling
export type Result<T, E = ProjectServiceError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Project statistics interface
export interface ProjectStats {
  PENDING: number;
  IN_PROGRESS: number;
  COMPLETED: number;
}

class ProjectService {
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

      // Handle responses with no content (like DELETE 204)
      if (response.status === 204 || options.method === 'DELETE') {
        if (!response.ok) {
          return {
            success: false,
            error: new ProjectServiceError(
              'Delete operation failed',
              'DELETE_ERROR',
              response.status
            ),
          };
        }
        return { success: true, data: undefined as T };
      }

      // Try to parse JSON for other responses
      let data;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails and response is ok, return empty data
        if (response.ok) {
          return { success: true, data: undefined as T };
        }
        // If not ok, return generic error
        return {
          success: false,
          error: new ProjectServiceError(
            'Invalid response format',
            'PARSE_ERROR',
            response.status
          ),
        };
      }

      if (!response.ok) {
        const error = data as ApiError;
        return {
          success: false,
          error: new ProjectServiceError(
            error.error || 'An error occurred',
            error.code,
            response.status
          ),
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: new ProjectServiceError(
          error instanceof Error ? error.message : 'Network error occurred'
        ),
      };
    }
  }

  /**
   * Get all projects for the authenticated user
   */
  async getProjects(): Promise<Result<Project[]>> {
    const result = await this.request<ApiResponse<Project[]>>('/api/projects');
    
    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<Result<Project>> {
    const result = await this.request<ApiResponse<Project>>(`/api/projects/${projectId}`);
    
    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }

  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectRequest): Promise<Result<Project>> {
    const result = await this.request<ApiResponse<Project>>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }

  /**
   * Update an existing project
   */
  async updateProject(
    projectId: string, 
    updates: UpdateProjectRequest
  ): Promise<Result<Project>> {
    const result = await this.request<ApiResponse<Project>>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<Result<void>> {
    const result = await this.request<void>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: undefined };
  }

  /**
   * Get project statistics (task counts by status)
   */
  async getProjectStats(projectId: string): Promise<Result<ProjectStats>> {
    const result = await this.request<ApiResponse<ProjectStats>>(`/api/projects/${projectId}/stats`);
    
    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;