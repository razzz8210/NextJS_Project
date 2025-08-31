'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { OtpVerification } from '../components/auth/OtpVerification';
import { Dashboard } from '../components/dashboard/Dashboard';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'otp' | 'dashboard'>('login');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const { isAuthenticated, user, setLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData && isAuthenticated) {
      setCurrentView('dashboard');
    }
    setLoading(false);
  }, [isAuthenticated, setLoading]);

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (email: string) => {
    setRegistrationEmail(email);
    setCurrentView('otp');
  };

  const handleOtpSuccess = () => {
    setCurrentView('dashboard');
  };

  if (currentView === 'dashboard' && isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Auth System
            </h1>
            <p className="text-gray-600">
              Secure authentication and user management
            </p>
          </motion.div>

          {/* Auth Forms */}
          {currentView === 'login' && (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setCurrentView('register')}
            />
          )}

          {currentView === 'register' && (
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setCurrentView('login')}
            />
          )}

          {currentView === 'otp' && (
            <OtpVerification
              email={registrationEmail}
              onSuccess={handleOtpSuccess}
              onBack={() => setCurrentView('register')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
