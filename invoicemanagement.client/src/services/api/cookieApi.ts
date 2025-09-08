import axios from 'axios';
import { cookieAuthService } from '../cookieAuthService';

// Create axios instance with default config for cookie authentication
const apiBaseURL = 'http://localhost:5274/api';
console.log('🔐 CookieAPI: Creating axios instance with baseURL:', apiBaseURL);

export const cookieApi = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies
});

// Add request interceptor
cookieApi.interceptors.request.use(
  (config) => {
    console.log('🔐 CookieAPI: Making request to:', config.method?.toUpperCase(), config.url);
    console.log('🔐 CookieAPI: Full URL:', (config.baseURL || '') + (config.url || ''));
    
    // Get session ID from cookie for logging
    const sessionId = cookieAuthService.getSessionIdFromCookie();
    if (sessionId) {
      console.log('🔐 CookieAPI: Session ID:', sessionId);
    }
    
    // Cookies are automatically sent due to withCredentials: true
    // No need to manually add Authorization header
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
cookieApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔐 CookieAPI: Attempting token refresh for 401 error');
        
        // Try to refresh the token using cookies
        await cookieAuthService.refreshToken();
        
        console.log('🔐 CookieAPI: Token refreshed, retrying original request');
        
        // Retry the original request (cookies will be sent automatically)
        return cookieApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        console.log('🔐 CookieAPI: Token refresh failed, user needs to login');
        
        // Clear any invalid session data
        try {
          await cookieAuthService.logout();
        } catch (logoutError) {
          console.log('🔐 CookieAPI: Logout error during refresh failure:', logoutError);
        }
        
        // Redirect to login or let the app handle authentication
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors globally
    if (error.response) {
      // Server responded with error status
      console.error('🔐 CookieAPI Error:', error.response.data);
      console.error('🔐 CookieAPI Error Status:', error.response.status);
      console.error('🔐 CookieAPI Error Headers:', error.response.headers);
      
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
      console.error('🔐 CookieAPI Network Error:', error.request);
      return Promise.reject(new Error('Network error - please check if the server is running'));
    } else {
      // Something else happened
      console.error('🔐 CookieAPI Error:', error.message);
      return Promise.reject(error);
    }
  }
);
