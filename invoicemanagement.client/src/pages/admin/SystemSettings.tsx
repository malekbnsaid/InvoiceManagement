import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Mail, 
  Shield, 
  Bell,
  Globe,
  Lock,
  Key,
  Server,
  AlertTriangle
} from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // General Settings
    appName: 'Invoice Management System',
    appVersion: '1.0.0',
    timezone: 'Asia/Qatar',
    language: 'en',
    maintenanceMode: false,
    
    // Database Settings
    dbHost: 'localhost',
    dbPort: '1433',
    dbName: 'InvoiceManagement',
    dbBackupFrequency: 'daily',
    
    // Email Settings
    smtpHost: 'smtp.company.com',
    smtpPort: '587',
    smtpUsername: 'noreply@company.com',
    emailNotifications: true,
    
    // Security Settings
    passwordMinLength: 8,
    sessionTimeout: 30,
    twoFactorAuth: false,
    loginAttempts: 5,
    
    // OCR Settings
    ocrProvider: 'Azure',
    ocrConfidence: 85,
    autoProcessing: true,
    
    // Power BI Settings
    powerBiEnabled: true,
    powerBiWorkspace: 'Company Workspace',
    
    // Notification Settings
    emailAlerts: true,
    systemAlerts: true,
    weeklyReports: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
  };

  const handleReset = () => {
    // Reset to default values
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="h-8 w-8 mr-3 text-red-600" />
                System Settings
              </h1>
              <p className="text-gray-600 mt-2">
                Configure system-wide settings and preferences
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="appName">Application Name</Label>
                <Input
                  id="appName"
                  value={settings.appName}
                  onChange={(e) => setSettings({...settings, appName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="appVersion">Version</Label>
                <Input
                  id="appVersion"
                  value={settings.appVersion}
                  onChange={(e) => setSettings({...settings, appVersion: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Qatar">Asia/Qatar</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Put system in maintenance mode</p>
                </div>
                <Checkbox
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-green-600" />
                Database Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dbHost">Database Host</Label>
                <Input
                  id="dbHost"
                  value={settings.dbHost}
                  onChange={(e) => setSettings({...settings, dbHost: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="dbPort">Port</Label>
                <Input
                  id="dbPort"
                  value={settings.dbPort}
                  onChange={(e) => setSettings({...settings, dbPort: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="dbName">Database Name</Label>
                <Input
                  id="dbName"
                  value={settings.dbName}
                  onChange={(e) => setSettings({...settings, dbName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="backup">Backup Frequency</Label>
                <Select value={settings.dbBackupFrequency} onValueChange={(value) => setSettings({...settings, dbBackupFrequency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-purple-600" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input
                  id="smtpUsername"
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({...settings, smtpUsername: e.target.value})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send system notifications via email</p>
                </div>
                <Checkbox
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="passwordLength">Minimum Password Length</Label>
                <Input
                  id="passwordLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                />
              </div>
              
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                />
              </div>
              
              <div>
                <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                <Input
                  id="loginAttempts"
                  type="number"
                  value={settings.loginAttempts}
                  onChange={(e) => setSettings({...settings, loginAttempts: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Require 2FA for all users</p>
                </div>
                <Checkbox
                  id="twoFactor"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* OCR Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-orange-600" />
                OCR Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ocrProvider">OCR Provider</Label>
                <Select value={settings.ocrProvider} onValueChange={(value) => setSettings({...settings, ocrProvider: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Azure">Azure Form Recognizer</SelectItem>
                    <SelectItem value="Google">Google Vision</SelectItem>
                    <SelectItem value="AWS">AWS Textract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ocrConfidence">Confidence Threshold (%)</Label>
                <Input
                  id="ocrConfidence"
                  type="number"
                  value={settings.ocrConfidence}
                  onChange={(e) => setSettings({...settings, ocrConfidence: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoProcessing">Auto Processing</Label>
                  <p className="text-sm text-gray-500">Automatically process uploaded documents</p>
                </div>
                <Checkbox
                  id="autoProcessing"
                  checked={settings.autoProcessing}
                  onCheckedChange={(checked) => setSettings({...settings, autoProcessing: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Power BI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2 text-indigo-600" />
                Power BI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="powerBiEnabled">Power BI Integration</Label>
                  <p className="text-sm text-gray-500">Enable Power BI reports</p>
                </div>
                <Checkbox
                  id="powerBiEnabled"
                  checked={settings.powerBiEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, powerBiEnabled: checked})}
                />
              </div>
              
              <div>
                <Label htmlFor="powerBiWorkspace">Workspace</Label>
                <Input
                  id="powerBiWorkspace"
                  value={settings.powerBiWorkspace}
                  onChange={(e) => setSettings({...settings, powerBiWorkspace: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-yellow-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailAlerts">Email Alerts</Label>
                    <p className="text-sm text-gray-500">Send email notifications</p>
                  </div>
                  <Checkbox
                    id="emailAlerts"
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, emailAlerts: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts">System Alerts</Label>
                    <p className="text-sm text-gray-500">Show in-app notifications</p>
                  </div>
                  <Checkbox
                    id="systemAlerts"
                    checked={settings.systemAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, systemAlerts: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-gray-500">Send weekly summary reports</p>
                  </div>
                  <Checkbox
                    id="weeklyReports"
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => setSettings({...settings, weeklyReports: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Banner */}
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <h3 className="font-medium text-orange-800">Important</h3>
                <p className="text-sm text-orange-700">
                  Changes to system settings may require a restart to take effect. 
                  Please test changes in a development environment first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
