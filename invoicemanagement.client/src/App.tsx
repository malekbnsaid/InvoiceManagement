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
import React from 'react';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/new" element={<ProjectFormPage />} />
            <Route path="/projects/:id" element={<ProjectDetailsPage />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/upload" element={<InvoiceUploadForm />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="lpos" element={<LPOsList />} />
            <Route path="departments" element={<SectionsAndUnits />} />
            <Route path="reports" element={
              <div className="h-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reports Page (Coming Soon)
                </h1>
              </div>
            } />
            <Route path="settings" element={
              <div className="h-full flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Settings Page (Coming Soon)
                </h1>
              </div>
            } />
          </Routes>
        </MainLayout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;