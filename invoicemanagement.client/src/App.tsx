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
import PMOReviewPage from './pages/PMOReviewPage';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PMOrHigherRoute, PMOOrHigherRoute, SecretaryOrHigherRoute, HeadOrAdminRoute } from './components/auth/ProtectedRoute';
import React from 'react';

// Debug environment variables
console.log('🔐 App.tsx: Environment variables:');
console.log('🔐 VITE_DEV_BYPASS:', import.meta.env.VITE_DEV_BYPASS);
console.log('🔐 MODE:', import.meta.env.MODE);
console.log('🔐 DEV:', import.meta.env.DEV);
console.log('🔐 PROD:', import.meta.env.PROD);
console.log('🔐 API Base URL: Using Vite proxy to /api');

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Authentication Routes - No Layout */}
            <Route path="/auth/*" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            
            {/* Main Application Routes - With Layout */}
            <Route path="/*" element={
              <MainLayout>
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
                  <Route path="reports" element={
                    <ProtectedRoute>
                      <div className="h-full flex items-center justify-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Reports Page (Coming Soon)
                        </h1>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        Settings Page (Coming Soon)
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/projects/edit/:id" element={
                    <PMOrHigherRoute>
                      <ProjectEditPage />
                    </PMOrHigherRoute>
                  } />
                  <Route path="/pmo-review" element={
                    <PMOOrHigherRoute>
                      <PMOReviewPage />
                    </PMOOrHigherRoute>
                  } />
                </Routes>
              </MainLayout>
            } />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;