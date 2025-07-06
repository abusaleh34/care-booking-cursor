import React, { useState } from 'react';
import PhoneLogin from './components/PhoneLogin';
import OtpVerification from './components/OtpVerification';
import Dashboard from './components/Dashboard';
import './App.css';

// Authentication flow states
const AUTH_STATES = {
  PHONE_INPUT: 'phone_input',
  OTP_VERIFICATION: 'otp_verification',
  AUTHENTICATED: 'authenticated'
};

/**
 * Main App Component
 * Manages the authentication flow state and user data
 */
function App() {
  // Current authentication state
  const [authState, setAuthState] = useState(AUTH_STATES.PHONE_INPUT);
  
  // User data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userId, setUserId] = useState(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle successful phone number submission
   * Transition to OTP verification step
   */
  const handlePhoneSubmit = (phone) => {
    setPhoneNumber(phone);
    setAuthState(AUTH_STATES.OTP_VERIFICATION);
    setError('');
  };

  /**
   * Handle successful OTP verification
   * Transition to authenticated state
   */
  const handleOtpVerification = (userData) => {
    setUserId(userData.userId);
    setAuthState(AUTH_STATES.AUTHENTICATED);
    setError('');
  };

  /**
   * Handle going back to phone input
   * Reset the authentication flow
   */
  const handleBackToPhone = () => {
    setAuthState(AUTH_STATES.PHONE_INPUT);
    setPhoneNumber('');
    setError('');
  };

  /**
   * Handle logout
   * Reset all state and return to phone input
   */
  const handleLogout = () => {
    setAuthState(AUTH_STATES.PHONE_INPUT);
    setPhoneNumber('');
    setUserId(null);
    setError('');
    setIsLoading(false);
  };

  /**
   * Handle global errors
   */
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  return (
    <div className="app">
      {/* Phone Number Input Step */}
      {authState === AUTH_STATES.PHONE_INPUT && (
        <PhoneLogin
          onPhoneSubmit={handlePhoneSubmit}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          error={error}
          onError={handleError}
        />
      )}

      {/* OTP Verification Step */}
      {authState === AUTH_STATES.OTP_VERIFICATION && (
        <OtpVerification
          phoneNumber={phoneNumber}
          onOtpVerification={handleOtpVerification}
          onBackToPhone={handleBackToPhone}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          error={error}
          onError={handleError}
        />
      )}

      {/* Authenticated Dashboard */}
      {authState === AUTH_STATES.AUTHENTICATED && (
        <Dashboard
          phoneNumber={phoneNumber}
          userId={userId}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App; 