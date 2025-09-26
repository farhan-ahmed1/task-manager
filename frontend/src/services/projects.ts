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

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return {
          success: false,
          error: new ProjectServiceError(
            `Too many requests. ${retryAfter ? `Please wait ${retryAfter} seconds before trying again.` : 'Please try again later.'}`,
            'RATE_LIMIT_EXCEEDED',
            429
          ),
        };
      }

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

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string): Promise<Result<ProjectMember[]>> {
    const result = await this.request<ApiResponse<ProjectMember[]>>(`/api/projects/${projectId}/members`);
    
    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }

  /**
   * Invite user to project
   */
  async inviteUserToProject(
    projectId: string, 
    email: string, 
    role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER'
  ): Promise<Result<ProjectInvitation>> {
    const result = await this.request<ApiResponse<ProjectInvitation>>(`/api/projects/${projectId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }

  /**
   * Remove project member
   */
  async removeProjectMember(projectId: string, userId: string): Promise<Result<void>> {
    const result = await this.request<void>(`/api/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: undefined };
  }

  /**
   * Accept project invitation
   */
  async acceptProjectInvitation(token: string): Promise<Result<ProjectMember>> {
    const result = await this.request<ApiResponse<ProjectMember>>(`/api/projects/accept-invitation/${token}`, {
      method: 'POST',
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.data };
  }
}

// Types for project sharing
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  user_email?: string;
  user_name?: string;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  token: string;
  expires_at: string;
  invited_by: string;
  invited_by_name?: string;
  project_name?: string;
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;