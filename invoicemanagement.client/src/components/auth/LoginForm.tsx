import React, { useState } from 'react';
import { authService, LoginRequest } from '../../services/authService';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SuccessDisplay } from '../ui/SuccessDisplay';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      {/* Blurred Office Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-lg opacity-20 blur-sm transform rotate-12"></div>
          <div className="absolute bottom-20 right-10 w-40 h-24 bg-gradient-to-br from-purple-200 to-pink-300 rounded-lg opacity-20 blur-sm transform -rotate-6"></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-br from-green-200 to-blue-300 rounded-full opacity-20 blur-sm"></div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-800">InvoiceFlow</span>
        </div>
      </div>

      {/* Sign-in Form Card */}
      <div className="relative z-20 w-full max-w-md px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-600">
              Access your invoice management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={credentials.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </Label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={onSwitchToForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in to your account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Sign up here
              </button>
            </p>
          </div>

          {import.meta.env.VITE_DEV_BYPASS === 'true' && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Dev bypass is enabled. You can use any credentials to login.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
