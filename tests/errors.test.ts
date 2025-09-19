import {
  TaskNotFoundError,
  ValidationError,
  UnauthorizedError,
  DatabaseError,
  ProjectNotFoundError,
} from '../src/utils/errors';

describe('Error Classes', () => {
  describe('TaskNotFoundError', () => {
    it('should create error with correct properties and message', () => {
      const taskId = 'task-123';
      const error = new TaskNotFoundError(taskId);

      expect(error.name).toBe('TaskNotFoundError');
      expect(error.message).toBe(`Task with ID ${taskId} not found`);
      expect(error.status).toBe(404);
      expect(error.code).toBe('TASK_NOT_FOUND');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof TaskNotFoundError).toBe(true);
    });

    it('should handle different task IDs', () => {
      const taskId = 'different-task-id';
      const error = new TaskNotFoundError(taskId);

      expect(error.message).toBe(`Task with ID ${taskId} not found`);
    });
  });

  describe('ValidationError', () => {
    it('should create error with correct properties and message', () => {
      const message = 'Invalid input data';
      const error = new ValidationError(message);

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe(message);
      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it('should handle different validation messages', () => {
      const message = 'Field is required';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe('Unauthorized access');
      expect(error.status).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof UnauthorizedError).toBe(true);
    });

    it('should create error with custom message', () => {
      const message = 'Token expired';
      const error = new UnauthorizedError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.status).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DatabaseError', () => {
    it('should create error with correct properties and message', () => {
      const message = 'Connection failed';
      const error = new DatabaseError(message);

      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe(message);
      expect(error.status).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof DatabaseError).toBe(true);
    });

    it('should handle different database error messages', () => {
      const message = 'Query timeout';
      const error = new DatabaseError(message);

      expect(error.message).toBe(message);
    });
  });

  describe('ProjectNotFoundError', () => {
    it('should create error with correct properties and message', () => {
      const projectId = 'project-456';
      const error = new ProjectNotFoundError(projectId);

      expect(error.name).toBe('ProjectNotFoundError');
      expect(error.message).toBe(`Project with ID ${projectId} not found`);
      expect(error.status).toBe(404);
      expect(error.code).toBe('PROJECT_NOT_FOUND');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ProjectNotFoundError).toBe(true);
    });

    it('should handle different project IDs', () => {
      const projectId = 'another-project-id';
      const error = new ProjectNotFoundError(projectId);

      expect(error.message).toBe(`Project with ID ${projectId} not found`);
    });
  });

  describe('Error inheritance and stack trace', () => {
    it('should maintain proper error stack traces', () => {
      const error = new ValidationError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });

    it('should be catchable as generic Error', () => {
      const error = new TaskNotFoundError('test-id');

      try {
        throw error;
      } catch (caught) {
        expect(caught instanceof Error).toBe(true);
        expect(caught instanceof TaskNotFoundError).toBe(true);
        expect((caught as TaskNotFoundError).status).toBe(404);
      }
    });
  });

  describe('Error serialization', () => {
    it('should include status and code when serialized', () => {
      const error = new ValidationError('Test validation error');

      // Test that custom properties are enumerable/accessible
      expect(error.status).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test validation error');
    });

    it('should work with JSON.stringify for error logging', () => {
      const error = new UnauthorizedError('Custom unauthorized message');

      // While Error objects don't stringify well by default,
      // our properties should be accessible
      const errorInfo = {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
      };

      const serialized = JSON.stringify(errorInfo);
      const parsed = JSON.parse(serialized);

      expect(parsed.name).toBe('UnauthorizedError');
      expect(parsed.message).toBe('Custom unauthorized message');
      expect(parsed.status).toBe(401);
      expect(parsed.code).toBe('UNAUTHORIZED');
    });
  });
});
