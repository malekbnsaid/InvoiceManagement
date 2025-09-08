import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { LoadingPage } from '../ui/LoadingPage';

type AuthView = 'login' | 'signup' | 'forgot-password';

export const AuthContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSwitchToSignup = () => {
    setCurrentView('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleSwitchToForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const handleAuthSuccess = async (username: string, password: string) => {
    try {
      setIsTransitioning(true);
      await login(username, password);
      
      // Show loading for a moment before redirecting
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Auth success handler failed:', error);
      setIsTransitioning(false);
    }
  };

  // Show loading page during transition
  if (isTransitioning) {
    return (
      <LoadingPage 
        message="Authentication successful!" 
        showSpinner={true}
      />
    );
  }

  switch (currentView) {
    case 'login':
      return (
        <LoginForm
          onLoginSuccess={handleAuthSuccess}
          onSwitchToSignup={handleSwitchToSignup}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      );
    case 'signup':
      return (
        <SignupForm
          onSignupSuccess={handleAuthSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      );
    case 'forgot-password':
      return (
        <ForgotPasswordForm
          onBackToLogin={handleSwitchToLogin}
        />
      );
    default:
      return (
        <LoginForm
          onLoginSuccess={handleAuthSuccess}
          onSwitchToSignup={handleSwitchToSignup}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      );
  }
};
