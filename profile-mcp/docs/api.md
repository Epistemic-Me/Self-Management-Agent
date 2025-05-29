# API Documentation

Complete reference for all Profile MCP endpoints with request/response examples.

## Authentication

All endpoints require Bearer token authentication. Tokens are mapped to user IDs in Redis for development.

```bash
# Set a development token
docker compose exec redis redis-cli set "your-token" "your-user-id"

# Use in requests
curl -H "Authorization: Bearer your-token" http://localhost:8010/endpoint
```

## Core Data Endpoints

### SelfModel Management

#### POST /upsertSelfModel

Creates or updates a user's SelfModel.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### GET /getSelfModel

Retrieves a SelfModel by user ID.

**Query Parameters:**
- `user_id` (required): UUID of the user

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z",
  "belief_systems": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Core Values",
      "beliefs": [...]
    }
  ]
}
```

### Belief System Management

#### POST /upsertBelief

Creates or updates a belief within a belief system.

**Request:**
```json
{
  "belief_system_id": "770e8400-e29b-41d4-a716-446655440002",
  "context_uuid": "context-123",
  "statement": "I believe in continuous learning",
  "confidence": 0.85
}
```

**Response:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "belief_system_id": "770e8400-e29b-41d4-a716-446655440002",
  "context_uuid": "context-123",
  "statement": "I believe in continuous learning",
  "confidence": 0.85
}
```

### Measurement Tracking

#### POST /upsertMeasurement

Records health/wellness measurements for a user.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "weight",
  "value": 70.5,
  "unit": "kg",
  "captured_at": "2024-01-15T08:00:00Z"
}
```

**Response:**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "weight",
  "value": 70.5,
  "unit": "kg",
  "captured_at": "2024-01-15T08:00:00Z"
}
```

### Analytics Endpoints

#### GET /getCohortStats

Retrieves aggregated statistics for user cohorts.

**Query Parameters:**
- `window_days` (optional): Number of days for aggregation window (default: 30)
- `metric_type` (optional): Filter by measurement type

**Response:**
```json
{
  "total_users": 1250,
  "active_users": 890,
  "avg_measurements_per_user": 15.3,
  "window_days": 30,
  "metrics": {
    "weight": {
      "avg": 68.2,
      "min": 45.0,
      "max": 120.0,
      "count": 3420
    }
  }
}
```

#### GET /getProgress

Returns profile completeness percentage for a user.

**Query Parameters:**
- `user_id` (required): UUID of the user

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "completeness_percent": 75.5,
  "completed_sections": [
    "basic_profile",
    "self_model",
    "measurements"
  ],
  "missing_sections": [
    "belief_systems",
    "file_uploads"
  ]
}
```

## File Management

#### POST /uploadUserFile

Uploads a file to MinIO storage and records metadata.

**Request:**
```bash
curl -X POST "http://localhost:8010/uploadUserFile" \
  -H "Authorization: Bearer your-token" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "s3_key": "users/550e8400-e29b-41d4-a716-446655440000/documents/document_20240115.pdf",
  "mime": "application/pdf",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "uploaded_at": "2024-01-15T10:45:00Z"
}
```

## Onboarding Checklist

#### GET /getChecklistProgress

Retrieves onboarding progress and checklist item statuses.

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "required_buckets": ["profile", "measurements", "goals"],
  "completed_buckets": ["profile"],
  "overall_progress": 33.3,
  "items": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "bucket_code": "profile",
      "status": "complete",
      "data_ref": {"section": "basic_info"},
      "source": "manual",
      "updated_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### POST /markChecklistItem

Marks or updates a checklist item status.

**Request:**
```json
{
  "bucket_code": "measurements",
  "status": "complete",
  "data_ref": {"first_measurement": true},
  "source": "api"
}
```

**Response:**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440007",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "bucket_code": "measurements",
  "status": "complete",
  "data_ref": {"first_measurement": true},
  "source": "api",
  "updated_at": "2024-01-15T10:50:00Z"
}
```

## Protocol Templates

#### GET /listProtocolTemplates

Lists available protocol templates, optionally filtered by habit type.

**Query Parameters:**
- `habit_type` (optional): Filter by specific habit type

**Response:**
```json
{
  "templates": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "habit_type": "exercise",
      "cue": "After morning coffee",
      "routine": "10 minutes of stretching",
      "reward": "Feel energized for the day",
      "dd_protocol_json": {
        "duration_minutes": 10,
        "difficulty": "beginner",
        "equipment": "none"
      },
      "is_active": true,
      "created_at": "2024-01-10T12:00:00Z"
    }
  ],
  "total_count": 25,
  "filtered_count": 8
}
```

#### POST /generateProtocol

Generates a personalized protocol for a user based on a template.

**Request:**
```json
{
  "template_id": "dd0e8400-e29b-41d4-a716-446655440008",
  "user_preferences": {
    "time_of_day": "morning",
    "difficulty_level": "intermediate"
  }
}
```

**Response:**
```json
{
  "protocol": {
    "id": "generated-protocol-123",
    "template_id": "dd0e8400-e29b-41d4-a716-446655440008",
    "personalized_cue": "After morning coffee at 7:30 AM",
    "personalized_routine": "15 minutes of intermediate stretching",
    "personalized_reward": "Feel energized and ready for work",
    "customizations": {
      "duration_adjusted": true,
      "difficulty_increased": true
    }
  },
  "generated_at": "2024-01-15T11:00:00Z"
}
```

## Progress Trends

#### GET /getProgressTrend

Analyzes user progress metrics over time with trend calculations.

**Query Parameters:**
- `user_id` (required): UUID of the user
- `metric_type` (optional): Specific metric to analyze
- `window_days` (optional): Analysis window in days (default: 30)

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "metric_type": "weight",
  "window_days": 30,
  "trend_analysis": {
    "slope": -0.15,
    "direction": "decreasing",
    "confidence": 0.82,
    "r_squared": 0.67
  },
  "sparkline_data": [70.5, 70.3, 70.1, 69.8, 69.9, 69.6, 69.4],
  "summary": {
    "start_value": 70.5,
    "end_value": 69.4,
    "total_change": -1.1,
    "percent_change": -1.56
  },
  "generated_at": "2024-01-15T11:15:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters",
  "error_code": "VALIDATION_ERROR",
  "field_errors": {
    "user_id": ["Field required"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or missing authentication token",
  "error_code": "AUTH_ERROR"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found",
  "error_code": "NOT_FOUND",
  "resource_type": "SelfModel",
  "resource_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR",
  "request_id": "req_123456789"
}
```

## Rate Limiting

- **Development**: No rate limiting applied
- **Production**: 100 requests per minute per token
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Requests allowed per window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when window resets

## OpenAPI Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8010/docs
- **ReDoc**: http://localhost:8010/redoc
- **OpenAPI JSON**: http://localhost:8010/openapi.json
