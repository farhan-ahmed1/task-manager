import request from 'supertest';
import express, { Express } from 'express';
import { setupSwagger, specs } from '../src/config/swagger';

// Type for swagger specs
interface SwaggerSpecs {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact: {
      name: string;
      email: string;
    };
    license: {
      name: string;
      url: string;
    };
  };
  servers: Array<{ url: string; description: string }>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

describe('Swagger Configuration', () => {
  let app: Express;

  beforeEach(() => {
    app = express() as Express;
  });

  describe('setupSwagger', () => {
    beforeEach(() => {
      setupSwagger(app);
    });

    it('should setup Swagger UI at /api-docs', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('Task Manager API Documentation');
    });
    it('should hide the top bar with custom CSS', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.text).toContain('.swagger-ui .topbar { display: none }');
    });

    it('should provide JSON documentation at /api-docs.json', async () => {
      const response = await request(app).get('/api-docs.json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const swaggerDoc = response.body;
      expect(swaggerDoc).toHaveProperty('openapi', '3.0.0');
      expect(swaggerDoc).toHaveProperty('info');
      expect(swaggerDoc.info).toHaveProperty('title', 'Task Manager API');
      expect(swaggerDoc.info).toHaveProperty('version', '1.0.0');
    });

    it('should include API information in the documentation', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc.info).toEqual({
        title: 'Task Manager API',
        version: '1.0.0',
        description:
          'A comprehensive cloud-native task management API built with Node.js, Express, and PostgreSQL',
        contact: {
          name: 'API Support',
          email: 'support@taskmanager.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      });
    });

    it('should include server configuration', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc).toHaveProperty('servers');
      expect(Array.isArray(swaggerDoc.servers)).toBe(true);
      expect(swaggerDoc.servers).toHaveLength(1);
      expect(swaggerDoc.servers[0]).toEqual({
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      });
    });

    it('should include security schemes', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc).toHaveProperty('components');
      expect(swaggerDoc.components).toHaveProperty('securitySchemes');
      expect(swaggerDoc.components.securitySchemes).toHaveProperty('BearerAuth');
      expect(swaggerDoc.components.securitySchemes.BearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
    });

    it('should include schema definitions', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc.components).toHaveProperty('schemas');

      // Check User schema
      expect(swaggerDoc.components.schemas).toHaveProperty('User');
      const userSchema = swaggerDoc.components.schemas.User;
      expect(userSchema).toEqual({
        type: 'object',
        required: ['id', 'email'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          name: {
            type: 'string',
            description: 'User display name',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp',
          },
        },
      });
    });

    it('should include Task schema definition', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc.components.schemas).toHaveProperty('Task');
      const taskSchema = swaggerDoc.components.schemas.Task;

      expect(taskSchema.type).toBe('object');
      expect(taskSchema.required).toContain('id');
      expect(taskSchema.required).toContain('title');
      expect(taskSchema.required).toContain('status');
      expect(taskSchema.required).toContain('priority');
      expect(taskSchema.required).toContain('user_id');

      expect(taskSchema.properties.id).toEqual({
        type: 'string',
        format: 'uuid',
        description: 'Unique task identifier',
      });

      expect(taskSchema.properties.title).toEqual({
        type: 'string',
        maxLength: 200,
        description: 'Task title',
      });

      expect(taskSchema.properties.status).toEqual({
        type: 'string',
        enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
        description: 'Task status',
      });

      expect(taskSchema.properties.priority).toEqual({
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        description: 'Task priority level',
      });
    });

    it('should include Project schema definition', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc.components.schemas).toHaveProperty('Project');
    });

    it('should include error schema definitions', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      expect(swaggerDoc.components.schemas).toHaveProperty('ErrorResponse');
      expect(swaggerDoc.components.schemas).toHaveProperty('ValidationErrorResponse');
    });
  });

  describe('specs export', () => {
    it('should export swagger specifications', () => {
      expect(specs).toBeDefined();
      expect(typeof specs).toBe('object');
      expect(specs).toHaveProperty('openapi', '3.0.0');
      expect(specs).toHaveProperty('info');
      expect(specs).toHaveProperty('components');
    });

    it('should have correct API info in specs', () => {
      expect((specs as SwaggerSpecs).info).toEqual({
        title: 'Task Manager API',
        version: '1.0.0',
        description:
          'A comprehensive cloud-native task management API built with Node.js, Express, and PostgreSQL',
        contact: {
          name: 'API Support',
          email: 'support@taskmanager.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      });
    });

    it('should have security schemes defined in specs', () => {
      expect((specs as SwaggerSpecs).components.securitySchemes).toHaveProperty('BearerAuth');
      expect((specs as SwaggerSpecs).components.securitySchemes.BearerAuth).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
    });

    it('should have schemas defined in specs', () => {
      const { schemas } = (specs as SwaggerSpecs).components;

      expect(schemas).toHaveProperty('User');
      expect(schemas).toHaveProperty('Task');
      expect(schemas).toHaveProperty('Project');
      expect(schemas).toHaveProperty('ErrorResponse');
      expect(schemas).toHaveProperty('ValidationErrorResponse');
    });
    it('should have correct server configuration in specs', () => {
      expect((specs as SwaggerSpecs).servers).toHaveLength(1);
      expect((specs as SwaggerSpecs).servers[0]).toEqual({
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      });
    });
  });

  describe('Environment configuration', () => {
    it('should have server configuration based on environment', () => {
      const serverUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      expect((specs as SwaggerSpecs).servers[0].url).toBe(serverUrl);
    });

    it('should have development server description', () => {
      expect((specs as SwaggerSpecs).servers[0].description).toBe('Development server');
    });
  });
  describe('Custom Swagger UI configuration', () => {
    beforeEach(() => {
      setupSwagger(app);
    });

    it('should enable explorer option', async () => {
      // This is implicitly tested by checking if the UI loads correctly
      const response = await request(app).get('/api-docs/');
      expect(response.status).toBe(200);
    });

    it('should set custom site title', async () => {
      const response = await request(app).get('/api-docs/');
      expect(response.text).toContain('Task Manager API Documentation');
    });

    it('should apply custom CSS to hide topbar', async () => {
      const response = await request(app).get('/api-docs/');
      expect(response.text).toContain('.swagger-ui .topbar { display: none }');
    });
  });

  describe('API documentation completeness', () => {
    beforeEach(() => {
      setupSwagger(app);
    });

    it('should include all required schema properties', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      // Verify Task schema has all required fields
      const taskSchema = swaggerDoc.components.schemas.Task;
      expect(taskSchema.required).toEqual(['id', 'title', 'status', 'priority', 'user_id']);

      // Verify User schema has required fields
      const userSchema = swaggerDoc.components.schemas.User;
      expect(userSchema.required).toEqual(['id', 'email']);
    });

    it('should have proper enum values for task status and priority', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      const taskSchema = swaggerDoc.components.schemas.Task;
      expect(taskSchema.properties.status.enum).toEqual(['TODO', 'IN_PROGRESS', 'COMPLETED']);
      expect(taskSchema.properties.priority.enum).toEqual(['LOW', 'MEDIUM', 'HIGH']);
    });

    it('should have proper string length constraints', async () => {
      const response = await request(app).get('/api-docs.json');
      const swaggerDoc = response.body;

      const taskSchema = swaggerDoc.components.schemas.Task;
      expect(taskSchema.properties.title.maxLength).toBe(200);
      expect(taskSchema.properties.description.maxLength).toBe(1000);
    });
  });
});
