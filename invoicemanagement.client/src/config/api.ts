// API Configuration
// This file handles different API endpoints for different environments

const getApiBaseUrl = (): string => {
  // Check if we're running in Docker (development mode)
  if (import.meta.env.DEV && window.location.hostname === 'localhost' && window.location.port === '5173') {
    // Check if backend is running on Docker port (5000) or local port (5274)
    // Default to Docker port for consistency
    return 'http://localhost:5000/api';
  }
  
  // Check for environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Default to Docker port
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Config: Using base URL:', API_BASE_URL);


