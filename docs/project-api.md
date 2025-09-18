# Project API Endpoints

## POST /api/projects
Create a new project for the authenticated user.

**Request Body:**
- `name` (string, required, 1-200 characters)
- `description` (string, optional, max 2000 characters)

**Response:**
- 201 Created
- `{ data: Project, message: string }`

---

## GET /api/projects
List all projects owned by the authenticated user.

**Response:**
- 200 OK
- `{ data: Project[] }`

---

## GET /api/projects/:id
Get a single project by ID (must be owned by user).

**Response:**
- 200 OK
- `{ data: Project }`
- 404 if not found

---

## PUT /api/projects/:id
Update a project (must be owned by user).

**Request Body:**
- `name` (string, optional, 1-200 characters)
- `description` (string, optional, max 2000 characters)

**Response:**
- 200 OK
- `{ data: Project, message: string }`
- 404 if not found

---

## DELETE /api/projects/:id
Delete a project (must be owned by user). This will cascade delete all associated tasks.

**Response:**
- 204 No Content
- 404 if not found

---

## GET /api/projects/:id/stats
Get statistics for a project (must be owned by user).

**Response:**
- 200 OK
- `{ data: ProjectStats }`
- 404 if not found

**ProjectStats Model:**
```json
{
  "PENDING": 5,
  "IN_PROGRESS": 3,
  "COMPLETED": 12
}
```

---

## Project Model
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "name": "string",
  "description": "string | null",
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

## Task-Project Integration

### GET /api/tasks?project_id=:projectId
Filter tasks by project ID. Only shows tasks assigned to the authenticated user within the specified project.

**Query Parameters:**
- `project_id` (UUID string, optional) - Filter tasks by project

**Response:**
- 200 OK
- `{ data: Task[] }` - Array of tasks filtered by project

**Example:**
```bash
curl -X GET "/api/tasks?project_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

### POST /api/tasks (with project_id)
Create a task associated with a project.

**Request Body:**
```json
{
  "title": "Design homepage",
  "description": "Create wireframes and mockups",
  "priority": "HIGH",
  "project_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Error Handling
All endpoints return JSON errors with `error` and `code` fields.

**Error Codes:**
- `400` - Validation errors (VALIDATION_ERROR)
- `401` - Authentication errors (UNAUTHORIZED)
- `404` - Project not found (PROJECT_NOT_FOUND)
- `500` - Server errors (DATABASE_ERROR, INTERNAL_ERROR)

**Example Error Response:**
```json
{
  "error": "Project not found",
  "code": "PROJECT_NOT_FOUND"
}
```

## Authentication
All endpoints require Bearer JWT authentication in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Example Requests

### Create Project
```bash
curl -X POST /api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Complete redesign of the marketing website"
  }'
```

### Get Project Statistics
```bash
curl -X GET /api/projects/123e4567-e89b-12d3-a456-426614174000/stats \
  -H "Authorization: Bearer <token>"
```

### Filter Tasks by Project
```bash
curl -X GET "/api/tasks?project_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

### Update Project
```bash
curl -X PUT /api/projects/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign v2",
    "description": "Updated scope for the marketing website redesign"
  }'
```

### Delete Project
```bash
curl -X DELETE /api/projects/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>"
```

## Business Logic

### Project Ownership
- Only project owners can view, update, or delete their projects
- Project stats are only available to project owners
- Users cannot access projects they don't own

### Task-Project Association
- Tasks can optionally be associated with a project via `project_id`
- Tasks without a `project_id` are considered personal tasks
- When filtering tasks by project, only tasks assigned to the authenticated user are returned
- Deleting a project will cascade delete all associated tasks

### Statistics
- Project statistics count tasks by status (PENDING, IN_PROGRESS, COMPLETED)
- Only tasks within the project are counted
- Statistics are updated in real-time based on current task data