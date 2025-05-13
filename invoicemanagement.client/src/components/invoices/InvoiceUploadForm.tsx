import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  FileUp as DocumentArrowUpIcon, 
  X as XMarkIcon, 
  CheckCircle as CheckCircleIcon 
} from 'lucide-react';

// Import our type-safe hooks
import { useArrayState } from '../../utils/hooks';

const InvoiceUploadForm = () => {
  const [files, setFiles] = useArrayState<File>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prev: File[]) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 5
  });

  const removeFile = (index: number) => {
    setFiles((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, you would upload the files to the server here
    
    setUploading(false);
    setUploadComplete(true);
    
    // Reset form after showing success message
    setTimeout(() => {
      setFiles([]);
      setUploadComplete(false);
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <DocumentArrowUpIcon className="h-6 w-6 text-primary-500 mr-2" />
            Upload Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {uploadComplete ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 dark:bg-green-900">
                  <CheckCircleIcon className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your files have been successfully uploaded and are being processed.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-gray-300 hover:border-primary-400 dark:border-gray-700'
                  }`}
                >
                  <input {...getInputProps()} />
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive 
                      ? 'Drop the files here ...' 
                      : 'Drag & drop invoice files here, or click to select files'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Supports PDF, JPG, PNG (Max 5 files)
                  </p>
                </div>

                {files.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <h3 className="text-sm font-medium bg-gray-50 p-3 border-b dark:bg-gray-800 dark:border-gray-700">
                      Selected Files ({files.length})
                    </h3>
                    <ul className="divide-y dark:divide-gray-700">
                      {files.map((file: File, index: number) => (
                        <motion.li 
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center">
                            <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t p-4 dark:border-gray-700">
          <Button variant="outline" disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={files.length === 0 || uploading || uploadComplete}
            className="relative"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload Files'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InvoiceUploadForm; 