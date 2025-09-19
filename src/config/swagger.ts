import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Swagger definition
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
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
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
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
        },
        Task: {
          type: 'object',
          required: ['id', 'title', 'status', 'priority', 'user_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique task identifier',
            },
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Task priority level',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this task',
            },
            project_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the project this task belongs to',
              nullable: true,
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Task last update timestamp',
            },
          },
        },
        Project: {
          type: 'object',
          required: ['id', 'name', 'user_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique project identifier',
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Project name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Project description',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this project',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Project creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Project last update timestamp',
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (minimum 8 characters)',
            },
            name: {
              type: 'string',
              description: 'User display name',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              description: 'User password',
            },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              default: 'TODO',
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              default: 'MEDIUM',
              description: 'Task priority level',
            },
            project_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the project this task belongs to',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
            },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Task priority level',
            },
            project_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the project this task belongs to',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
            },
          },
        },
        CreateProjectRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Project name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Project description',
            },
          },
        },
        UpdateProjectRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Project name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Project description',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['error', 'code'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          required: ['error', 'code'],
          properties: {
            error: {
              type: 'string',
              description: 'Validation error message',
            },
            code: {
              type: 'string',
              enum: ['VALIDATION_ERROR'],
              description: 'Error code',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name that failed validation',
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message for the field',
                  },
                },
              },
            },
          },
        },
        RateLimitErrorResponse: {
          type: 'object',
          required: ['error', 'code'],
          properties: {
            error: {
              type: 'string',
              description: 'Rate limit error message',
            },
            code: {
              type: 'string',
              enum: ['RATE_LIMIT_EXCEEDED', 'AUTH_RATE_LIMIT_EXCEEDED'],
              description: 'Rate limit error code',
            },
            message: {
              type: 'string',
              description: 'Detailed rate limit message',
            },
            retryAfter: {
              type: 'string',
              description: 'Retry after header value',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Authentication required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Access denied',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RateLimitErrorResponse',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

// Generate swagger specification
const specs = swaggerJsdoc(options);

// Setup Swagger middleware
export const setupSwagger = (app: Express): void => {
  // Swagger page
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Task Manager API Documentation',
    }),
  );

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export { specs };
