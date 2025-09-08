import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Users, 
  Monitor, 
  AlertCircle, 
  Info, 
  RefreshCw,
  LogOut,
  User
} from 'lucide-react';
import { authService } from '../../services/authService';
import { sessionAuthService } from '../../services/sessionAuthService';
import { sessionStorageService } from '../../services/sessionStorageService';

interface SessionSelectorProps {
  onModeChange: (mode: 'localStorage' | 'sessionStorage') => void;
  currentMode: 'localStorage' | 'sessionStorage';
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({ onModeChange, currentMode }) => {
  const [refreshing, setRefreshing] = useState(false);

  const getLocalStorageInfo = () => {
    const user = authService.getUser();
    const token = authService.getToken();
    const isAuth = authService.isAuthenticated();
    
    return {
      hasUser: !!user,
      hasToken: !!token,
      isAuthenticated: isAuth,
      user: user,
      displayName: authService.getDisplayName(),
      role: user?.role || 'None'
    };
  };

  const getSessionStorageInfo = () => {
    return sessionAuthService.getSessionInfo();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentMode === 'localStorage') {
        // Refresh localStorage auth state
        const user = authService.getUser();
        console.log('Refreshed localStorage auth:', { user, isAuth: authService.isAuthenticated() });
      } else {
        // Refresh sessionStorage auth state
        const sessionInfo = sessionAuthService.getSessionInfo();
        console.log('Refreshed sessionStorage auth:', sessionInfo);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    if (currentMode === 'localStorage') {
      authService.logout();
    } else {
      sessionAuthService.logout();
    }
  };

  const localInfo = getLocalStorageInfo();
  const sessionInfo = getSessionStorageInfo();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Authentication Mode Selector</h2>
        <p className="text-gray-600">
          Choose between shared authentication (localStorage) or isolated sessions (sessionStorage)
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>localStorage:</strong> Authentication is shared across all browser tabs/windows. 
          When you login in one tab, all tabs are authenticated as that user.
          <br />
          <strong>sessionStorage:</strong> Each browser tab/window has its own authentication session. 
          You can login as different users in different tabs.
        </AlertDescription>
      </Alert>

      <Tabs value={currentMode} onValueChange={(value) => onModeChange(value as 'localStorage' | 'sessionStorage')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="localStorage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shared (localStorage)
          </TabsTrigger>
          <TabsTrigger value="sessionStorage" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Isolated (sessionStorage)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="localStorage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Shared Authentication (localStorage)
              </CardTitle>
              <CardDescription>
                Authentication state shared across all browser tabs and windows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Authenticated:</span>
                      <Badge variant={localInfo.isAuthenticated ? 'default' : 'secondary'}>
                        {localInfo.isAuthenticated ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">User:</span>
                      <span className="text-sm font-medium">{localInfo.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Role:</span>
                      <Badge variant="outline">{localInfo.role}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Storage Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Has User Data:</span>
                      <Badge variant={localInfo.hasUser ? 'default' : 'secondary'}>
                        {localInfo.hasUser ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Has Token:</span>
                      <Badge variant={localInfo.hasToken ? 'default' : 'secondary'}>
                        {localInfo.hasToken ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {localInfo.isAuthenticated && (
                  <Button onClick={handleLogout} variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessionStorage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Isolated Authentication (sessionStorage)
              </CardTitle>
              <CardDescription>
                Each browser tab has its own independent authentication session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Session</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Session ID:</span>
                      <code className="text-xs bg-gray-100 px-1 rounded">
                        {sessionInfo.sessionId?.slice(-8) || 'None'}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">User:</span>
                      <span className="text-sm font-medium">
                        {sessionInfo.user?.username || 'None'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Role:</span>
                      <Badge variant="outline">{sessionInfo.user?.role || 'None'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Storage Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Has User Data:</span>
                      <Badge variant={sessionInfo.hasUser ? 'default' : 'secondary'}>
                        {sessionInfo.hasUser ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Has Token:</span>
                      <Badge variant={sessionInfo.hasToken ? 'default' : 'secondary'}>
                        {sessionInfo.hasToken ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Has Refresh Token:</span>
                      <Badge variant={sessionInfo.hasRefreshToken ? 'default' : 'secondary'}>
                        {sessionInfo.hasRefreshToken ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Session Isolation:</strong> This tab's authentication is independent of other tabs. 
                  You can login as different users in different browser tabs/windows.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {sessionInfo.hasUser && (
                  <Button onClick={handleLogout} variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout This Session
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>How to Test Multi-User Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Select "Isolated (sessionStorage)" mode above</li>
            <li>Login as User A in this tab</li>
            <li>Open a new browser tab/window and navigate to the login page</li>
            <li>Login as User B in the new tab</li>
            <li>Switch between tabs - each will maintain its own user session</li>
            <li>Refresh either tab - the authentication state will persist for that specific tab</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
