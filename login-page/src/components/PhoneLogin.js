import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { sendOtp } from '../services/authService';
import 'react-phone-number-input/style.css';

/**
 * PhoneLogin Component
 * Handles phone number input, validation, and OTP request
 */
const PhoneLogin = ({ onPhoneSubmit, isLoading, setIsLoading, error, onError }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      setValidationError('Please enter your mobile phone number');
      return false;
    }

    if (!isValidPhoneNumber(phone)) {
      setValidationError('Please enter a valid mobile phone number');
      return false;
    }

    // Additional validation: ensure it's a mobile number
    try {
      const parsedNumber = parsePhoneNumber(phone);
      const numberType = parsedNumber.getType();
      
      // Check if it's a mobile number (mobile or mobile_or_fixed_line)
      if (!['MOBILE', 'FIXED_LINE_OR_MOBILE'].includes(numberType)) {
        setValidationError('Please enter a mobile phone number (not a landline)');
        return false;
      }
    } catch (error) {
      setValidationError('Please enter a valid mobile phone number');
      return false;
    }

    setValidationError('');
    return true;
  };

  /**
   * Handle form submission
   * Validate phone number and send OTP
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setIsLoading(true);
    onError(''); // Clear any previous errors

    try {
      // Send OTP to the phone number
      const response = await sendOtp(phoneNumber);
      
      if (response.success) {
        // Success: proceed to OTP verification
        onPhoneSubmit(phoneNumber);
      } else {
        // Handle API error
        onError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      onError('Failed to send OTP. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle phone number input change
   */
  const handlePhoneChange = (value) => {
    setPhoneNumber(value || '');
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      onError('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo">
          CS
        </div>

        {/* Title and subtitle */}
        <h1 className="login-title text-center">Welcome Back</h1>
        <p className="login-subtitle text-center">
          Enter your mobile phone number to sign in to your account
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Mobile Phone Number
            </label>
            
            <PhoneInput
              id="phone"
              international
              countryCallingCodeEditable={false}
              defaultCountry="US"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className={validationError ? 'error' : ''}
              placeholder="Enter your mobile phone number"
              maxLength={17}
              aria-describedby={validationError ? 'phone-error' : undefined}
              aria-invalid={validationError ? 'true' : 'false'}
            />

            {/* Validation Error */}
            {validationError && (
              <div id="phone-error" className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                {validationError}
              </div>
            )}

            {/* API Error */}
            {error && (
              <div className="error-message" role="alert">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn btn-primary btn-full ${isLoading ? 'btn-loading' : ''}`}
            disabled={isLoading || !phoneNumber}
            aria-describedby="send-otp-help"
          >
            {isLoading ? '' : 'Send Verification Code'}
          </button>

          <div id="send-otp-help" className="sr-only">
            We'll send you a 6-digit verification code via SMS
          </div>
        </form>

        {/* Help Text */}
        <p className="timer-text">
          We'll send you a 6-digit verification code via SMS to verify your identity
        </p>
      </div>
    </div>
  );
};

export default PhoneLogin; 