import React, { useState, useEffect, useRef } from 'react';
import { verifyOtp, resendOtp } from '../services/authService';

/**
 * OtpVerification Component
 * Handles OTP input, verification, and resend functionality
 */
const OtpVerification = ({ 
  phoneNumber, 
  onOtpVerification, 
  onBackToPhone, 
  isLoading, 
  setIsLoading, 
  error, 
  onError 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  /**
   * Handle OTP digit input
   * @param {number} index - Index of the input field
   * @param {string} value - Input value
   */
  const handleOtpChange = (index, value) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits are entered
      if (index === 5 && numericValue && newOtp.every(digit => digit !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };

  /**
   * Handle backspace navigation
   * @param {number} index - Index of the input field
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle paste event
   * @param {ClipboardEvent} e - Paste event
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split('');
      setOtp(newOtp);
      
      // Focus last input or submit if complete
      if (newOtp.length === 6) {
        inputRefs.current[5]?.focus();
        handleVerifyOtp(newOtp.join(''));
      }
    }
  };

  /**
   * Verify OTP with backend
   * @param {string} otpCode - The OTP code to verify
   */
  const handleVerifyOtp = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      onError('Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);
    onError(''); // Clear any previous errors

    try {
      const response = await verifyOtp(phoneNumber, otpCode);
      
      if (response.success) {
        // Success: user is authenticated
        onOtpVerification({
          userId: response.userId,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        });
      } else {
        // Handle verification error
        onError(response.message || 'Invalid verification code. Please try again.');
        
        // Clear OTP inputs and focus first input
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      onError('Verification failed. Please check your connection and try again.');
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle resend OTP
   */
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    onError(''); // Clear any previous errors

    try {
      const response = await resendOtp(phoneNumber);
      
      if (response.success) {
        // Reset timer and states
        setResendTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Show success message briefly
        onError('');
      } else {
        onError(response.message || 'Failed to resend verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      onError('Failed to resend verification code. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format phone number for display
   */
  const formatPhoneForDisplay = (phone) => {
    // Simple formatting for display
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2-$3-$4');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Back Button */}
        <button
          type="button"
          className="back-button"
          onClick={onBackToPhone}
          aria-label="Go back to phone number input"
        >
          <span className="back-icon">←</span>
          Back
        </button>

        {/* Logo */}
        <div className="logo">
          CS
        </div>

        {/* Title and subtitle */}
        <h1 className="login-title text-center">Verify Your Phone</h1>
        <p className="login-subtitle text-center">
          We've sent a 6-digit verification code to<br />
          <strong>{formatPhoneForDisplay(phoneNumber)}</strong>
        </p>

        {/* OTP Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
          <div className="form-group">
            <label className="form-label text-center">
              Enter Verification Code
            </label>
            
            <div className="otp-input">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`otp-digit ${digit ? 'filled' : ''}`}
                  aria-label={`Digit ${index + 1} of verification code`}
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" role="alert">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            className={`btn btn-primary btn-full ${isLoading ? 'btn-loading' : ''}`}
            disabled={isLoading || otp.some(digit => digit === '')}
          >
            {isLoading ? '' : 'Verify Code'}
          </button>
        </form>

        {/* Resend Timer */}
        <div className="timer-text">
          {canResend ? (
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleResendOtp}
              disabled={isLoading}
            >
              Resend Verification Code
            </button>
          ) : (
            <span>
              Resend code in <span className="timer-countdown">{resendTimer}s</span>
            </span>
          )}
        </div>

        {/* Help Text */}
        <p className="timer-text">
          Didn't receive the code? Check your message inbox or try resending.
        </p>
      </div>
    </div>
  );
};

export default OtpVerification; 