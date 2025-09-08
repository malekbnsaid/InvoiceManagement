import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Users, 
  Monitor, 
  AlertCircle, 
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionAuthService } from '../services/sessionAuthService';
import { authService } from '../services/authService';

export const SessionDemoPage: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const currentUrl = window.location.href;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const openNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  const getLocalStorageInfo = () => {
    const user = authService.getUser();
    return {
      hasUser: !!user,
      user: user,
      isAuthenticated: authService.isAuthenticated()
    };
  };

  const getSessionStorageInfo = () => {
    return sessionAuthService.getSessionInfo();
  };

  const localInfo = getLocalStorageInfo();
  const sessionInfo = getSessionStorageInfo();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Multi-User Session Demo</h1>
        <p className="text-gray-600">
          Demonstration of session-isolated authentication
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Current User:</strong> {user?.username || 'Not logged in'} 
          {user && (
            <>
              {' '}(<Badge variant="outline">{user.role}</Badge>)
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              This Tab's Session
            </CardTitle>
            <CardDescription>
              Current authentication state for this browser tab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Session ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {sessionInfo.sessionId?.slice(-8) || 'None'}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">User:</span>
                <span className="text-sm">{sessionInfo.user?.username || 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{sessionInfo.user?.role || 'None'}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Authenticated:</span>
                <Badge variant={sessionInfo.hasUser ? 'default' : 'secondary'}>
                  {sessionInfo.hasUser ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Global Storage (localStorage)
            </CardTitle>
            <CardDescription>
              Shared authentication state across all tabs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">User:</span>
                <span className="text-sm">{localInfo.user?.username || 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{localInfo.user?.role || 'None'}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Authenticated:</span>
                <Badge variant={localInfo.isAuthenticated ? 'default' : 'secondary'}>
                  {localInfo.isAuthenticated ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test Session Isolation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Make sure you're using sessionStorage mode (check the badge in the top right)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Note your current session ID and user above</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div className="flex items-center gap-2">
                <span>Open this page in a new tab:</span>
                <Button onClick={openNewTab} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open New Tab
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>In the new tab, login as a different user</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>Switch between tabs - each will show different session IDs and users!</span>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected Result:</strong> Each browser tab will maintain its own authentication session, 
              allowing you to be logged in as different users simultaneously.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={copyUrl} variant="outline" size="sm">
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Page URL'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Users */}
      <Card>
        <CardHeader>
          <CardTitle>Test Users</CardTitle>
          <CardDescription>
            Use these test accounts to demonstrate session isolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg space-y-1">
              <div className="font-medium">Admin User</div>
              <div className="text-sm text-gray-600">Username: admin</div>
              <div className="text-sm text-gray-600">Password: admin</div>
              <Badge variant="destructive">Admin</Badge>
            </div>
            <div className="p-3 border rounded-lg space-y-1">
              <div className="font-medium">PMO User</div>
              <div className="text-sm text-gray-600">Username: pmo</div>
              <div className="text-sm text-gray-600">Password: pmo</div>
              <Badge variant="default">PMO</Badge>
            </div>
            <div className="p-3 border rounded-lg space-y-1">
              <div className="font-medium">PM User</div>
              <div className="text-sm text-gray-600">Username: pm</div>
              <div className="text-sm text-gray-600">Password: pm</div>
              <Badge variant="secondary">PM</Badge>
            </div>
            <div className="p-3 border rounded-lg space-y-1">
              <div className="font-medium">Secretary User</div>
              <div className="text-sm text-gray-600">Username: secretary</div>
              <div className="text-sm text-gray-600">Password: secretary</div>
              <Badge variant="outline">Secretary</Badge>
            </div>
            <div className="p-3 border rounded-lg space-y-1">
              <div className="font-medium">Read Only User</div>
              <div className="text-sm text-gray-600">Username: readonly</div>
              <div className="text-sm text-gray-600">Password: readonly</div>
              <Badge variant="secondary">ReadOnly</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
