import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import InvoiceDetails from './components/invoices/InvoiceDetails';
import InvoiceUploadForm from './components/invoices/InvoiceUploadForm';
import InvoiceList from './components/invoices/InvoiceList';
import SectionsAndUnits from './components/departments/SectionsAndUnits';
import ProjectsList from './components/projects/ProjectsList';
import ProjectFormPage from './pages/ProjectFormPage';
import LPOsList from './components/lpos/LPOsList';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={<MainLayout children={<Dashboard />} />} 
          />
          <Route 
            path="/invoices" 
            element={<MainLayout children={<InvoiceList />} />} 
          />
          <Route 
            path="/invoices/upload" 
            element={<MainLayout children={<InvoiceUploadForm />} />} 
          />
          <Route 
            path="/invoices/:id" 
            element={<MainLayout children={<InvoiceDetails />} />} 
          />
          <Route 
            path="/projects" 
            element={<MainLayout children={<ProjectsList />} />} 
          />
          <Route 
            path="/projects/new" 
            element={<ProjectFormPage />} 
          />
          <Route
            path="/lpos"
            element={<MainLayout children={<LPOsList />} />}
          />
          <Route
            path="/departments"
            element={<MainLayout children={<SectionsAndUnits />} />}
          />
          <Route 
            path="/reports" 
            element={
              <MainLayout children={
                <div className="h-full flex items-center justify-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Reports Page (Coming Soon)
                  </h1>
                </div>
              } />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <MainLayout children={
                <div className="h-full flex items-center justify-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Settings Page (Coming Soon)
                  </h1>
                </div>
              } />
            } 
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;