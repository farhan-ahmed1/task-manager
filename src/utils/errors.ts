// src/utils/errors.ts

export class TaskNotFoundError extends Error {
  public status = 404;
  public code = 'TASK_NOT_FOUND';

  constructor(taskId: string) {
    super(`Task with ID ${taskId} not found`);
    this.name = 'TaskNotFoundError';
  }
}

export class ValidationError extends Error {
  public status = 400;
  public code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  public status = 401;
  public code = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class DatabaseError extends Error {
  public status = 500;
  public code = 'DATABASE_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ProjectNotFoundError extends Error {
  public status = 404;
  public code = 'PROJECT_NOT_FOUND';

  constructor(projectId: string) {
    super(`Project with ID ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}
