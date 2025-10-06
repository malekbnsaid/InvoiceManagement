import React, { useState } from 'react';
import { authService, LoginRequest } from '../../services/authService';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SuccessDisplay } from '../ui/SuccessDisplay';
import { useFormValidation } from '../../hooks/useFormValidation';

interface LoginFormProps {
  onLoginSuccess: (username: string, password: string) => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToSignup, onSwitchToForgotPassword }) => {
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);

  // Form validation
  const validationRules = {
    username: {
      required: true,
      minLength: 3,
      message: 'Username must be at least 3 characters'
    },
    password: {
      required: true,
      minLength: 6,
      message: 'Password must be at least 6 characters'
    }
  };

  const {
    validateForm,
    handleBlur,
    handleChange,
    getFieldError,
    hasErrors
  } = useFormValidation(validationRules);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm(credentials as unknown as { [key: string]: string })) {
      return;
    }
    
    setIsLoading(true);

    try {
      await authService.login(credentials);
      setSuccess({
        title: "Login successful",
        message: `Welcome back, ${authService.getDisplayName()}!`
      });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      onLoginSuccess(credentials.username, credentials.password);
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more user-friendly error messages
      let userMessage = "Invalid username or password. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Invalid username or password")) {
          userMessage = "Invalid username or password. Please check your credentials and try again.";
        } else if (error.message.includes("User not found")) {
          userMessage = "User not found. Please check your username or sign up for a new account.";
        } else if (error.message.includes("Account inactive")) {
          userMessage = "Your account is inactive. Please contact your administrator.";
        } else if (error.message.includes("Network error")) {
          userMessage = "Connection error. Please check your internet connection and try again.";
        }
      }
      
      setError({
        title: "Login failed",
        message: userMessage
      });
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    handleChange(name, value);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleBlur(name, value);
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Error Display */}
      {error && (
        <ErrorDisplay
          title={error.title}
          message={error.message}
          onClose={clearError}
          variant="error"
        />
      )}

      {/* Success Display */}
      {success && (
        <SuccessDisplay
          title={success.title}
          message={success.message}
          onClose={clearSuccess}
        />
      )}
      
      {/* QOC-Inspired Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-qatar/5 via-gold/5 to-silver/10">
        {/* Animated geometric shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-qatar/30 to-gold/20 rounded-lg opacity-40 blur-sm transform rotate-12 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-24 bg-gradient-to-br from-gold/30 to-silver/20 rounded-lg opacity-40 blur-sm transform -rotate-6 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-br from-success/30 to-info/20 rounded-full opacity-40 blur-sm animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-warning/30 to-qatar/20 rounded-lg opacity-40 blur-sm transform rotate-45 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #8A153E 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #AE8F44 2px, transparent 2px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}></div>
        </div>
      </div>

      {/* QOC Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-qatar/20 transition-transform duration-200 hover:scale-105">
            <img 
              src="/src/assets/QOC-LOGO.png" 
              alt="QOC Logo" 
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold text-qatar">InvoiceFlow</span>
            <p className="text-xs text-qatar/70 font-medium">QOC Internal Management System</p>
          </div>
        </div>
      </div>

      {/* QOC Sign-in Form Card */}
      <div className="relative z-20 w-full max-w-md px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-qatar/10 p-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-qatar/5 to-gold/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gold/5 to-silver/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-qatar to-qatar/80 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-qatar mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your QOC invoice management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <FormField
              label="Username"
              name="username"
              type="text"
              value={credentials.username}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="Enter your username"
              error={getFieldError('username')}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              helperText="Enter your username or email address"
            />

            <FormField
              label="Password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="Enter your password"
              error={getFieldError('password')}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              helperText="Enter your secure password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-qatar focus:ring-qatar border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={onSwitchToForgotPassword}
                  className="font-medium text-qatar hover:text-qatar/80 transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || hasErrors}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-qatar to-qatar/90 hover:from-qatar/90 hover:to-qatar/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Sign in to your account</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="text-xs text-gray-500 font-medium px-3">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="font-semibold text-qatar hover:text-qatar/80 transition-colors duration-200 hover:underline"
              >
                Create one here
              </button>
            </p>
          </div>

          {authService.isDevBypassEnabled() && (
            <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-xl relative z-10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.725-1.36 3.49 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning">
                    Development Mode
                  </p>
                  <p className="text-xs text-warning/80 mt-1">
                    Dev bypass is enabled. You can use any credentials to login.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
