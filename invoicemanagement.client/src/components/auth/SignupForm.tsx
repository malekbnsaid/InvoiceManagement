import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FormField } from '../ui/FormField';
import { FormSelect } from '../ui/FormSelect';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SuccessDisplay } from '../ui/SuccessDisplay';
import { useFormValidation } from '../../hooks/useFormValidation';

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

  // Form validation rules
  const validationRules = {
    username: {
      required: true,
      minLength: 3,
      message: 'Username must be at least 3 characters'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    password: {
      required: true,
      minLength: 8,
      message: 'Password must be at least 8 characters'
    },
    confirmPassword: {
      required: true,
      custom: (value: string) => {
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return null;
      }
    },
    employeeNumber: {
      required: true,
      minLength: 3,
      message: 'Employee number must be at least 3 characters'
    },
    role: {
      required: true,
      message: 'Please select a role'
    }
  };

  const {
    validateForm,
    handleBlur,
    handleChange,
    getFieldError,
    hasErrors
  } = useFormValidation(validationRules);

  const roles = [
    { value: 'PM', label: 'Project Manager' },
    { value: 'PMO', label: 'Project Management Office' },
    { value: 'Head', label: 'Department Head' },
    { value: 'Secretary', label: 'Secretary' },
    { value: 'ReadOnly', label: 'Read Only' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm(formData as unknown as { [key: string]: string })) {
      return;
    }
    
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
    handleChange(name, value);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleBlur(name, value);
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
    handleChange('role', value);
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-8 px-4">
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

      {/* QOC Logo - More visible and better positioned */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-qatar/20 transition-transform duration-200 hover:scale-105">
            <img 
              src="/src/assets/QOC-LOGO.png" 
              alt="QOC Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="text-left">
            <span className="text-xl font-bold text-qatar">InvoiceFlow</span>
            <p className="text-xs text-qatar/70 font-medium">QOC Internal Management System</p>
          </div>
        </div>
      </div>

      {/* QOC Sign-up Form Card - More compact */}
      <div className="relative z-20 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-qatar/10 p-6 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/5 to-qatar/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-qatar/5 to-silver/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gold to-gold/80 rounded-xl mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-qatar mb-1">
              Join QOC Team
            </h2>
            <p className="text-sm text-gray-600">
              Create your account for the QOC invoice management system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
            <div>
              <Label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                Username
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-qatar/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar focus:border-qatar transition-all duration-200 bg-white/80"
                placeholder="Enter your username"
              />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-qatar/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar focus:border-qatar transition-all duration-200 bg-white/80"
                placeholder="Enter your email"
              />
              </div>
            </div>

            <div>
              <Label htmlFor="employeeNumber" className="block text-sm font-semibold text-gray-700 mb-1">
                Employee Number
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-qatar/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 12a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2m0 0a3 3 0 11-5.656 0" />
                  </svg>
                </div>
              <Input
                id="employeeNumber"
                name="employeeNumber"
                type="text"
                required
                value={formData.employeeNumber}
                onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar focus:border-qatar transition-all duration-200 bg-white/80"
                placeholder="Enter your employee number"
              />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Use your company employee ID. If you already have an account, please login instead.
              </p>
            </div>

            <div>
              <Label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1">
                Role
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-4 w-4 text-qatar/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                  <SelectTrigger className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar focus:border-qatar transition-all duration-200 bg-white/80">
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
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-qatar/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar focus:border-qatar transition-all duration-200 bg-white/80"
                placeholder="Enter your password"
              />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-qatar/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-qatar focus:border-qatar transition-all duration-200 bg-white/80"
                placeholder="Confirm your password"
              />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-gold to-gold/90 hover:from-gold/90 hover:to-gold/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Account</span>
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
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-qatar hover:text-qatar/80 transition-colors duration-200 hover:underline"
              >
                Sign in here
              </button>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              If you're having trouble signing up, please contact your system administrator.
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
                    Dev bypass is enabled. You can also use any credentials to login without signing up.
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
