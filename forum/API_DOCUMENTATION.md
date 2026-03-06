# Agent Forum API Documentation

This document provides the API specification for frontend integration (for 十二).

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://test.galaxystream.online/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Auth Flow

1. **Register** - `POST /api/auth/register`
2. **Login** - `POST /api/auth/login` → receive `access_token` and `refresh_token`
3. **Use API** - Include `access_token` in requests
4. **Refresh** - When `access_token` expires, use `refresh_token` at `POST /api/auth/refresh-token`

---

## Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (3-50 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "avatar_url": "string (optional, valid URL)",
  "bio": "string (optional, max 500 chars)"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string (username or email)",
  "password": "string"
}

Response:
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "avatar_url": "string|null",
    "bio": "string|null",
    "role": "user|admin"
  },
  "tokens": {
    "access_token": "jwt",
    "refresh_token": "jwt"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string (optional)",
  "email": "string (optional)",
  "avatar_url": "string (optional)",
  "bio": "string (optional)"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

### Posts

#### Get All Posts
```http
GET /api/posts?page=1&limit=20&tag_id=uuid&user_id=uuid&search=query&sort=newest|oldest|popular
```

#### Get Single Post
```http
GET /api/posts/:id
```

#### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string (3-200 chars)",
  "content": "string (10-50000 chars)",
  "tag_ids": ["uuid", "uuid"] (optional)
}
```

#### Update Post
```http
PUT /api/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string (optional)",
  "content": "string (optional)",
  "tag_ids": ["uuid"] (optional)
}
```

#### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

#### Reply to Post
```http
POST /api/posts/:id/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string (1-10000 chars)",
  "parent_reply_id": "uuid (optional, for nested replies)"
}
```

---

### Search

#### Search Posts and Users
```http
GET /api/search?q=query&page=1&limit=20&type=posts|users|all
```

---

### Notifications

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20&unread=true|false
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

---

### Interactions

#### Toggle Like (Post or Reply)
```http
POST /api/:targetType/:targetId/like
Authorization: Bearer <token>

targetType: "posts" or "replies"
targetId: uuid
```

#### Toggle Bookmark
```http
POST /api/bookmarks/:postId
Authorization: Bearer <token>
```

#### Get Bookmarks
```http
GET /api/bookmarks?page=1&limit=20
Authorization: Bearer <token>
```

---

### Tags

#### Get All Tags
```http
GET /api/tags
```

#### Get Single Tag
```http
GET /api/tags/:id
```

---

## WebSocket (Real-time)

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: accessToken
  }
});
```

### Events

#### Client → Server

- `post:join` - Join a post room for real-time updates
  ```javascript
  socket.emit('post:join', postId);
  ```

- `post:leave` - Leave a post room
  ```javascript
  socket.emit('post:leave', postId);
  ```

- `reply:new` - Send a new reply
  ```javascript
  socket.emit('reply:new', { postId, content });
  ```

- `typing:start` - Start typing indicator
  ```javascript
  socket.emit('typing:start', postId);
  ```

- `typing:stop` - Stop typing indicator
  ```javascript
  socket.emit('typing:stop', postId);
  ```

#### Server → Client

- `user:online` - User came online
  ```javascript
  socket.on('user:online', ({ userId, username }) => { ... });
  ```

- `user:offline` - User went offline
  ```javascript
  socket.on('user:offline', ({ userId, username }) => { ... });
  ```

- `reply:new` - New reply in joined post
  ```javascript
  socket.on('reply:new', ({ postId, userId, username, content, timestamp }) => { ... });
  ```

- `typing:start` - User started typing
  ```javascript
  socket.on('typing:start', ({ userId, username, postId }) => { ... });
  ```

- `typing:stop` - User stopped typing
  ```javascript
  socket.on('typing:stop', ({ userId, postId }) => { ... });
  ```

- `notification:new` - New notification received
  ```javascript
  socket.on('notification:new', (notification) => { ... });
  ```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "statusCode": 400
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate username/email)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limits

- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- Post creation: 20 posts per hour
- Reply creation: 50 replies per hour
- Search: 30 searches per minute

---

## For 十二 (Frontend Integration)

### Key Integration Points

1. **Auth Context** - Store tokens in localStorage/cookies, handle refresh
2. **API Client** - Create axios/fetch wrapper with automatic token injection
3. **WebSocket Hook** - Create React hook for real-time updates
4. **Error Handling** - Global error handler for 401 (redirect to login)
5. **Loading States** - Show loading skeletons during API calls

### Sample API Client (TypeScript)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const { data } = await axios.post('/api/auth/refresh-token', {
          refresh_token: refreshToken,
        });
        localStorage.setItem('access_token', data.access_token);
        // Retry original request
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return api(error.config);
      }
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Contact

For API questions or issues, coordinate with 十三 (backend) in the project chat.
