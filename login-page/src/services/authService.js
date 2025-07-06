import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number in E.164 format
   * @returns {Promise<Object>} Response object with success status
   */
  async sendOtp(phoneNumber) {
    try {
      const response = await apiClient.post('/auth/send-otp', {
        phoneNumber: phoneNumber
      });
      
      return {
        success: true,
        message: response.data.message || 'OTP sent successfully',
        data: response.data
      };
    } catch (error) {
      return this.handleApiError(error, 'Failed to send OTP');
    }
  }

  /**
   * Verify OTP code
   * @param {string} phoneNumber - Phone number in E.164 format
   * @param {string} otpCode - 6-digit OTP code
   * @returns {Promise<Object>} Response object with authentication tokens
   */
  async verifyOtp(phoneNumber, otpCode) {
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        phoneNumber: phoneNumber,
        otpCode: otpCode
      });
      
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens in localStorage (consider using secure storage in production)
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return {
        success: true,
        message: response.data.message || 'OTP verified successfully',
        userId: user?.id || response.data.userId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user
      };
    } catch (error) {
      return this.handleApiError(error, 'Failed to verify OTP');
    }
  }

  /**
   * Resend OTP code
   * @param {string} phoneNumber - Phone number in E.164 format
   * @returns {Promise<Object>} Response object with success status
   */
  async resendOtp(phoneNumber) {
    try {
      const response = await apiClient.post('/auth/resend-otp', {
        phoneNumber: phoneNumber
      });
      
      return {
        success: true,
        message: response.data.message || 'OTP resent successfully',
        data: response.data
      };
    } catch (error) {
      return this.handleApiError(error, 'Failed to resend OTP');
    }
  }

  /**
   * Logout user and clear tokens
   * @returns {Promise<Object>} Response object
   */
  async logout() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        // Call logout endpoint if token exists
        await apiClient.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
      
      // Clear stored tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Clear tokens even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }

  /**
   * Get stored authentication token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    return !!token;
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Axios error object
   * @param {string} defaultMessage - Default error message
   * @returns {Object} Standardized error response
   */
  handleApiError(error, defaultMessage) {
    console.error('API Error:', error);

    // Network error
    if (!error.response) {
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        error: 'NETWORK_ERROR'
      };
    }

    // HTTP error responses
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          success: false,
          message: data.message || 'Invalid request. Please check your input and try again.',
          error: 'BAD_REQUEST'
        };
      
      case 401:
        return {
          success: false,
          message: data.message || 'Authentication failed. Please try again.',
          error: 'UNAUTHORIZED'
        };
      
      case 404:
        return {
          success: false,
          message: data.message || 'Service not available. Please try again later.',
          error: 'NOT_FOUND'
        };
      
      case 429:
        return {
          success: false,
          message: data.message || 'Too many requests. Please wait a moment and try again.',
          error: 'RATE_LIMITED'
        };
      
      case 500:
        return {
          success: false,
          message: data.message || 'Server error. Please try again later.',
          error: 'SERVER_ERROR'
        };
      
      default:
        return {
          success: false,
          message: data.message || defaultMessage,
          error: 'UNKNOWN_ERROR'
        };
    }
  }
}

// Create and export service instance
const authService = new AuthService();

// Export individual methods for easier importing
export const sendOtp = authService.sendOtp.bind(authService);
export const verifyOtp = authService.verifyOtp.bind(authService);
export const resendOtp = authService.resendOtp.bind(authService);
export const logout = authService.logout.bind(authService);
export const getAccessToken = authService.getAccessToken.bind(authService);
export const isAuthenticated = authService.isAuthenticated.bind(authService);

export default authService; 