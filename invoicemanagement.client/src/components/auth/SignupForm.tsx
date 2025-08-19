import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useToast } from '../ui/use-toast';
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
  const { toast } = useToast();

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
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
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
        toast({
          title: "Signup successful",
          description: "Account created successfully! You can now login.",
        });
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
        
        toast({
          title: "Signup failed",
          description: userMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: "An error occurred while creating your account",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign up for your Invoice Management account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700">
                  Employee Number
                </Label>
                <Input
                  id="employeeNumber"
                  name="employeeNumber"
                  type="text"
                  required
                  value={formData.employeeNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your employee number"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use your company employee ID. If you already have an account, please login instead.
                </p>
              </div>

              <div>
                <Label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </Label>
                <Select onValueChange={handleRoleChange} value={formData.role}>
                  <SelectTrigger className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
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
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm your password"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>

                                    <div className="mt-6 text-center">
                          <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                              type="button"
                              onClick={onSwitchToLogin}
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Sign in here
                            </button>
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            If you're having trouble signing up, please contact your system administrator.
                          </p>
                        </div>

            {import.meta.env.VITE_DEV_BYPASS === 'true' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Development Mode:</strong> Dev bypass is enabled. You can also use any credentials to login without signing up.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
