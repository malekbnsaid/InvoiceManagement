import axios from 'axios';
import { sessionAuthService } from '../sessionAuthService';

// Create axios instance with default config
const apiBaseURL = 'http://localhost:5274/api';
console.log('🔐 SessionAPI: Creating axios instance with baseURL:', apiBaseURL);

export const sessionApi = axios.create({
  baseURL: apiBaseURL, // Temporary direct URL for testing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
sessionApi.interceptors.request.use(
  (config) => {
    console.log('🔐 SessionAPI: Making request to:', config.method?.toUpperCase(), config.url);
    console.log('🔐 SessionAPI: Full URL:', (config.baseURL || '') + (config.url || ''));
    console.log('🔐 SessionAPI: Session ID:', sessionAuthService.getSessionInfo().sessionId);
    
    // Add auth token to requests (from sessionStorage)
    const token = sessionAuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 SessionAPI: Added Bearer token to request');
    }
    
    // Enable credentials for cookie-based authentication
    config.withCredentials = true;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
sessionApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Only attempt token refresh if we have a current token
      const currentToken = sessionAuthService.getToken();
      if (currentToken && currentToken !== 'cookie-stored') {
        try {
          console.log('🔐 SessionAPI: Attempting token refresh for 401 error');
          // Try to refresh the token
          await sessionAuthService.refreshToken();
          const newToken = sessionAuthService.getToken();
          
          if (newToken && newToken !== 'cookie-stored') {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return sessionApi(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and let the app handle authentication
          console.log('🔐 SessionAPI: Token refresh failed, clearing authentication');
          sessionAuthService.logout();
          // Don't redirect - let the app's routing handle this
          return Promise.reject(refreshError);
        }
      } else {
        console.log('🔐 SessionAPI: No valid token to refresh, clearing authentication');
        sessionAuthService.logout();
      }
    }

    // Handle other errors globally
    if (error.response) {
      // Server responded with error status
      console.error('SessionAPI Error:', error.response.data);
      console.error('SessionAPI Error Status:', error.response.status);
      console.error('SessionAPI Error Headers:', error.response.headers);
      console.error('Full Error Response:', JSON.stringify(error.response.data, null, 2));
      
      // Check for validation errors (multiple possible formats)
      if (error.response.data.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        return Promise.reject(new Error(`Validation failed:\n${validationErrors}`));
      }
      
      // Check for ValidationProblemDetails format
      if (error.response.data.title && error.response.data.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        return Promise.reject(new Error(`${error.response.data.title}\n${validationErrors}`));
      }
      
      // Check for other error types
      return Promise.reject(new Error(error.response.data.error || error.response.data.message || 'An error occurred'));
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.request);
      return Promise.reject(new Error('Network error - please check if the server is running'));
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject(error);
    }
  }
);
