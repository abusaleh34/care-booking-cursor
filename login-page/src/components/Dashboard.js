import React from 'react';

/**
 * Dashboard Component
 * Displayed after successful authentication
 */
const Dashboard = ({ phoneNumber, userId, onLogout }) => {
  /**
   * Format phone number for display
   */
  const formatPhoneForDisplay = (phone) => {
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2-$3-$4');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo">
          CS
        </div>

        {/* Success Message */}
        <h1 className="login-title text-center">Welcome! 🎉</h1>
        <p className="login-subtitle text-center">
          You have successfully signed in to your Care Services account
        </p>

        {/* User Information */}
        <div className="form-group">
          <div className="success-message">
            <span className="success-icon">✅</span>
            Authentication successful
          </div>
          
          <div style={{ 
            background: 'var(--gray-50)', 
            padding: 'var(--spacing-4)', 
            borderRadius: 'var(--border-radius)', 
            marginTop: 'var(--spacing-4)' 
          }}>
            <p style={{ marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
              <strong>Phone Number:</strong> {formatPhoneForDisplay(phoneNumber)}
            </p>
            <p style={{ marginBottom: '0', fontSize: 'var(--font-size-sm)' }}>
              <strong>User ID:</strong> {userId}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-group">
          <button
            type="button"
            className="btn btn-primary btn-full mb-3"
            onClick={() => window.location.href = '/app'}
          >
            Go to Application
          </button>
          
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={onLogout}
          >
            Sign Out
          </button>
        </div>

        {/* Additional Information */}
        <div className="timer-text">
          <p>
            🔒 Your session is secured with end-to-end encryption
          </p>
          <p>
            📱 You can now access all Care Services features
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 