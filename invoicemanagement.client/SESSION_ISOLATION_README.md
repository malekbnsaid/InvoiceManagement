# 🔐 Session Isolation Feature

This document explains the session isolation feature that allows multiple users to be authenticated simultaneously in different browser tabs.

## 🚀 Quick Start

1. **Start the application** as usual
2. **Look for the auth mode badge** in the top-right corner
3. **Click the settings button** next to the badge to open the Session Selector
4. **Choose "Isolated (sessionStorage)"** mode
5. **Test multi-user sessions** by opening multiple tabs

## 🔄 Authentication Modes

### localStorage Mode (Default - Shared)
- ✅ **Shared across tabs**: All browser tabs share the same authentication
- ✅ **Persistent**: Survives browser restart
- ❌ **Single user only**: All tabs must use the same user account
- 🎯 **Use case**: Single-user workstation

### sessionStorage Mode (Isolated)
- ✅ **Tab-isolated**: Each browser tab has independent authentication
- ✅ **Multi-user**: Different users can be logged in simultaneously
- ❌ **Session-only**: Cleared when tab is closed
- 🎯 **Use case**: Shared workstation, testing, multi-role workflows

## 🧪 Testing Session Isolation

### Step-by-Step Test

1. **Enable sessionStorage mode**
   - Click the settings button (⚙️) in the top-right
   - Select "Isolated (sessionStorage)" tab
   - Notice the badge changes to "Session Isolated"

2. **Login as User A**
   - Login with any test account (e.g., admin/admin)
   - Note the session ID in the Session Selector

3. **Open new tab**
   - Right-click and "Open in new tab" or use Ctrl+T
   - Navigate to the same application URL
   - Notice you're not logged in (independent session)

4. **Login as User B**
   - Login with a different test account (e.g., pmo/pmo)
   - Note the different session ID

5. **Switch between tabs**
   - Each tab maintains its own user session
   - Different permissions and UI based on role
   - Independent authentication states

### Test Accounts

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin | Admin | Full access |
| pmo | pmo | PMO | Project approval + management |
| pm | pm | PM | Project creation + management |
| secretary | secretary | Secretary | Invoice upload + management |
| readonly | readonly | ReadOnly | View only |

## 🏗️ Technical Implementation

### Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Tab 1 (Admin) │    │   Tab 2 (PMO)   │
├─────────────────┤    ├─────────────────┤
│ SessionStorage  │    │ SessionStorage  │
│ - User: admin   │    │ - User: pmo     │
│ - Token: xxx    │    │ - Token: yyy    │
│ - Session: A1   │    │ - Session: B2   │
└─────────────────┘    └─────────────────┘
```

### Key Components

1. **SessionStorageService** (`sessionStorageService.ts`)
   - Manages sessionStorage operations
   - Generates unique session IDs
   - Provides session isolation

2. **SessionAuthService** (`sessionAuthService.ts`)
   - Authentication service using sessionStorage
   - Independent of localStorage-based auth
   - Session-aware token management

3. **SessionAuthContext** (`SessionAuthContext.tsx`)
   - React context for session-isolated auth
   - Provides session-aware hooks
   - Manages session state

4. **SessionSelector** (`SessionSelector.tsx`)
   - UI for switching between auth modes
   - Real-time session information display
   - Debugging and testing tools

### Storage Comparison

| Feature | localStorage | sessionStorage |
|---------|--------------|----------------|
| **Scope** | Domain-wide | Tab-specific |
| **Persistence** | Until cleared | Until tab closed |
| **Sharing** | All tabs | Single tab only |
| **Multi-user** | ❌ No | ✅ Yes |
| **Debugging** | Shared state | Isolated state |

## 🛠️ Usage Scenarios

### Development & Testing
- **Role Testing**: Test different user roles simultaneously
- **Permission Testing**: Verify role-based UI changes
- **Workflow Testing**: Multi-user approval workflows
- **Bug Reproduction**: Isolate user-specific issues

### Production Use Cases
- **Shared Workstations**: Multiple users on same computer
- **Support/Admin**: Access as different users for troubleshooting
- **Training**: Demonstrate different user experiences
- **Multi-Role Users**: Users with multiple role responsibilities

## 🐛 Troubleshooting

### Session Not Isolated
- **Check mode**: Ensure "Session Isolated" badge is shown
- **Refresh page**: Session mode is set on page load
- **Clear storage**: Use browser dev tools to clear sessionStorage

### Authentication Issues
- **Check session ID**: Each tab should have different session ID
- **Verify tokens**: Each session should have independent tokens
- **Backend compatibility**: Ensure server accepts different tokens

### Performance Considerations
- **Memory usage**: Each tab maintains separate auth state
- **Token refresh**: Independent refresh cycles per tab
- **Network requests**: Each tab makes separate auth requests

## 🔧 Configuration

### Environment Variables
```bash
# Enable/disable dev bypass (optional)
VITE_DEV_BYPASS=false

# API configuration
VITE_API_BASE_URL=http://localhost:5274/api
```

### Default Settings
- **Default mode**: localStorage (shared)
- **Session timeout**: Based on JWT expiration
- **Auto-cleanup**: Expired sessions cleared on startup

## 📝 Notes

- **Browser compatibility**: Modern browsers with sessionStorage support
- **Security**: Each session maintains independent security context
- **Scalability**: No limit on number of concurrent sessions
- **Data isolation**: Complete separation between tab sessions

## 🚨 Important Considerations

1. **Data Loss**: sessionStorage data is lost when tab closes
2. **Memory Usage**: Each tab maintains separate authentication state
3. **Backend Load**: Multiple concurrent sessions from same client
4. **User Experience**: Users need to understand session isolation

---

*This feature enables powerful multi-user testing and shared workstation scenarios while maintaining security and user experience.*
