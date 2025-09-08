import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Users, 
  Monitor, 
  Cookie,
  AlertCircle, 
  Info, 
  RefreshCw,
  LogOut,
  Shield,
  Database,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { authService } from '../../services/authService';
import { sessionAuthService } from '../../services/sessionAuthService';
import { cookieAuthService } from '../../services/cookieAuthService';
import { sessionStorageService } from '../../services/sessionStorageService';

interface AuthModeSelectorProps {
  onModeChange: (mode: 'localStorage' | 'sessionStorage' | 'httpOnlyCookies') => void;
  currentMode: 'localStorage' | 'sessionStorage' | 'httpOnlyCookies';
}

export const AuthModeSelector: React.FC<AuthModeSelectorProps> = ({ onModeChange, currentMode }) => {
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

  const getCookieAuthInfo = async () => {
    try {
      const sessionInfo = await cookieAuthService.getSessionInfo();
      const sessionData = await cookieAuthService.validateSession();
      
      return {
        sessionId: sessionInfo.sessionId,
        hasAccessToken: sessionInfo.hasAccessToken,
        hasRefreshToken: sessionInfo.hasRefreshToken,
        cookies: sessionInfo.cookies,
        user: sessionData?.user || null,
        isAuthenticated: !!sessionData?.user
      };
    } catch (error) {
      return {
        sessionId: null,
        hasAccessToken: false,
        hasRefreshToken: false,
        cookies: [],
        user: null,
        isAuthenticated: false
      };
    }
  };

  const [cookieInfo, setCookieInfo] = useState<any>(null);

  React.useEffect(() => {
    if (currentMode === 'httpOnlyCookies') {
      getCookieAuthInfo().then(setCookieInfo);
    }
  }, [currentMode, refreshing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentMode === 'httpOnlyCookies') {
        const info = await getCookieAuthInfo();
        setCookieInfo(info);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (currentMode === 'localStorage') {
      authService.logout();
    } else if (currentMode === 'sessionStorage') {
      sessionAuthService.logout();
    } else if (currentMode === 'httpOnlyCookies') {
      await cookieAuthService.logout();
      setCookieInfo(null);
    }
  };

  const localInfo = getLocalStorageInfo();
  const sessionInfo = getSessionStorageInfo();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">🔑 Authentication Mode Selector</h2>
        <p className="text-gray-600">
          Choose your preferred authentication method with different security and session isolation features
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div><strong>localStorage:</strong> Authentication shared across all browser tabs/windows. Tokens stored in browser storage.</div>
            <div><strong>sessionStorage:</strong> Each browser tab has its own authentication session. Tab-isolated tokens.</div>
            <div><strong>HTTP-Only Cookies (✅ Recommended):</strong> Most secure option. Tokens stored in HTTP-only cookies, inaccessible to JavaScript.</div>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs value={currentMode} onValueChange={(value) => onModeChange(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="localStorage" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            localStorage
          </TabsTrigger>
          <TabsTrigger value="sessionStorage" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            sessionStorage
          </TabsTrigger>
          <TabsTrigger value="httpOnlyCookies" className="flex items-center gap-2">
            <Cookie className="h-4 w-4" />
            HTTP-Only Cookies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="localStorage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                localStorage Authentication
              </CardTitle>
              <CardDescription>
                Traditional browser storage - shared across all tabs
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
                  <h4 className="font-medium">Security Features</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>Accessible to JavaScript</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>Vulnerable to XSS attacks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Persists browser restart</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessionStorage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                sessionStorage Authentication
              </CardTitle>
              <CardDescription>
                Tab-isolated sessions - each browser tab has independent authentication
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
                  <h4 className="font-medium">Security Features</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>Accessible to JavaScript</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Tab-isolated sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Multi-user capable</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="httpOnlyCookies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                HTTP-Only Cookies Authentication ✅
              </CardTitle>
              <CardDescription>
                Most secure option - tokens stored in HTTP-only cookies, inaccessible to JavaScript
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
                        {cookieInfo?.sessionId?.slice(-8) || 'None'}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">User:</span>
                      <span className="text-sm font-medium">
                        {cookieInfo?.user?.username || 'None'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Role:</span>
                      <Badge variant="outline">{cookieInfo?.user?.role || 'None'}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Authenticated:</span>
                      <Badge variant={cookieInfo?.isAuthenticated ? 'default' : 'secondary'}>
                        {cookieInfo?.isAuthenticated ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Security Features</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>HTTP-Only cookies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Protected from XSS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Secure & SameSite flags</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Session isolation support</span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best Practice:</strong> HTTP-Only cookies provide the highest security by preventing JavaScript access to authentication tokens, making them immune to XSS attacks while still supporting session isolation.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">Cookie Information</h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Access Token Cookie:</span>
                    <Badge variant={cookieInfo?.hasAccessToken ? 'default' : 'secondary'}>
                      {cookieInfo?.hasAccessToken ? 'Present' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Refresh Token Cookie:</span>
                    <Badge variant={cookieInfo?.hasRefreshToken ? 'default' : 'secondary'}>
                      {cookieInfo?.hasRefreshToken ? 'Present' : 'Missing'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={handleLogout} variant="destructive" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Logout Current Session
        </Button>
      </div>

      {/* Security Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Security Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2">localStorage</th>
                  <th className="text-center p-2">sessionStorage</th>
                  <th className="text-center p-2">HTTP-Only Cookies</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">XSS Protection</td>
                  <td className="text-center p-2"><XCircle className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center p-2"><XCircle className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Session Isolation</td>
                  <td className="text-center p-2"><XCircle className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Automatic Refresh</td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Persist Browser Restart</td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2"><XCircle className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center p-2"><CheckCircle className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Security Rating</td>
                  <td className="text-center p-2"><Badge variant="destructive">Low</Badge></td>
                  <td className="text-center p-2"><Badge variant="secondary">Medium</Badge></td>
                  <td className="text-center p-2"><Badge variant="default">High ✅</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
