import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import InvoiceDetails from './components/invoices/InvoiceDetails';
import InvoiceUploadForm from './components/invoices/InvoiceUploadForm';
import InvoiceList from './components/invoices/InvoiceList';
import SectionsAndUnits from './components/departments/SectionsAndUnits';
import ProjectsList from './components/projects/ProjectsList';
import ProjectFormPage from './components/projects/ProjectFormPage';
import ProjectDetailsPage from './components/projects/ProjectDetailsPage';
import LPOsList from './components/lpos/LPOsList';
import ProjectEditPage from './pages/ProjectEditPage';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { SessionAuthProvider } from './context/SessionAuthContext';
import { SessionSelector } from './components/auth/SessionSelector';
import { ProtectedRoute, PMOrHigherRoute, PMOOrHigherRoute, SecretaryOrHigherRoute, HeadOrAdminRoute } from './components/auth/ProtectedRoute';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Settings, ArrowLeft } from 'lucide-react';

// Debug environment variables
console.log('🔐 App.tsx: Environment variables:');
console.log('🔐 VITE_DEV_BYPASS:', import.meta.env.VITE_DEV_BYPASS);
console.log('🔐 MODE:', import.meta.env.MODE);
console.log('🔐 DEV:', import.meta.env.DEV);
console.log('🔐 PROD:', import.meta.env.PROD);
console.log('🔐 API Base URL: Using Vite proxy to /api');

// Create a client
const queryClient = new QueryClient();

type AuthMode = 'localStorage' | 'sessionStorage';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('localStorage');
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Mode selector page
  if (showModeSelector) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <Button 
              onClick={() => setShowModeSelector(false)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </div>
          <SessionSelector 
            currentMode={authMode} 
            onModeChange={(mode) => {
              setAuthMode(mode);
              // Optionally close the selector after mode change
              // setShowModeSelector(false);
            }} 
          />
        </div>
      </div>
    );
  }

  // Main app with selected auth mode
  const AppContent = () => (
    <Router>
      <Routes>
        {/* Authentication Routes - No Layout */}
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        
        {/* Main Application Routes - With Layout */}
        <Route path="/*" element={
          <MainLayout>
            {/* Auth Mode Indicator */}
            <div className="fixed top-4 right-4 z-50">
              <div className="flex items-center gap-2">
                <Badge variant={authMode === 'sessionStorage' ? 'default' : 'secondary'}>
                  {authMode === 'sessionStorage' ? 'Session Isolated' : 'Shared Auth'}
                </Badge>
                <Button
                  onClick={() => setShowModeSelector(true)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <ProjectsList />
                </ProtectedRoute>
              } />
              <Route path="/projects/new" element={
                <PMOrHigherRoute>
                  <ProjectFormPage />
                </PMOrHigherRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute>
                  <ProjectDetailsPage />
                </ProtectedRoute>
              } />
              <Route path="invoices" element={
                <ProtectedRoute>
                  <InvoiceList />
                </ProtectedRoute>
              } />
              <Route path="invoices/upload" element={
                <SecretaryOrHigherRoute>
                  <InvoiceUploadForm />
                </SecretaryOrHigherRoute>
              } />
              <Route path="invoices/:id" element={
                <ProtectedRoute>
                  <InvoiceDetails />
                </ProtectedRoute>
              } />
              <Route path="lpos" element={
                <ProtectedRoute>
                  <LPOsList />
                </ProtectedRoute>
              } />
              <Route path="departments" element={
                <HeadOrAdminRoute>
                  <SectionsAndUnits />
                </HeadOrAdminRoute>
              } />
              <Route path="/projects/:id/edit" element={
                <PMOrHigherRoute>
                  <ProjectEditPage />
                </PMOrHigherRoute>
              } />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </Router>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {authMode === 'sessionStorage' ? (
        <SessionAuthProvider>
          <AppContent />
          <Toaster />
        </SessionAuthProvider>
      ) : (
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      )}
    </QueryClientProvider>
  );
}

export default App;
