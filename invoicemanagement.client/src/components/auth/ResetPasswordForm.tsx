import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SuccessDisplay } from '../ui/SuccessDisplay';
import { api } from '../../services/api';

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError({
          title: "Invalid reset link",
          message: "The password reset link is invalid or missing."
        });
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await api.get(`/auth/validate-reset-token/${token}`);
        if (response.data.isValid) {
          setTokenValid(true);
        } else {
          setError({
            title: "Invalid or expired link",
            message: "This password reset link is invalid or has expired. Please request a new one."
          });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setError({
          title: "Invalid or expired link",
          message: "This password reset link is invalid or has expired. Please request a new one."
        });
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError({
        title: "Passwords don't match",
        message: "Please make sure both password fields match."
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setError({
        title: "Password too short",
        message: "Password must be at least 6 characters long."
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const resetData: ResetPasswordRequest = {
        token: token!,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      };

      const response = await api.post<ResetPasswordResponse>('/auth/reset-password-with-token', resetData);
      
      setSuccess({
        title: "Password reset successful",
        message: "Your password has been reset successfully. You can now log in with your new password."
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      let userMessage = "An error occurred while resetting your password. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Passwords do not match")) {
          userMessage = "The passwords you entered don't match. Please try again.";
        } else if (error.message.includes("Token and new password are required")) {
          userMessage = "Please fill in all required fields.";
        } else if (error.message.includes("expired") || error.message.includes("invalid")) {
          userMessage = "This reset link has expired or is invalid. Please request a new one.";
        }
      }
      
      setError({
        title: "Reset failed",
        message: userMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForgot = () => {
    navigate('/auth/forgot-password');
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8 space-y-6 border border-gray-100">
            {error && (
              <ErrorDisplay
                title={error.title}
                message={error.message}
                onClose={() => setError(null)}
              />
            )}

            <div className="text-center space-y-4">
              <Button
                onClick={handleBackToForgot}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Request New Reset Link
              </Button>
              
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0V9a2 2 0 00-2-2M9 7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">Enter your new password below.</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 space-y-6 border border-gray-100">
          {error && (
            <ErrorDisplay
              title={error.title}
              message={error.message}
              onClose={() => setError(null)}
            />
          )}

          {success && (
            <SuccessDisplay
              title={success.title}
              message={success.message}
              onClose={() => setSuccess(null)}
            />
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Enter new password"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>© 2024 Olympic Invoice Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};










