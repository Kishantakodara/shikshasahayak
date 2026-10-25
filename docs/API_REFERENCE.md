# ShikshaSahayak OS — API Reference

**Version**: 1.0 | **Base URL**: `https://shikshasahayak.org` | **Last Updated**: 2026-08-04

All API endpoints live under `/api/`. Authentication uses Firebase ID tokens passed as `Bearer` tokens in the `Authorization` header.

---

## Authentication

### Token Format
```http
Authorization: Bearer <firebase_id_token>
```

### Roles
| Role | Description |
|---|---|
| `student` | Default role for all registered users |
| `teacher` / `educator` | Whitelisted in `teacher_whitelist` D1 table |
| `admin` | Email in `ALLOWED_ADMIN_EMAILS` list in `auth.ts` |

### Error Responses
| Code | Meaning |
|---|---|
| `401 Unauthorized` | No or invalid token |
| `403 Forbidden` | Token valid but insufficient role |

---

## Student APIs

### `GET /api/student/profile`
Fetch the authenticated user's academic profile.
- **Auth**: Required (any authenticated user)
- **Note**: Non-admin users can only fetch their own profile
- **Response**: `StudentAcademicProfile` object

### `POST /api/student/profile`
Update the authenticated user's academic profile.
- **Auth**: Required (own profile only; admins can target any userId)
- **Body**: `{ profile: StudentAcademicProfile }`

### `GET /api/student/bookmarks`
Fetch bookmarks for the authenticated user.
- **Auth**: Required

### `POST /api/student/bookmarks`
Add or remove a bookmark.
- **Auth**: Required

---

## Study Material APIs

### `GET /api/study-material/resources`
List study material resources filtered by branch/semester.
- **Auth**: Public
- **Query Params**: `branchId`, `semester`, `type`

### `GET /api/materials/download`
Download a material file from R2 storage.
- **Auth**: Public (files are access-controlled by R2 key structure)
- **Query Params**: `key` (R2 storage key)

---

## Assessment APIs

### `GET /api/assessment/quizzes`
List published quizzes for a subject.
- **Auth**: Required (student+)

### `POST /api/assessment/quizzes`
Create a new quiz draft.
- **Auth**: Required (teacher/admin)

---

## AI APIs

### `POST /api/ai/assistant`
Generate a study explanation for a topic or question.
- **Auth**: Required (any authenticated user)
- **Body**: `{ topicOrQuestion: string (max 500 chars), contextSubject?: string }`
- **Response**: `AIStudyExplanationSpec`

### `POST /api/ai/quiz-generator`
Generate an AI quiz draft for teacher review.
- **Auth**: Required (teacher/admin only)
- **Body**: `{ subjectId: string, topicName: string (max 200 chars), questionCount?: number (1–20) }`
- **Response**: `AIQuizDraftSpec`

---

## Admin APIs

### `GET /api/admin/metrics`
Fetch real-time platform metrics.
- **Auth**: Required (admin only)
- **Response**: `PlatformMetricsSpec`

### `GET /api/admin/audit-logs`
Fetch paginated admin audit log.
- **Auth**: Required (admin only)
- **Query Params**: `limit` (max 100, default 20)

### `POST /api/admin/audit-logs`
Record a manual admin audit event.
- **Auth**: Required (admin only)
- **Body**: `{ action: string, resourceType: string, resourceId?: string, details?: object }`

### `GET /api/admin/users-manage`
List platform users.
- **Auth**: Required (admin only)

### `POST /api/admin/users-manage`
Update a user's role or status.
- **Auth**: Required (admin only)
- **Body**: `{ targetUserId: string, newRole?: 'student'|'teacher'|'admin', newStatus?: string }`

---

## Performance APIs

### `GET /api/performance/telemetry`
Fetch platform performance health summary.
- **Auth**: Required (admin only)
- **Response**: `PerformanceHealthSummary`

### `POST /api/performance/telemetry`
Submit a client-side performance telemetry event (fire-and-forget).
- **Auth**: Required (any authenticated user)
- **Body**: `{ endpoint: string, latencyMs: number, statusCode?: number, errorMessage?: string }`

---

## Teacher APIs

### `POST /api/teacher/publish-content`
Publish study material to a branch/semester.
- **Auth**: Required (teacher/admin)

### `GET /api/teacher/analytics`
Fetch teacher-level analytics.
- **Auth**: Required (teacher/admin)

### `GET /api/teacher/classes`
List teacher's classes.
- **Auth**: Required (teacher/admin)

---

## Miscellaneous APIs

### `GET /api/search`
Full-text search across resources and study materials.
- **Auth**: Public

### `GET /api/branches`
List all engineering branches.
- **Auth**: Public

### `GET /api/catalog`
Fetch full content catalog.
- **Auth**: Public

### `GET /api/blueprint/status`
Master integration blueprint status.
- **Auth**: Public
