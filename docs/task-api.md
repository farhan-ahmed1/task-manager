# Task API Endpoints

## POST /api/tasks
Create a new task for the authenticated user.

**Request Body:**
- `title` (string, required, 1-200 characters)
- `description` (string, optional, max 1000 characters)
- `status` ("PENDING" | "IN_PROGRESS" | "COMPLETED", optional, defaults to "PENDING")
- `priority` ("LOW" | "MEDIUM" | "HIGH", optional, defaults to "MEDIUM")
- `due_date` (ISO date string, optional)
- `project_id` (UUID string, optional)

**Response:**
- 201 Created
- `{ data: Task, message: string }`

---

## GET /api/tasks
List all tasks assigned to the authenticated user.

**Query Parameters:**
- `project_id` (UUID string, optional) - Filter tasks by project ID

**Response:**
- 200 OK
- `{ data: Task[] }`

**Examples:**
- Get all tasks: `GET /api/tasks`
- Get tasks for a specific project: `GET /api/tasks?project_id=123e4567-e89b-12d3-a456-426614174000`

---

## GET /api/tasks/:id
Get a single task by ID (must be assigned to user).

**Response:**
- 200 OK
- `{ data: Task }`
- 404 if not found

---

## PUT /api/tasks/:id
Update a task (must be assigned to user).

**Request Body:**
- Any updatable Task fields (see POST)

**Response:**
- 200 OK
- `{ data: Task, message: string }`
- 404 if not found

---

## DELETE /api/tasks/:id
Delete a task (must be assigned to user).

**Response:**
- 204 No Content
- 404 if not found

---

## Task Model
```json
{
  "id": "uuid",
  "project_id": "uuid | null",
  "title": "string",
  "description": "string | null",
  "status": "PENDING | IN_PROGRESS | COMPLETED",
  "priority": "LOW | MEDIUM | HIGH",
  "due_date": "ISO date string | null",
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

## Error Handling
All endpoints return JSON errors with `error` and `code` fields.

**Error Codes:**
- `400` - Validation errors (VALIDATION_ERROR)
- `401` - Authentication errors (UNAUTHORIZED)
- `404` - Task not found (TASK_NOT_FOUND)
- `500` - Server errors (DATABASE_ERROR, INTERNAL_ERROR)

**Example Error Response:**
```json
{
  "error": "Task with ID abc-123 not found",
  "code": "TASK_NOT_FOUND"
}
```

## Authentication
All endpoints require Bearer JWT authentication in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Example Requests

### Create Task
```bash
curl -X POST /api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "priority": "HIGH",
    "due_date": "2025-09-20T00:00:00.000Z"
  }'
```

### Get All Tasks
```bash
curl -X GET /api/tasks \
  -H "Authorization: Bearer <token>"
```

### Get Tasks Filtered by Project
```bash
curl -X GET "/api/tasks?project_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```
