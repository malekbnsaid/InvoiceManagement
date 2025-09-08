# 🔑 HTTP-Only Cookies Authentication

This document explains the HTTP-only cookie authentication implementation, which provides the highest security level for web applications.

## 🛡️ Why HTTP-Only Cookies?

### Security Benefits

| Feature | localStorage/sessionStorage | HTTP-Only Cookies |
|---------|----------------------------|------------------|
| **XSS Protection** | ❌ Vulnerable | ✅ Protected |
| **JavaScript Access** | ❌ Accessible | ✅ Inaccessible |
| **CSRF Protection** | ⚠️ Manual | ✅ Built-in (SameSite) |
| **Network Security** | ⚠️ Manual | ✅ Secure flag |
| **Session Isolation** | ⚠️ Complex | ✅ Native support |

### Key Advantages

1. **XSS Immunity**: Tokens cannot be accessed by malicious JavaScript
2. **Automatic Security**: Browser handles secure transmission
3. **Session Isolation**: Each tab can maintain separate sessions
4. **CSRF Protection**: SameSite cookies prevent cross-site attacks
5. **Professional Standard**: Industry best practice for authentication

## 🏗️ Architecture

### Backend Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP-Only Cookie Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Login Request                                               │
│     POST /api/cookieauth/login                                  │
│     { username, password }                                      │
│                                                                 │
│  2. Server Response                                             │
│     Set-Cookie: access_token=xxx; HttpOnly; Secure; SameSite   │
│     Set-Cookie: refresh_token=yyy; HttpOnly; Secure; SameSite  │
│     Set-Cookie: session_id=zzz; Secure; SameSite              │
│                                                                 │
│  3. Subsequent Requests                                         │
│     Cookie: access_token=xxx; refresh_token=yyy; session_id=zzz │
│                                                                 │
│  4. Automatic Refresh                                           │
│     POST /api/cookieauth/refresh (cookies sent automatically)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### Backend Services

1. **`CookieAuthService`** - Core authentication logic
2. **`CookieAuthController`** - HTTP endpoints for cookie auth
3. **`CookieAuthMiddleware`** - Automatic token extraction
4. **Session Management** - In-memory session store (Redis in production)

#### Frontend Services

1. **`cookieAuthService`** - Client-side authentication API
2. **`CookieAuthContext`** - React context for auth state
3. **`cookieApi`** - Axios instance with cookie support
4. **Automatic Refresh** - Background token renewal

## 🚀 Implementation

### Backend Setup

#### 1. Services Registration (Program.cs)
```csharp
// Register cookie authentication service
builder.Services.AddScoped<ICookieAuthService, CookieAuthService>();
```

#### 2. Middleware Configuration
```csharp
// Add cookie authentication middleware
app.UseCookieAuth();
```

#### 3. CORS Configuration
```csharp
builder.WithOrigins("http://localhost:5173")
       .AllowAnyMethod()
       .AllowAnyHeader()
       .AllowCredentials(); // Required for cookies
```

### Frontend Setup

#### 1. API Configuration
```typescript
// Configure axios for cookies
export const cookieApi = axios.create({
  baseURL: 'http://localhost:5274/api',
  withCredentials: true // Always send cookies
});
```

#### 2. Authentication Context
```typescript
// Use cookie auth context
<CookieAuthProvider>
  <App />
</CookieAuthProvider>
```

## 🔧 Usage Examples

### Login
```typescript
// Frontend
const response = await cookieAuthService.login({
  username: 'admin',
  password: 'admin'
});

// Backend automatically sets HTTP-only cookies
// No tokens in response body for security
```

### API Requests
```typescript
// Cookies are sent automatically
const projects = await cookieApi.get('/projects');

// No manual token management needed
```

### Session Isolation
```typescript
// Each tab gets unique session ID
const sessionId = cookieAuthService.getSessionIdFromCookie();
console.log('Current session:', sessionId);
```

## 🔒 Security Features

### Cookie Configuration

```csharp
var cookieOptions = new CookieOptions
{
    HttpOnly = true,           // Prevent JavaScript access
    Secure = !isDevelopment,   // HTTPS only in production
    SameSite = SameSiteMode.Lax, // CSRF protection
    Expires = DateTime.UtcNow.AddHours(1), // Token expiration
    Path = "/",                // Available to entire app
    Domain = GetDomain()       // Domain restriction
};
```

### Session Management

```csharp
public class SessionData
{
    public string SessionId { get; set; }
    public int UserId { get; set; }
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime LastActivity { get; set; }
    // Additional security metadata
}
```

## 🧪 Testing

### 1. Enable HTTP-Only Cookie Mode
- Click the settings button (⚙️) in the top-right
- Select "HTTP-Only Cookies" tab
- Notice the badge shows "HTTP-Only Cookies"

### 2. Login Process
- Login with any test account
- Open browser DevTools → Application → Cookies
- Verify cookies are marked as "HttpOnly"

### 3. Session Isolation Test
- Open multiple tabs
- Each tab can have different authenticated users
- Session IDs are unique per tab

### 4. Security Verification
- Try accessing cookies via JavaScript console:
  ```javascript
  document.cookie // Should not show auth tokens
  ```
- Verify automatic token refresh works
- Test logout clears all cookies

## 🔍 Debugging

### Backend Logs
```
🔐 CookieAuth: Login successful for user: admin, Session: session_123
🔐 CookieAuthController: Set authentication cookies for session: session_123
🔐 CookieAuthMiddleware: Authenticated user from cookie for session: session_123
```

### Frontend Logs
```
🔐 CookieAuthService: Login successful, session: session_123
🔐 CookieAPI: Making request to: GET /projects
🔐 CookieAPI: Session ID: session_123
```

### Session Info Endpoint
```
GET /api/cookieauth/session-info
Response:
{
  "sessionId": "session_123",
  "hasAccessToken": true,
  "hasRefreshToken": true,
  "cookies": ["access_token", "refresh_token", "session_id"]
}
```

## 🚨 Production Considerations

### 1. Cookie Security
```csharp
var cookieOptions = new CookieOptions
{
    HttpOnly = true,
    Secure = true,              // HTTPS required
    SameSite = SameSiteMode.Strict, // Stricter CSRF protection
    Domain = ".yourdomain.com", // Proper domain setting
    Path = "/"
};
```

### 2. Session Storage
- **Development**: In-memory storage (current)
- **Production**: Use Redis or database
- **Cleanup**: Implement session cleanup job

### 3. HTTPS Requirements
- HTTP-Only cookies with `Secure` flag require HTTPS
- Use reverse proxy (nginx/Apache) for SSL termination
- Configure proper SSL certificates

### 4. Domain Configuration
```csharp
private string GetDomain()
{
    // Production domain configuration
    if (_environment.IsProduction())
    {
        return ".yourdomain.com"; // Allow subdomains
    }
    
    return null; // Development - no domain restriction
}
```

## 🛠️ Migration Guide

### From localStorage to HTTP-Only Cookies

1. **Update App Component**
   ```typescript
   // Replace App.tsx with App-Cookie.tsx
   mv src/App.tsx src/App-localStorage.tsx
   mv src/App-Cookie.tsx src/App.tsx
   ```

2. **Test Authentication**
   - Verify login/logout works
   - Check cookie presence in DevTools
   - Test automatic token refresh

3. **Update API Calls**
   ```typescript
   // Replace api imports
   import { cookieApi as api } from './services/api/cookieApi';
   ```

## 📊 Performance Impact

### Metrics
- **Cookie Size**: ~200 bytes per request
- **Network Overhead**: Minimal (cookies sent automatically)
- **Memory Usage**: Session storage (configurable)
- **Security Gain**: Significant XSS protection

### Optimizations
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days)
- Automatic cleanup of expired sessions
- Efficient session lookup algorithms

## 🎯 Best Practices

1. **Security First**: Always use HTTP-only cookies for tokens
2. **Session Isolation**: Support multiple user sessions
3. **Automatic Refresh**: Implement seamless token renewal
4. **Proper Cleanup**: Remove expired sessions regularly
5. **HTTPS Only**: Never use cookies without encryption
6. **Domain Restrictions**: Set appropriate cookie domains
7. **SameSite Protection**: Use SameSite flags for CSRF protection

---

**HTTP-Only Cookies provide the gold standard for web application authentication security while maintaining excellent user experience and session management capabilities.**
