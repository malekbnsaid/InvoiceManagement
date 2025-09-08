import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SuccessDisplay } from '../ui/SuccessDisplay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface SignupFormProps {
  onSignupSuccess: (username: string, password: string) => void;
  onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeNumber: '',
    role: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);

  const roles = [
    { value: 'PM', label: 'Project Manager' },
    { value: 'PMO', label: 'Project Management Office' },
    { value: 'Head', label: 'Department Head' },
    { value: 'Secretary', label: 'Secretary' },
    { value: 'ReadOnly', label: 'Read Only' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError({
        title: "Validation Error",
        message: "Passwords do not match"
      });
      return;
    }

    if (formData.password.length < 6) {
      setError({
        title: "Validation Error",
        message: "Password must be at least 6 characters long"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        employeeNumber: formData.employeeNumber,
        role: formData.role
      });

      if (response.success) {
        setSuccess({
          title: "Signup successful",
          message: "Account created successfully! You can now login."
        });
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        onSignupSuccess(formData.username, formData.password);
      } else {
        // Provide more user-friendly error messages
        let userMessage = response.message || "Failed to create account";
        
        if (response.message === "Employee number already has an account") {
          userMessage = "This employee number is already registered. Please use a different employee number or contact your administrator if you need access to an existing account.";
        } else if (response.message === "Username already exists") {
          userMessage = "This username is already taken. Please choose a different username.";
        } else if (response.message === "Email already exists") {
          userMessage = "This email is already registered. Please use a different email address or try logging in instead.";
        }
        
        setError({
          title: "Signup failed",
          message: userMessage
        });
        // Auto-dismiss error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError({
        title: "Signup failed",
        message: "An error occurred while creating your account"
      });
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
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

      {/* Sign-up Form Card */}
      <div className="relative z-20 w-full max-w-md px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">
              Sign up for your Invoice Management account
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
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Employee Number
              </Label>
              <Input
                id="employeeNumber"
                name="employeeNumber"
                type="text"
                required
                value={formData.employeeNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your employee number"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use your company employee ID. If you already have an account, please login instead.
              </p>
            </div>

            <div>
              <Label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Sign in here
              </button>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              If you're having trouble signing up, please contact your system administrator.
            </p>
          </div>

          {import.meta.env.VITE_DEV_BYPASS === 'true' && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Dev bypass is enabled. You can also use any credentials to login without signing up.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
