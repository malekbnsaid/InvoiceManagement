import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthContainerProps {
  onAuthSuccess: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleSwitchToSignup = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleAuthSuccess = async (username: string, password: string) => {
    try {
      await login(username, password);
      onAuthSuccess();
    } catch (error) {
      console.error('Auth success handler failed:', error);
    }
  };

  if (isLogin) {
    return (
      <LoginForm
        onLoginSuccess={handleAuthSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    );
  }

  return (
    <SignupForm
      onSignupSuccess={handleAuthSuccess}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
};
