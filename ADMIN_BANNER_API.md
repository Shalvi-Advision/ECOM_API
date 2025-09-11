# Admin Banner Management API

This document describes the admin-only CRUD endpoints for banner management in the e-commerce API.

## Authentication

All admin endpoints require authentication with a valid JWT token and admin role.

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Admin Role Required:** The user must have `role: 'admin'` in their user profile.

---

## Endpoints

### 1. Create Banner

**POST** `/api/banners/`

Creates a new banner with the enhanced schema.

**Request Body:**
```json
{
  "title": "iPhone 16 Pro Launch",
  "media_url": "https://cdn.shop.com/banners/iphone16.jpg",
  "media_type": "image",
  "redirect": {
    "type": "product",
    "id": "56789",
    "url": "/product/56789"
  },
  "priority": 1,
  "placement": {
    "page": "homepage",
    "position": "top",
    "platform": ["web", "android", "ios"]
  },
  "rotation_type": "carousel",
  "validity": {
    "start": "2025-09-10T00:00:00Z",
    "end": "2025-09-25T23:59:59Z"
  },
  "store_code": "AME",
  "banner_type_id": 1,
  "sequence_id": 1,
  "banner_bg_color": "#FFFFFF"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Banner created successfully",
  "data": {
    "_id": "68c333bc0c797a1118e7e5ce",
    "title": "iPhone 16 Pro Launch",
    "media_url": "https://cdn.shop.com/banners/iphone16.jpg",
    "media_type": "image",
    "redirect": {
      "type": "product",
      "id": "56789",
      "url": "/product/56789"
    },
    "priority": 1,
    "placement": {
      "page": "homepage",
      "position": "top",
      "platform": ["web", "android", "ios"]
    },
    "rotation_type": "carousel",
    "validity": {
      "start": "2025-09-10T00:00:00.000Z",
      "end": "2025-09-25T23:59:59.000Z"
    },
    "store_code": "AME",
    "is_active": "Enabled",
    "tracking": {
      "impressions": 0,
      "clicks": 0
    },
    "createdAt": "2025-01-11T20:45:30.123Z",
    "updatedAt": "2025-01-11T20:45:30.123Z"
  }
}
```

**Validation Rules:**
- `title`: Required, non-empty string
- `media_url`: Required, non-empty string
- `media_type`: Required, must be one of: `image`, `video`, `gif`
- `redirect.type`: Required, must be one of: `product`, `category`, `external`, `internal`
- `redirect.url`: Required, non-empty string
- `placement.page`: Required, must be one of: `homepage`, `category`, `product`, `cart`, `checkout`
- `placement.position`: Required, must be one of: `top`, `middle`, `bottom`, `sidebar`, `popup`
- `priority`: Required, integer between 1-10
- `store_code`: Required, non-empty string
- `validity.start`: Required, valid ISO 8601 date
- `validity.end`: Required, valid ISO 8601 date, must be after start date

---

### 2. Update Banner

**PUT** `/api/banners/:id`

Updates an existing banner. All fields are optional.

**Request Body:**
```json
{
  "title": "Updated Banner Title",
  "priority": 5,
  "is_active": "Disabled",
  "placement": {
    "page": "homepage",
    "position": "middle",
    "platform": ["web", "android"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Banner updated successfully",
  "data": {
    "_id": "68c333bc0c797a1118e7e5ce",
    "title": "Updated Banner Title",
    "priority": 5,
    "is_active": "Disabled",
    "placement": {
      "page": "homepage",
      "position": "middle",
      "platform": ["web", "android"]
    },
    "updatedAt": "2025-01-11T20:50:15.456Z"
  }
}
```

---

### 3. Delete Banner

**DELETE** `/api/banners/:id`

Permanently deletes a banner.

**Response:**
```json
{
  "success": true,
  "message": "Banner deleted successfully"
}
```

---

### 4. Get All Banners (Admin)

**GET** `/api/banners/admin/all`

Retrieves all banners with pagination and filtering options.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `store_code` (optional): Filter by store code
- `is_active` (optional): Filter by status (`Enabled` or `Disabled`)
- `placement_page` (optional): Filter by page placement
- `placement_position` (optional): Filter by position

**Example Request:**
```
GET /api/banners/admin/all?page=1&limit=10&is_active=Enabled&placement_page=homepage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "_id": "68c333bc0c797a1118e7e5ce",
        "title": "Banner 1",
        "media_url": "https://example.com/banner1.jpg",
        "media_type": "image",
        "priority": 8,
        "is_active": "Enabled",
        "placement": {
          "page": "homepage",
          "position": "top",
          "platform": ["web", "android", "ios"]
        },
        "createdAt": "2025-01-11T20:45:30.123Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_banners": 100,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### 5. Toggle Banner Status

**PATCH** `/api/banners/:id/toggle-status`

Toggles the active status of a banner between `Enabled` and `Disabled`.

**Response:**
```json
{
  "success": true,
  "message": "Banner disabled successfully",
  "data": {
    "id": "68c333bc0c797a1118e7e5ce",
    "is_active": "Disabled"
  }
}
```

---

### 6. Bulk Update Priorities

**PATCH** `/api/banners/bulk/priorities`

Updates priorities for multiple banners in a single request.

**Request Body:**
```json
{
  "banners": [
    {
      "id": "68c333bc0c797a1118e7e5ce",
      "priority": 5
    },
    {
      "id": "68c333bc0c797a1118e7e5cf",
      "priority": 3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Banner priorities updated successfully",
  "data": [
    {
      "_id": "68c333bc0c797a1118e7e5ce",
      "priority": 5,
      "updatedAt": "2025-01-11T20:55:30.789Z"
    },
    {
      "_id": "68c333bc0c797a1118e7e5cf",
      "priority": 3,
      "updatedAt": "2025-01-11T20:55:30.789Z"
    }
  ]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Banner not found"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "msg": "Title is required",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating banner",
  "error": "Detailed error message"
}
```

---

## Usage Examples

### Creating a Product Banner
```bash
curl -X POST http://localhost:5000/api/banners/ \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Product Launch",
    "media_url": "https://example.com/product-banner.jpg",
    "media_type": "image",
    "redirect": {
      "type": "product",
      "id": "12345",
      "url": "/product/12345"
    },
    "priority": 1,
    "placement": {
      "page": "homepage",
      "position": "top",
      "platform": ["web", "android", "ios"]
    },
    "validity": {
      "start": "2025-01-11T00:00:00Z",
      "end": "2025-01-25T23:59:59Z"
    },
    "store_code": "AME"
  }'
```

### Updating Banner Priority
```bash
curl -X PUT http://localhost:5000/api/banners/68c333bc0c797a1118e7e5ce \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 8,
    "placement": {
      "page": "homepage",
      "position": "middle",
      "platform": ["web", "android", "ios"]
    }
  }'
```

### Toggling Banner Status
```bash
curl -X PATCH http://localhost:5000/api/banners/68c333bc0c797a1118e7e5ce/toggle-status \
  -H "Authorization: Bearer your_jwt_token"
```

---

## Notes

1. **Backward Compatibility**: All existing banner data has been migrated to the new schema while maintaining backward compatibility.

2. **Validation**: All endpoints include comprehensive validation using express-validator.

3. **Error Handling**: Consistent error response format across all endpoints.

4. **Pagination**: Admin list endpoint supports pagination for better performance with large datasets.

5. **Bulk Operations**: Bulk priority update endpoint allows efficient management of multiple banners.

6. **Status Management**: Easy toggle functionality for enabling/disabling banners without full updates.

7. **Platform Targeting**: Banners can be targeted to specific platforms (web, android, ios, mobile).

8. **Validity Periods**: Banners respect start and end dates for automatic activation/deactivation.
