import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProjectForm from '../components/projects/ProjectForm';
import MainLayout from '../components/layout/MainLayout';
import { AlertCircle, CheckCircle2, HelpCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/Button';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real application, this would be an API call
      console.log('Submitting project data:', data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful response
      setSuccess('Project request submitted successfully. You will be redirected to the projects list.');
      
      // Redirect after success message is shown
      setTimeout(() => {
        navigate('/projects');
      }, 2000);
    } catch (err) {
      console.error('Error submitting project:', err);
      setError('An error occurred while submitting the project request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl w-full mx-auto">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Project Request</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Complete the form below to submit a new IT project request
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </motion.div>
          
          <motion.div
            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="h-6 w-6 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-300">Project Request Instructions</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Fill out all required fields across the three steps. You'll need to provide project information, timeline details, and upload any relevant documentation. Your project number will be automatically generated based on your selected department section.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Alert variant="success" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </MainLayout>
  );
} 