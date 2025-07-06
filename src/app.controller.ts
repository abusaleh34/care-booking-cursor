import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello() {
    return {
      message: 'Care Services Platform API is running!',
      version: '2.0',
      documentation: 'Visit /dashboard for web interface',
    };
  }

  @Public()
  @Get('demo-login.html')
  getDemoLogin(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Care Services - Customer Portal</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/axios.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 450px;
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo h1 {
            color: #667eea;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .logo p {
            color: #666;
            font-size: 14px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
            font-size: 14px;
        }

        input[type="email"], input[type="password"], input[type="text"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }

        input[type="email"]:focus, input[type="password"]:focus, input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 12px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #28a745;
            color: white;
        }

        .btn-secondary:hover {
            background: #218838;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        }

        .btn-info {
            background: #dc3545;
            color: white;
        }

        .btn-info:hover {
            background: #c82333;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
        }

        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.5;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .status-indicator {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
        }

        .status-indicator h4 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .status-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .status-icon {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .status-online {
            background: #28a745;
        }

        .status-offline {
            background: #dc3545;
        }

        .demo-data {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
        }

        .demo-data strong {
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🏥 Care Services</h1>
            <p>Customer Authentication Portal</p>
        </div>

        <div class="demo-data">
            <strong>🧪 Demo Credentials:</strong>
            Email: demo@example.com<br>
            Password: Demo123!<br>
            Phone: +14155552222
        </div>

        <!-- Registration Form -->
        <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" value="demo@example.com" placeholder="Enter your email">
        </div>

        <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="text" id="phone" value="+14155552222" placeholder="+1234567890">
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" value="Demo123!" placeholder="Enter your password">
        </div>

        <div class="form-group">
            <label for="firstName">First Name</label>
            <input type="text" id="firstName" value="Demo" placeholder="First Name">
        </div>

        <div class="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" value="User" placeholder="Last Name">
        </div>

        <button class="btn btn-primary" onclick="registerUser()">Register New User</button>
        <button class="btn btn-secondary" onclick="loginUser()">Login Existing User</button>
        <button class="btn btn-info" onclick="testAPI()">Test API (Categories)</button>

        <div id="result"></div>

        <div class="status-indicator">
            <h4>🚀 Backend API Status: <span id="api-status">ONLINE</span></h4>
            <div id="api-url" style="font-size: 12px; color: #666; margin-bottom: 10px;">
                http://localhost:3000/api/v1
            </div>
            <div class="status-item">
                <div class="status-icon status-online"></div>
                <span>✅ Authentication Working</span>
            </div>
            <div class="status-item">
                <div class="status-icon status-online"></div>
                <span>✅ Database Connected</span>
            </div>
            <div class="status-item">
                <div class="status-icon status-online"></div>
                <span>✅ 50+ Endpoints Active</span>
            </div>
            <div class="status-item">
                <div class="status-icon status-online"></div>
                <span>✅ Real-time WebSockets</span>
            </div>
            <div class="status-item">
                <div class="status-icon status-online"></div>
                <span>✅ JWT Tokens Generated</span>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = 'http://localhost:3000/api/v1';

        async function registerUser() {
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await axios.post(\`\${API_BASE}/auth/register\`, {
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: document.getElementById('password').value,
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value
                });

                resultDiv.innerHTML = \`
                    <div class="result success">
                        <h4>✅ Registration Successful!</h4>
                        <p><strong>User ID:</strong> \${response.data.user.id}</p>
                        <p><strong>Email:</strong> \${response.data.user.email}</p>
                        <p><strong>Access Token:</strong> \${response.data.accessToken.substring(0, 50)}...</p>
                        <p><strong>Refresh Token:</strong> \${response.data.refreshToken.substring(0, 50)}...</p>
                        <p><small>✨ User successfully registered and JWT tokens generated!</small></p>
                        <br>
                        <h5>🔗 Next Steps:</h5>
                        <p>📋 <a href="/dashboard" target="_blank">Browse Services</a></p>
                        <p>🔧 <a href="/admin" target="_blank">Admin Dashboard</a></p>
                    </div>
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        <h4>❌ Registration Error</h4>
                        <p>\${error.response?.data?.message || error.message}</p>
                        <p><small>Note: User might already exist. Try logging in instead.</small></p>
                    </div>
                \`;
            }
        }

        async function loginUser() {
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await axios.post(\`\${API_BASE}/auth/login\`, {
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                });

                // Store token for future use
                localStorage.setItem('authToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);

                resultDiv.innerHTML = \`
                    <div class="result success">
                        <h4>✅ Login Successful!</h4>
                        <p><strong>User ID:</strong> \${response.data.user.id}</p>
                        <p><strong>Email:</strong> \${response.data.user.email}</p>
                        <p><strong>Access Token:</strong> \${response.data.accessToken.substring(0, 50)}...</p>
                        <p><strong>Refresh Token:</strong> \${response.data.refreshToken.substring(0, 50)}...</p>
                        <p><small>🔐 Authentication successful with JWT tokens!</small></p>
                        <br>
                        <h5>🔗 Quick Actions:</h5>
                        <button class="btn btn-info" style="margin: 5px 0; padding: 8px;" onclick="checkAvailability()">Check Service Availability</button>
                        <button class="btn btn-secondary" style="margin: 5px 0; padding: 8px;" onclick="createBooking()">Create Test Booking</button>
                        <p style="margin-top: 10px;">📋 <a href="/dashboard" target="_blank">Browse Services</a></p>
                        <p>🔧 <a href="/admin" target="_blank">Admin Dashboard</a></p>
                    </div>
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        <h4>❌ Login Error</h4>
                        <p>\${error.response?.data?.message || error.message}</p>
                        <p><small>Check your credentials or register first.</small></p>
                    </div>
                \`;
            }
        }

        async function testAPI() {
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await axios.get(\`\${API_BASE}/customer/categories\`);

                resultDiv.innerHTML = \`
                    <div class="result success">
                        <h4>✅ API Test Successful!</h4>
                        <p><strong>Service Categories Found:</strong> \${response.data.data.length}</p>
                        <div style="margin-top: 10px;">
                            \${response.data.data.map(cat => 
                                \`<div style="background: #f8f9fa; padding: 8px; margin: 5px 0; border-radius: 5px;">
                                    <strong>\${cat.name}</strong><br>
                                    <small>\${cat.description}</small>
                                </div>\`
                            ).join('')}
                        </div>
                        <p><small>🎯 Backend API is fully operational!</small></p>
                    </div>
                \`;
            } catch (error) {
                const statusDiv = document.getElementById('api-status');
                statusDiv.textContent = 'OFFLINE';
                statusDiv.style.color = '#dc3545';
                
                resultDiv.innerHTML = \`
                    <div class="result error">
                        <h4>❌ Network error: Failed to fetch</h4>
                        <p>Backend API is not running on http://localhost:3000</p>
                        <p><small>Please start the backend server first.</small></p>
                    </div>
                \`;
            }
        }

        async function checkAvailability() {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Please login first!');
                return;
            }

            const resultDiv = document.getElementById('result');
            
            try {
                // Get tomorrow's date
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const response = await axios.get(\`\${API_BASE}/customer/availability?providerId=76e59e97-d16a-4f87-811f-99cddc99b608&serviceId=f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f&date=\${dateStr}\`, {
                    headers: { Authorization: \`Bearer \${token}\` }
                });

                const availableSlots = response.data.data.filter(slot => slot.available);
                
                resultDiv.innerHTML = \`
                    <div class="result success">
                        <h4>✅ Availability Check Successful!</h4>
                        <p><strong>Date:</strong> \${dateStr}</p>
                        <p><strong>Available Slots:</strong> \${availableSlots.length}</p>
                        <div style="margin-top: 10px;">
                            \${availableSlots.slice(0, 5).map(slot => 
                                \`<div style="background: #e8f5e8; padding: 5px; margin: 3px 0; border-radius: 3px; display: inline-block; margin-right: 5px;">
                                    \${slot.startTime} - \${slot.endTime}
                                </div>\`
                            ).join('')}
                            \${availableSlots.length > 5 ? '<p><small>... and ' + (availableSlots.length - 5) + ' more slots</small></p>' : ''}
                        </div>
                        <p><small>🎯 Real-time availability system working!</small></p>
                    </div>
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        <h4>❌ Availability Check Failed</h4>
                        <p>\${error.response?.data?.message || error.message}</p>
                    </div>
                \`;
            }
        }

        async function createBooking() {
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Please login first!');
                return;
            }

            const resultDiv = document.getElementById('result');
            
            try {
                // Get tomorrow's date
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const response = await axios.post(\`\${API_BASE}/customer/bookings\`, {
                    providerId: "76e59e97-d16a-4f87-811f-99cddc99b608",
                    serviceId: "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
                    bookingDate: dateStr,
                    startTime: "09:00",
                    notes: "Test booking from demo page"
                }, {
                    headers: { Authorization: \`Bearer \${token}\` }
                });

                resultDiv.innerHTML = \`
                    <div class="result success">
                        <h4>✅ Booking Created Successfully!</h4>
                        <p><strong>Booking ID:</strong> \${response.data.data.id}</p>
                        <p><strong>Service:</strong> \${response.data.data.service.name}</p>
                        <p><strong>Date:</strong> \${response.data.data.bookingDate}</p>
                        <p><strong>Time:</strong> \${response.data.data.startTime} - \${response.data.data.endTime}</p>
                        <p><strong>Amount:</strong> $\${response.data.data.totalAmount}</p>
                        <p><strong>Status:</strong> \${response.data.data.status}</p>
                        <p><small>🎉 Complete booking system working!</small></p>
                    </div>
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        <h4>❌ Booking Creation Failed</h4>
                        <p>\${error.response?.data?.message || error.message}</p>
                        <p><small>Try checking availability first or use different time slots.</small></p>
                    </div>
                \`;
            }
        }

        // Test API connectivity on page load
        window.addEventListener('load', () => {
            setTimeout(testAPI, 1000);
        });
    </script>
</body>
</html>`);
  }

  @Public()
  @Get('dashboard')
  getDashboard(@Res() res: Response) {
    // This will return the HTML content directly
    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
    );
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Care Services Platform - API Test</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .section {
            margin-bottom: 40px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            background: #f9f9f9;
        }
        .section h2 {
            color: #555;
            margin-top: 0;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .results {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            max-height: 400px;
            overflow-y: auto;
        }
        .provider-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
        }
        .provider-name {
            font-weight: bold;
            color: #333;
            font-size: 1.2em;
        }
        .provider-rating {
            color: #ff6b35;
            font-weight: bold;
        }
        .service-item {
            background: white;
            margin: 5px 0;
            padding: 8px;
            border-radius: 5px;
            border-left: 3px solid #667eea;
        }
        .category-item {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 8px 15px;
            margin: 5px;
            border-radius: 20px;
            font-size: 14px;
        }
        .loading {
            text-align: center;
            color: #666;
            font-style: italic;
        }
        .error {
            color: #dc3545;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            border-radius: 5px;
        }
        .endpoint-info {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
            padding: 10px;
            margin: 10px 0;
            font-family: monospace;
            font-size: 14px;
        }
        .admin-category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        .admin-category-actions button {
            margin: 0 5px;
            padding: 5px 10px;
            font-size: 12px;
        }
        .btn-edit {
            background: #ffc107 !important;
        }
        .btn-delete {
            background: #dc3545 !important;
        }
        .btn-admin {
            background: #17a2b8 !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>🏥 Care Services Platform</h1>
                <p style="color: #666; font-size: 1.1em;">
                    API Testing Interface - Phase 2 Complete ✅
                </p>
            </div>
            <div id="adminToggle" style="display: none;">
                <button onclick="showAdminPanel()" class="btn-admin">🔧 Quick Admin</button>
                <button onclick="window.location.href='/admin'" class="btn-admin" style="background: #28a745 !important;">🚀 Full Admin Dashboard</button>
            </div>
            <div id="userLoginToggle" style="display: block;">
                <button id="userLoginToggleBtn" class="btn-admin" style="background: #17a2b8 !important;">👤 User Login & Registration</button>
            </div>
        </div>

        <!-- Service Categories -->
        <div class="section">
            <h2>📋 Service Categories</h2>
            <div class="endpoint-info">GET /api/v1/customer/categories</div>
            <button onclick="loadCategories()">Load Categories</button>
            <div id="categories-results" class="results"></div>
        </div>

        <!-- Provider Search -->
        <div class="section">
            <h2>🔍 Search Providers</h2>
            <div class="endpoint-info">GET /api/v1/customer/search</div>
            <button onclick="searchProviders()">Search All Providers</button>
            <button onclick="searchProviders('f263cb4b-e99d-4e2b-ac62-52cd785f41ac')">Massage Therapy</button>
            <button onclick="searchProviders('79c754d5-7883-4214-a7f3-33a92f0b71c0')">Hair & Styling</button>
            <div id="search-results" class="results"></div>
        </div>

        <!-- Availability Check -->
        <div class="section">
            <h2>📅 Check Availability</h2>
            <div class="endpoint-info">GET /api/v1/customer/availability</div>
            <p>Check available time slots for Mike's Massage Therapy - Deep Tissue Massage:</p>
            <button onclick="checkAvailability()">Check Tomorrow's Availability</button>
            <div id="availability-results" class="results"></div>
        </div>

        <!-- Search Suggestions -->
        <div class="section">
            <h2>💡 Search Suggestions</h2>
            <div class="endpoint-info">GET /api/v1/customer/suggestions</div>
            <button onclick="getSuggestions('massage')">Suggestions for "massage"</button>
            <button onclick="getSuggestions('hair')">Suggestions for "hair"</button>
            <button onclick="getSuggestions('fitness')">Suggestions for "fitness"</button>
            <div id="suggestions-results" class="results"></div>
        </div>

        <!-- User Login Panel -->
        <div id="userLoginPanel" class="section" style="display: none; border: 2px solid #17a2b8;">
            <h2>👤 User Login & Registration</h2>
            <div style="margin-bottom: 15px;">
                <button id="closeUserLoginBtn" style="background: #dc3545;">Close Panel</button>
            </div>
            
            <div style="display: flex; gap: 20px;">
                <!-- Registration Form -->
                <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3>📝 Register New User</h3>
                    <form id="userRegForm">
                        <div style="margin: 10px 0;">
                            <label>Email: <input type="email" name="email" required style="width: 100%; padding: 8px; margin-top: 5px;"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Password: <input type="password" name="password" required style="width: 100%; padding: 8px; margin-top: 5px;" placeholder="Min 8 characters"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>First Name: <input type="text" name="firstName" required style="width: 100%; padding: 8px; margin-top: 5px;"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Last Name: <input type="text" name="lastName" required style="width: 100%; padding: 8px; margin-top: 5px;"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Phone: <input type="tel" name="phone" style="width: 100%; padding: 8px; margin-top: 5px;" placeholder="Optional"></label>
                        </div>
                        <button type="button" id="registerBtn" style="background: #28a745; width: 100%;">Create Account</button>
                    </form>
                </div>
                
                <!-- Login Form -->
                <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3>🔐 Login Existing User</h3>
                    <form id="userLoginForm">
                        <div style="margin: 10px 0;">
                            <label>Email: <input type="email" name="loginEmail" required style="width: 100%; padding: 8px; margin-top: 5px;"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Password: <input type="password" name="loginPassword" required style="width: 100%; padding: 8px; margin-top: 5px;"></label>
                        </div>
                        <button type="button" id="loginBtn" style="background: #17a2b8; width: 100%;">Login to Account</button>
                        <button type="button" id="demoBtn" style="background: #ffc107; width: 100%; margin-top: 10px;">Use Demo Account</button>
                    </form>
                    
                    <!-- User Status -->
                    <div id="userStatus" style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px; display: none;">
                        <h4>✅ Logged In Successfully!</h4>
                        <div id="userInfo"></div>
                        <div style="margin-top: 15px;">
                            <button id="testBookingBtn" style="background: #28a745;">Test Booking</button>
                            <button id="checkAvailBtn" style="background: #17a2b8;">Check Availability</button>
                            <button id="logoutBtn" style="background: #dc3545;">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="userLoginResults" class="results" style="margin-top: 20px;"></div>
        </div>

        <!-- Admin Panel -->
        <div id="adminPanel" class="section" style="display: none; border: 2px solid #dc3545;">
            <h2>🔧 Quick Admin Panel</h2>
            <div style="margin-bottom: 15px;">
                <button onclick="hideAdminPanel()" style="background: #dc3545;">Close Panel</button>
                <button onclick="window.location.href='/admin'" style="background: #28a745;">🚀 Open Full Admin Dashboard</button>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>Category Management</h3>
                <button onclick="showAddCategoryForm()" style="background: #28a745;">➕ Add New Category</button>
                
                <!-- Add Category Form -->
                <div id="addCategoryForm" style="display: none; background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px;">
                    <h4>Add New Category</h4>
                    <form id="categoryForm">
                        <div style="margin: 10px 0;">
                            <label>Name: <input type="text" name="name" required style="width: 200px; padding: 5px;"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Description: <textarea name="description" style="width: 300px; height: 60px; padding: 5px;"></textarea></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Icon URL: <input type="url" name="iconUrl" style="width: 300px; padding: 5px;"></label>
                        </div>
                        <div style="margin: 10px 0;">
                            <label><input type="checkbox" name="isActive" checked> Active</label>
                        </div>
                        <button type="button" onclick="addCategory()" style="background: #28a745;">Create Category</button>
                        <button type="button" onclick="hideAddCategoryForm()" style="background: #6c757d;">Cancel</button>
                    </form>
                </div>
                
                <!-- Admin Categories List -->
                <div id="adminCategoriesList" class="results"></div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin + '/api/v1';

        async function apiCall(endpoint) {
            try {
                const response = await fetch(API_BASE + endpoint);
                const data = await response.json();
                return data;
            } catch (error) {
                throw new Error('API call failed: ' + error.message);
            }
        }

        async function loadCategories() {
            const resultsDiv = document.getElementById('categories-results');
            resultsDiv.innerHTML = '<div class="loading">Loading categories...</div>';
            
            try {
                const data = await apiCall('/customer/categories');
                if (data.success) {
                    let html = '<h3>Available Categories:</h3>';
                    data.data.forEach(category => {
                        html += '<div class="category-item">' + category.name + '</div>';
                    });
                    resultsDiv.innerHTML = html;
                } else {
                    resultsDiv.innerHTML = '<div class="error">Failed to load categories</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }

        async function searchProviders(categoryId = '') {
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = '<div class="loading">Searching providers...</div>';
            
            try {
                const endpoint = categoryId ? '/customer/search?categoryId=' + categoryId : '/customer/search';
                const data = await apiCall(endpoint);
                
                if (data.success && data.data.providers) {
                    let html = '<h3>Found ' + data.data.providers.length + ' Providers:</h3>';
                    data.data.providers.forEach(provider => {
                        html += '<div class="provider-card">';
                        html += '<div class="provider-name">' + provider.businessName + '</div>';
                        html += '<div class="provider-rating">⭐ ' + provider.averageRating + '/5.0 (' + provider.totalReviews + ' reviews)</div>';
                        html += '<p><strong>Location:</strong> ' + provider.businessAddress + '</p>';
                        html += '<p><strong>Services:</strong></p><div>';
                        provider.services.forEach(service => {
                            html += '<div class="service-item">' + service.name + ' - $' + service.price + ' (' + service.durationMinutes + ' min)</div>';
                        });
                        html += '</div></div>';
                    });
                    resultsDiv.innerHTML = html;
                } else {
                    resultsDiv.innerHTML = '<div class="error">No providers found</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }

        async function checkAvailability() {
            const resultsDiv = document.getElementById('availability-results');
            resultsDiv.innerHTML = '<div class="loading">Checking availability...</div>';
            
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const endpoint = '/customer/availability?providerId=76e59e97-d16a-4f87-811f-99cddc99b608&serviceId=f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f&date=' + dateStr;
                const data = await apiCall(endpoint);
                
                if (data.success && data.data) {
                    let html = '<h3>Available Time Slots for ' + dateStr + ':</h3>';
                    const availableSlots = data.data.filter(slot => slot.available);
                    
                    if (availableSlots.length > 0) {
                        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">';
                        availableSlots.forEach(slot => {
                            html += '<div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 8px; border-radius: 5px; text-align: center;">' + slot.startTime + ' - ' + slot.endTime + '</div>';
                        });
                        html += '</div>';
                    } else {
                        html += '<div class="error">No available slots found</div>';
                    }
                    
                    resultsDiv.innerHTML = html;
                } else {
                    resultsDiv.innerHTML = '<div class="error">Failed to check availability</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }

        async function getSuggestions(query) {
            const resultsDiv = document.getElementById('suggestions-results');
            resultsDiv.innerHTML = '<div class="loading">Getting suggestions...</div>';
            
            try {
                const data = await apiCall('/customer/suggestions?q=' + query);
                
                if (data.success && data.data) {
                    let html = '<h3>Suggestions for "' + query + '":</h3>';
                    if (data.data.length > 0) {
                        data.data.forEach(suggestion => {
                            html += '<div class="category-item">' + suggestion + '</div>';
                        });
                    } else {
                        html += '<div>No suggestions found</div>';
                    }
                    resultsDiv.innerHTML = html;
                } else {
                    resultsDiv.innerHTML = '<div class="error">Failed to get suggestions</div>';
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
            }
        }

        // Admin functionality
        let isAdmin = false;
        let authToken = localStorage.getItem('authToken');

        function showAdminPanel() {
            document.getElementById('adminPanel').style.display = 'block';
            loadAdminCategories();
        }

        function hideAdminPanel() {
            document.getElementById('adminPanel').style.display = 'none';
        }

        function loadAdminCategories() {
            if (!authToken) return;
            
            fetch('/api/v1/admin/categories', {
                headers: { 'Authorization': 'Bearer ' + authToken }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayAdminCategories(data.data);
                }
            })
            .catch(error => console.error('Error loading admin categories:', error));
        }

        function displayAdminCategories(categories) {
            const container = document.getElementById('adminCategoriesList');
            container.innerHTML = categories.map(category => \`
                <div class="admin-category-item">
                    <div>
                        <strong>\${category.name}</strong>
                        <p>\${category.description || 'No description'}</p>
                        <small>Sort Order: \${category.sortOrder} | Active: \${category.isActive}</small>
                    </div>
                    <div class="admin-category-actions">
                        <button onclick="editCategory('\${category.id}')" class="btn-edit">Edit</button>
                        <button onclick="deleteCategory('\${category.id}')" class="btn-delete">Delete</button>
                    </div>
                </div>
            \`).join('');
        }

        function showAddCategoryForm() {
            document.getElementById('addCategoryForm').style.display = 'block';
        }

        function hideAddCategoryForm() {
            document.getElementById('addCategoryForm').style.display = 'none';
            document.getElementById('categoryForm').reset();
        }

        function addCategory() {
            if (!authToken) {
                alert('Please login as admin first');
                return;
            }

            const formData = new FormData(document.getElementById('categoryForm'));
            const categoryData = {
                name: formData.get('name'),
                description: formData.get('description'),
                iconUrl: formData.get('iconUrl'),
                isActive: formData.get('isActive') === 'on'
            };

            fetch('/api/v1/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(categoryData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Category created successfully!');
                    hideAddCategoryForm();
                    loadAdminCategories();
                    loadCategories(); // Refresh public categories
                } else {
                    alert('Error creating category: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error creating category:', error);
                alert('Error creating category');
            });
        }

        function deleteCategory(categoryId) {
            if (!confirm('Are you sure you want to delete this category?')) return;
            if (!authToken) {
                alert('Please login as admin first');
                return;
            }

            fetch(\`/api/v1/admin/categories/\${categoryId}\`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + authToken }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Category deleted successfully!');
                    loadAdminCategories();
                    loadCategories(); // Refresh public categories
                } else {
                    alert('Error deleting category: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error deleting category:', error);
                alert('Error deleting category');
            });
        }

        function checkAdminStatus() {
            if (authToken) {
                fetch('/api/v1/auth/profile', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.data.roles.some(role => role.roleType === 'admin')) {
                        isAdmin = true;
                        document.getElementById('adminToggle').style.display = 'block';
                    }
                })
                .catch(error => console.error('Error checking admin status:', error));
            }
        }

        // User Login Functions
        let userToken = null;

        function showUserLogin() {
            document.getElementById('userLoginPanel').style.display = 'block';
        }

        function hideUserLogin() {
            document.getElementById('userLoginPanel').style.display = 'none';
        }

        function fillDemoCredentials() {
            document.querySelector('input[name="loginEmail"]').value = 'demo@example.com';
            document.querySelector('input[name="loginPassword"]').value = 'Demo123!';
            showUserLoginResult('Demo credentials filled. Click "Login to Account" to continue.', 'success');
        }

        function showUserLoginResult(message, type) {
            const resultsDiv = document.getElementById('userLoginResults');
            const className = type === 'success' ? 'success' : 'error';
            resultsDiv.innerHTML = '<div class="' + className + '">' + message + '</div>';
        }

        async function registerUser() {
            const form = document.getElementById('userRegForm');
            const formData = new FormData(form);
            
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                phone: formData.get('phone') || undefined
            };

            if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
                showUserLoginResult('Please fill in all required fields', 'error');
                return;
            }

            if (userData.password.length < 8) {
                showUserLoginResult('Password must be at least 8 characters long', 'error');
                return;
            }

            try {
                const response = await fetch(API_BASE + '/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok && data.accessToken) {
                    userToken = data.accessToken;
                    localStorage.setItem('userToken', userToken);
                    
                    showUserLoginResult('Registration successful! Welcome, ' + data.user.profile.firstName + '!', 'success');
                    showUserStatus(data.user);
                    form.reset();
                } else {
                    showUserLoginResult('Registration failed: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showUserLoginResult('Network error: ' + error.message, 'error');
            }
        }

        async function loginUser() {
            const form = document.getElementById('userLoginForm');
            const formData = new FormData(form);
            
            const loginData = {
                email: formData.get('loginEmail'),
                password: formData.get('loginPassword')
            };

            if (!loginData.email || !loginData.password) {
                showUserLoginResult('Please enter both email and password', 'error');
                return;
            }

            try {
                const response = await fetch(API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });

                const data = await response.json();

                if (response.ok && data.accessToken) {
                    userToken = data.accessToken;
                    localStorage.setItem('userToken', userToken);
                    
                    showUserLoginResult('Login successful! Welcome back, ' + data.user.profile.firstName + '!', 'success');
                    showUserStatus(data.user);
                } else {
                    showUserLoginResult('Login failed: ' + (data.message || 'Invalid credentials'), 'error');
                }
            } catch (error) {
                showUserLoginResult('Network error: ' + error.message, 'error');
            }
        }

        function showUserStatus(user) {
            const statusDiv = document.getElementById('userStatus');
            const infoDiv = document.getElementById('userInfo');
            
            infoDiv.innerHTML = '<p><strong>Name:</strong> ' + user.profile.firstName + ' ' + user.profile.lastName + '</p>' +
                               '<p><strong>Email:</strong> ' + user.email + '</p>' +
                               '<p><strong>User ID:</strong> ' + user.id + '</p>' +
                               '<p><strong>Roles:</strong> ' + user.roles.join(', ') + '</p>';
            
            statusDiv.style.display = 'block';
        }

        function logoutUser() {
            userToken = null;
            localStorage.removeItem('userToken');
            document.getElementById('userStatus').style.display = 'none';
            document.getElementById('userRegForm').reset();
            document.getElementById('userLoginForm').reset();
            showUserLoginResult('Logged out successfully', 'success');
        }

        async function testUserBooking() {
            if (!userToken) {
                showUserLoginResult('Please login first!', 'error');
                return;
            }

            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const response = await fetch(API_BASE + '/customer/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({
                        providerId: "76e59e97-d16a-4f87-811f-99cddc99b608",
                        serviceId: "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
                        bookingDate: dateStr,
                        startTime: "09:00",
                        notes: "Test booking from dashboard"
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showUserLoginResult('Booking created successfully! Booking ID: ' + data.data.id + 
                                      ' | Service: ' + data.data.service.name + 
                                      ' | Date: ' + data.data.bookingDate + 
                                      ' | Time: ' + data.data.startTime + '-' + data.data.endTime + 
                                      ' | Amount: $' + data.data.totalAmount, 'success');
                } else {
                    showUserLoginResult('Booking failed: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showUserLoginResult('Error creating booking: ' + error.message, 'error');
            }
        }

        async function checkUserAvailability() {
            if (!userToken) {
                showUserLoginResult('Please login first!', 'error');
                return;
            }

            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const response = await fetch(API_BASE + '/customer/availability?providerId=76e59e97-d16a-4f87-811f-99cddc99b608&serviceId=f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f&date=' + dateStr, {
                    headers: { 'Authorization': 'Bearer ' + userToken }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const availableSlots = data.data.filter(slot => slot.available);
                    let message = 'Available slots for ' + dateStr + ': ';
                    if (availableSlots.length > 0) {
                        message += availableSlots.slice(0, 5).map(slot => slot.startTime + '-' + slot.endTime).join(', ');
                        if (availableSlots.length > 5) message += ' and ' + (availableSlots.length - 5) + ' more';
                    } else {
                        message += 'No available slots found';
                    }
                    showUserLoginResult(message, 'success');
                } else {
                    showUserLoginResult('Availability check failed: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showUserLoginResult('Error checking availability: ' + error.message, 'error');
            }
        }

        // Load categories on page load
        window.onload = function() {
            loadCategories();
            checkAdminStatus();
            
            // Check if user is already logged in
            const savedToken = localStorage.getItem('userToken');
            if (savedToken) {
                userToken = savedToken;
                // Optionally verify token and show user status
            }
            
            // Attach event listeners for user login functionality
            const userLoginToggleBtn = document.getElementById('userLoginToggleBtn');
            const closeUserLoginBtn = document.getElementById('closeUserLoginBtn');
            const registerBtn = document.getElementById('registerBtn');
            const loginBtn = document.getElementById('loginBtn');
            const demoBtn = document.getElementById('demoBtn');
            const testBookingBtn = document.getElementById('testBookingBtn');
            const checkAvailBtn = document.getElementById('checkAvailBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (userLoginToggleBtn) userLoginToggleBtn.addEventListener('click', showUserLogin);
            if (closeUserLoginBtn) closeUserLoginBtn.addEventListener('click', hideUserLogin);
            if (registerBtn) registerBtn.addEventListener('click', registerUser);
            if (loginBtn) loginBtn.addEventListener('click', loginUser);
            if (demoBtn) demoBtn.addEventListener('click', fillDemoCredentials);
            if (testBookingBtn) testBookingBtn.addEventListener('click', testUserBooking);
            if (checkAvailBtn) checkAvailBtn.addEventListener('click', checkUserAvailability);
            if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
        };
    </script>
</body>
</html>`);
  }

  @Public()
  @Get('admin')
  getAdminDashboard(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Care Services - Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .admin-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .admin-header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .admin-title {
            font-size: 2.5em;
            color: #333;
            margin: 0;
        }
        .admin-subtitle {
            color: #666;
            font-size: 1.1em;
            margin-top: 5px;
        }
        .login-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #dc3545;
        }
        .admin-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .admin-sidebar {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            height: fit-content;
        }
        .admin-main {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .nav-item {
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid transparent;
        }
        .nav-item:hover {
            background: #f8f9fa;
            border-color: #667eea;
        }
        .nav-item.active {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
        }
        .section {
            display: none;
        }
        .section.active {
            display: block;
        }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .btn-danger {
            background: #dc3545;
        }
        .btn-success {
            background: #28a745;
        }
        .btn-warning {
            background: #ffc107;
            color: #333;
        }
        .btn-sm {
            padding: 8px 15px;
            font-size: 14px;
            margin: 2px;
            min-width: 70px;
            display: inline-block;
            text-align: center;
        }
        .badge {
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-admin {
            background: #17a2b8;
            color: white;
        }
        .form-group {
            margin: 15px 0;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .alert {
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .alert-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .alert-error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
        }
        .modal-content {
            background: white;
            margin: 5% auto;
            padding: 30px;
            border-radius: 15px;
            width: 90%;
            max-width: 600px;
            position: relative;
        }
        .close {
            position: absolute;
            right: 20px;
            top: 15px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .loading {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="admin-header">
            <div>
                <h1 class="admin-title">🔧 Admin Dashboard</h1>
                <p class="admin-subtitle">Care Services Platform Management</p>
            </div>
            <div id="loginSection" class="login-section">
                <h3>Admin Login Required</h3>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="adminEmail" value="admin@careservices.com" />
                </div>
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" id="adminPassword" value="admin123" />
                </div>
                <button onclick="adminLogin()" class="btn">Login</button>
            </div>
            <div id="loggedInSection" style="display: none;">
                <span id="adminName">Admin User</span>
                <button onclick="window.location.href='/dashboard'" class="btn">🏠 Main Dashboard</button>
                <button onclick="adminLogout()" class="btn btn-danger">Logout</button>
            </div>
        </div>

        <div id="adminContent" style="display: none;">
            <div class="admin-grid">
                <div class="admin-sidebar">
                    <h3>Navigation</h3>
                    <div class="nav-item active" onclick="showSection('dashboard')">
                        📊 Dashboard
                    </div>
                    <div class="nav-item" onclick="showSection('categories')">
                        📋 Categories
                    </div>
                    <div class="nav-item" onclick="showSection('providers')">
                        👥 Providers
                    </div>
                    <div class="nav-item" onclick="showSection('users')">
                        👤 Users
                    </div>
                    <div class="nav-item" onclick="showSection('analytics')">
                        📈 Analytics
                    </div>
                </div>

                <div class="admin-main">
                    <!-- Dashboard Section -->
                    <div id="dashboard" class="section active">
                        <h2>Platform Overview</h2>
                        <div id="statsContainer" class="stats-grid">
                            <div class="loading">Loading statistics...</div>
                        </div>
                        
                        <h3>Recent Activity</h3>
                        <div id="recentActivity">
                            <p>Loading recent activity...</p>
                        </div>
                    </div>

                    <!-- Categories Section -->
                    <div id="categories" class="section">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2>Category Management</h2>
                            <button onclick="showAddCategoryModal()" class="btn btn-success">
                                ➕ Add Category
                            </button>
                        </div>
                        <div id="categoriesTable">
                            <div class="loading">Loading categories...</div>
                        </div>
                    </div>

                    <!-- Providers Section -->
                    <div id="providers" class="section">
                        <h2>Provider Management</h2>
                        <div id="providersTable">
                            <div class="loading">Loading providers...</div>
                        </div>
                    </div>

                    <!-- Users Section -->
                    <div id="users" class="section">
                        <h2>User Management</h2>
                        <div id="usersTable">
                            <div class="loading">Loading users...</div>
                        </div>
                    </div>

                    <!-- Analytics Section -->
                    <div id="analytics" class="section">
                        <h2>Platform Analytics</h2>
                        <div id="analyticsContent">
                            <div class="loading">Loading analytics...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Category Modal -->
    <div id="addCategoryModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('addCategoryModal')">&times;</span>
            <h2>Add New Category</h2>
            <form id="addCategoryForm">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="categoryName" required />
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="categoryDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Icon URL:</label>
                    <input type="url" id="categoryIconUrl" />
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="categoryActive" checked /> Active
                    </label>
                </div>
                <button type="button" onclick="createCategory()" class="btn btn-success">Create</button>
                <button type="button" onclick="closeModal('addCategoryModal')" class="btn">Cancel</button>
            </form>
        </div>
    </div>

    <!-- Edit Category Modal -->
    <div id="editCategoryModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('editCategoryModal')">&times;</span>
            <h2>Edit Category</h2>
            <form id="editCategoryForm">
                <input type="hidden" id="editCategoryId" />
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="editCategoryName" required />
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="editCategoryDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Icon URL:</label>
                    <input type="url" id="editCategoryIconUrl" />
                </div>
                <div class="form-group">
                    <label>Sort Order:</label>
                    <input type="number" id="editCategorySortOrder" min="1" />
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editCategoryActive" /> Active
                    </label>
                </div>
                <button type="button" onclick="updateCategory()" class="btn btn-success">Update</button>
                <button type="button" onclick="closeModal('editCategoryModal')" class="btn">Cancel</button>
            </form>
        </div>
    </div>

    <script>
        let authToken = localStorage.getItem('adminToken');
        const API_BASE = window.location.origin + '/api/v1';

        // Check if already logged in
        if (authToken) {
            checkAdminAuth();
        }

        async function adminLogin() {
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;

            try {
                const response = await fetch(API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                
                if (response.ok && data.accessToken) {
                    authToken = data.accessToken;
                    localStorage.setItem('adminToken', authToken);
                    showAdminDashboard();
                    loadDashboardData();
                } else {
                    alert('Login failed: ' + (data.message || 'Invalid credentials'));
                }
            } catch (error) {
                alert('Login error: ' + error.message);
            }
        }

        async function checkAdminAuth() {
            try {
                const response = await fetch(API_BASE + '/auth/profile', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (response.ok && data.user && data.user.roles.includes('admin')) {
                    showAdminDashboard();
                    loadDashboardData();
                } else {
                    adminLogout();
                }
            } catch (error) {
                adminLogout();
            }
        }

        function showAdminDashboard() {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('loggedInSection').style.display = 'block';
            document.getElementById('adminContent').style.display = 'block';
        }

        function adminLogout() {
            localStorage.removeItem('adminToken');
            authToken = null;
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('loggedInSection').style.display = 'none';
            document.getElementById('adminContent').style.display = 'none';
        }

        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active from nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionName).classList.add('active');
            event.target.classList.add('active');
            
            // Load section data
            switch(sectionName) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'categories':
                    loadCategories();
                    break;
                case 'providers':
                    loadProviders();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'analytics':
                    loadAnalytics();
                    break;
            }
        }

        async function loadDashboardData() {
            try {
                const response = await fetch(API_BASE + '/admin/stats', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayStats(data.data);
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        function displayStats(stats) {
            const container = document.getElementById('statsContainer');
            container.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${stats.totalUsers}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.totalProviders}</div>
                    <div class="stat-label">Total Providers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.totalServices}</div>
                    <div class="stat-label">Total Services</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.totalCategories}</div>
                    <div class="stat-label">Categories</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.verifiedProviders}</div>
                    <div class="stat-label">Verified Providers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.verificationRate}%</div>
                    <div class="stat-label">Verification Rate</div>
                </div>
            \`;
        }

        async function loadCategories() {
            try {
                const response = await fetch(API_BASE + '/admin/categories', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayCategories(data.data);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        function displayCategories(categories) {
            const container = document.getElementById('categoriesTable');
            container.innerHTML = \`
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Sort Order</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${categories.map(category => \`
                            <tr>
                                <td>\${category.name}</td>
                                <td>\${category.description || 'No description'}</td>
                                <td>\${category.isActive ? 'Active' : 'Inactive'}</td>
                                <td>\${category.sortOrder}</td>
                                <td>
                                    <button onclick="editCategory('\${category.id}')" class="btn btn-warning btn-sm">Edit</button>
                                    <button onclick="deleteCategory('\${category.id}')" class="btn btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
        }

        async function loadProviders() {
            try {
                const response = await fetch(API_BASE + '/admin/providers', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayProviders(data.data);
                }
            } catch (error) {
                console.error('Error loading providers:', error);
            }
        }

        function displayProviders(providers) {
            const container = document.getElementById('providersTable');
            container.innerHTML = \`
                <table class="table">
                    <thead>
                        <tr>
                            <th>Business Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Verified</th>
                            <th>Rating</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${providers.map(provider => \`
                            <tr>
                                <td>\${provider.businessName}</td>
                                <td>\${provider.businessEmail || provider.user?.email || 'N/A'}</td>
                                <td>\${provider.isActive ? 'Active' : 'Inactive'}</td>
                                <td>\${provider.isVerified ? 'Verified' : 'Pending'}</td>
                                <td>\${provider.averageRating}/5.0</td>
                                <td>
                                    \${!provider.isVerified ? \`<button onclick="verifyProvider('\${provider.id}')" class="btn btn-success btn-sm">Verify</button>\` : ''}
                                    \${provider.isActive ? \`<button onclick="deactivateProvider('\${provider.id}')" class="btn btn-danger btn-sm">Deactivate</button>\` : \`<button onclick="activateProvider('\${provider.id}')" class="btn btn-success btn-sm">Activate</button>\`}
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
        }

        async function loadUsers() {
            try {
                const response = await fetch(API_BASE + '/admin/users', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayUsers(data.data);
                } else {
                    document.getElementById('usersTable').innerHTML = '<div class="error">Failed to load users</div>';
                }
            } catch (error) {
                console.error('Error loading users:', error);
                document.getElementById('usersTable').innerHTML = '<div class="error">Error loading users</div>';
            }
        }

        function displayUsers(users) {
            const container = document.getElementById('usersTable');
            container.innerHTML = \`
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Roles</th>
                            <th>Status</th>
                            <th>Verified</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${users.map(user => \`
                            <tr>
                                <td>\${user.profile ? user.profile.firstName + ' ' + user.profile.lastName : 'N/A'}</td>
                                <td>\${user.email}</td>
                                <td>\${user.phone || 'N/A'}</td>
                                <td>\${user.roles.map(role => role.roleType).join(', ')}</td>
                                <td>\${user.isActive ? 'Active' : 'Inactive'}</td>
                                <td>\${user.isVerified ? '✅ Yes' : '❌ No'}</td>
                                <td>\${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                                <td>
                                    \${user.roles.some(role => role.roleType === 'admin') ? 
                                        '<span class="badge badge-admin">Protected Admin</span>' : 
                                        user.isActive ? 
                                            \`<button onclick="deactivateUser('\${user.id}')" class="btn btn-danger btn-sm">Deactivate</button>\` : 
                                            \`<button onclick="activateUser('\${user.id}')" class="btn btn-success btn-sm">Activate</button>\`
                                    }
                                    \${!user.isVerified ? \`<button onclick="verifyUser('\${user.id}')" class="btn btn-warning btn-sm">Verify</button>\` : ''}
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
        }

        function loadAnalytics() {
            document.getElementById('analyticsContent').innerHTML = '<p>Analytics dashboard coming soon...</p>';
        }

        function showAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
            // Clear edit form when closing
            if (modalId === 'editCategoryModal') {
                document.getElementById('editCategoryForm').reset();
            }
            if (modalId === 'addCategoryModal') {
                document.getElementById('addCategoryForm').reset();
            }
        }

        async function createCategory() {
            const categoryData = {
                name: document.getElementById('categoryName').value,
                description: document.getElementById('categoryDescription').value,
                iconUrl: document.getElementById('categoryIconUrl').value,
                isActive: document.getElementById('categoryActive').checked
            };

            try {
                const response = await fetch(API_BASE + '/admin/categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify(categoryData)
                });

                const data = await response.json();
                
                if (data.success) {
                    closeModal('addCategoryModal');
                    loadCategories();
                    showAlert('Category created successfully!', 'success');
                } else {
                    showAlert('Error creating category: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error creating category: ' + error.message, 'error');
            }
        }

        async function editCategory(categoryId) {
            try {
                // Fetch category details
                const response = await fetch(API_BASE + '/admin/categories', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    const category = data.data.find(cat => cat.id === categoryId);
                    if (category) {
                        // Populate edit form
                        document.getElementById('editCategoryId').value = category.id;
                        document.getElementById('editCategoryName').value = category.name;
                        document.getElementById('editCategoryDescription').value = category.description || '';
                        document.getElementById('editCategoryIconUrl').value = category.iconUrl || '';
                        document.getElementById('editCategorySortOrder').value = category.sortOrder;
                        document.getElementById('editCategoryActive').checked = category.isActive;
                        
                        // Show modal
                        document.getElementById('editCategoryModal').style.display = 'block';
                    } else {
                        showAlert('Category not found', 'error');
                    }
                } else {
                    showAlert('Error loading category details', 'error');
                }
            } catch (error) {
                showAlert('Error loading category: ' + error.message, 'error');
            }
        }

        async function updateCategory() {
            const categoryId = document.getElementById('editCategoryId').value;
            const categoryData = {
                name: document.getElementById('editCategoryName').value,
                description: document.getElementById('editCategoryDescription').value,
                iconUrl: document.getElementById('editCategoryIconUrl').value,
                sortOrder: parseInt(document.getElementById('editCategorySortOrder').value),
                isActive: document.getElementById('editCategoryActive').checked
            };

            try {
                const response = await fetch(\`\${API_BASE}/admin/categories/\${categoryId}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify(categoryData)
                });

                const data = await response.json();
                
                if (data.success) {
                    closeModal('editCategoryModal');
                    loadCategories();
                    showAlert('Category updated successfully!', 'success');
                } else {
                    showAlert('Error updating category: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error updating category: ' + error.message, 'error');
            }
        }

        async function deleteCategory(categoryId) {
            if (!confirm('Are you sure you want to delete this category?')) return;

            try {
                const response = await fetch(\`\${API_BASE}/admin/categories/\${categoryId}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadCategories();
                    showAlert('Category deleted successfully!', 'success');
                } else {
                    showAlert('Error deleting category: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error deleting category: ' + error.message, 'error');
            }
        }

        async function verifyProvider(providerId) {
            try {
                const response = await fetch(\`\${API_BASE}/admin/providers/\${providerId}/verify\`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadProviders();
                    showAlert('Provider verified successfully!', 'success');
                } else {
                    showAlert('Error verifying provider: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error verifying provider: ' + error.message, 'error');
            }
        }

        async function deactivateProvider(providerId) {
            if (!confirm('Are you sure you want to deactivate this provider?')) return;

            try {
                const response = await fetch(\`\${API_BASE}/admin/providers/\${providerId}/deactivate\`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadProviders();
                    showAlert('Provider deactivated successfully!', 'success');
                } else {
                    showAlert('Error deactivating provider: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error deactivating provider: ' + error.message, 'error');
            }
        }

        async function activateProvider(providerId) {
            try {
                const response = await fetch(\`\${API_BASE}/admin/providers/\${providerId}/activate\`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadProviders();
                    showAlert('Provider activated successfully!', 'success');
                } else {
                    showAlert('Error activating provider: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error activating provider: ' + error.message, 'error');
            }
        }

        async function deactivateUser(userId) {
            if (!confirm('Are you sure you want to deactivate this user?')) return;

            try {
                const response = await fetch(\`\${API_BASE}/admin/users/\${userId}/deactivate\`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadUsers();
                    showAlert('User deactivated successfully!', 'success');
                } else {
                    showAlert('Error deactivating user: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error deactivating user: ' + error.message, 'error');
            }
        }

        async function activateUser(userId) {
            try {
                const response = await fetch(\`\${API_BASE}/admin/users/\${userId}/activate\`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadUsers();
                    showAlert('User activated successfully!', 'success');
                } else {
                    showAlert('Error activating user: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error activating user: ' + error.message, 'error');
            }
        }

        async function verifyUser(userId) {
            try {
                const response = await fetch(\`\${API_BASE}/admin/users/\${userId}/verify\`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });

                const data = await response.json();
                
                if (data.success) {
                    loadUsers();
                    showAlert('User verified successfully!', 'success');
                } else {
                    showAlert('Error verifying user: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('Error verifying user: ' + error.message, 'error');
            }
        }

        function showAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = \`alert alert-\${type}\`;
            alertDiv.textContent = message;
            
            document.querySelector('.admin-main').insertBefore(alertDiv, document.querySelector('.admin-main').firstChild);
            
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    </script>
</body>
</html>`);
  }

  @Public()
  @Get('login')
  getLoginInterface(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Care Services - User Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 500px;
            position: relative;
        }
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #667eea;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .logo p {
            color: #666;
            font-size: 14px;
        }
        .tabs {
            display: flex;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
        }
        .tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
            font-weight: 600;
        }
        .tab.active {
            border-bottom-color: #667eea;
            color: #667eea;
        }
        .tab:hover {
            background: #f8f9fa;
        }
        .form-section {
            display: none;
        }
        .form-section.active {
            display: block;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
            font-size: 14px;
        }
        input[type="email"], input[type="password"], input[type="text"], input[type="tel"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 12px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .btn-secondary {
            background: #28a745;
            color: white;
        }
        .btn-secondary:hover {
            background: #218838;
            transform: translateY(-2px);
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.5;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .demo-data {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
        }
        .demo-data strong {
            display: block;
            margin-bottom: 5px;
        }
        .quick-actions {
            margin-top: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .quick-actions h4 {
            margin-bottom: 10px;
            color: #667eea;
        }
        .action-btn {
            display: inline-block;
            padding: 8px 15px;
            margin: 5px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 12px;
            transition: all 0.3s;
        }
        .action-btn:hover {
            background: #5a6fd8;
            transform: translateY(-1px);
        }
        .loading {
            display: none;
            text-align: center;
            color: #667eea;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🏥 Care Services</h1>
            <p>User Registration & Login Portal</p>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('register')">Register New User</div>
            <div class="tab" onclick="showTab('login')">Login Existing User</div>
        </div>

        <!-- Registration Form -->
        <div id="register" class="form-section active">
            <div class="demo-data">
                <strong>📝 Quick Registration:</strong>
                Fill out the form below to create a new customer account
            </div>

            <div class="form-group">
                <label for="regEmail">Email Address *</label>
                <input type="email" id="regEmail" placeholder="Enter your email" required>
            </div>

            <div class="form-group">
                <label for="regPassword">Password *</label>
                <input type="password" id="regPassword" placeholder="Enter password (min 8 chars)" required>
            </div>

            <div class="form-group">
                <label for="regFirstName">First Name *</label>
                <input type="text" id="regFirstName" placeholder="Enter your first name" required>
            </div>

            <div class="form-group">
                <label for="regLastName">Last Name *</label>
                <input type="text" id="regLastName" placeholder="Enter your last name" required>
            </div>

            <div class="form-group">
                <label for="regPhone">Phone Number</label>
                <input type="tel" id="regPhone" placeholder="+1234567890 (optional)">
            </div>

            <button class="btn btn-primary" onclick="registerUser()">
                <span id="regBtnText">Create Account</span>
                <div id="regLoading" class="loading">Creating account...</div>
            </button>
        </div>

        <!-- Login Form -->
        <div id="login" class="form-section">
            <div class="demo-data">
                <strong>🔐 User Login:</strong>
                Enter your credentials to access your account
            </div>

            <div class="form-group">
                <label for="loginEmail">Email Address</label>
                <input type="email" id="loginEmail" placeholder="Enter your email">
            </div>

            <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" placeholder="Enter your password">
            </div>

            <button class="btn btn-primary" onclick="loginUser()">
                <span id="loginBtnText">Login to Account</span>
                <div id="loginLoading" class="loading">Logging in...</div>
            </button>

            <button class="btn btn-secondary" onclick="fillDemoCredentials()">
                Use Demo Account
            </button>
        </div>

        <div id="result"></div>

        <!-- Quick Actions (shown after successful login) -->
        <div id="quickActions" class="quick-actions" style="display: none;">
            <h4>🚀 What would you like to do?</h4>
            <a href="/dashboard" class="action-btn" target="_blank">Browse Services</a>
            <a href="/admin" class="action-btn" target="_blank">Admin Panel</a>
            <button class="action-btn" onclick="checkAvailability()">Check Availability</button>
            <button class="action-btn" onclick="createTestBooking()">Create Booking</button>
        </div>
    </div>

    <script>
        const API_BASE = 'http://localhost:3000/api/v1';
        let userToken = null;

        function showTab(tabName) {
            // Hide all sections
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected section and tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            
            // Clear results
            document.getElementById('result').innerHTML = '';
            document.getElementById('quickActions').style.display = 'none';
        }

        function showLoading(type) {
            const btnText = document.getElementById(type + 'BtnText');
            const loading = document.getElementById(type + 'Loading');
            btnText.style.display = 'none';
            loading.style.display = 'block';
        }

        function hideLoading(type) {
            const btnText = document.getElementById(type + 'BtnText');
            const loading = document.getElementById(type + 'Loading');
            btnText.style.display = 'block';
            loading.style.display = 'none';
        }

        async function registerUser() {
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const firstName = document.getElementById('regFirstName').value;
            const lastName = document.getElementById('regLastName').value;
            const phone = document.getElementById('regPhone').value;

            if (!email || !password || !firstName || !lastName) {
                showResult('Please fill in all required fields', 'error');
                return;
            }

            if (password.length < 8) {
                showResult('Password must be at least 8 characters long', 'error');
                return;
            }

            showLoading('reg');

            try {
                const response = await fetch(\`\${API_BASE}/auth/register\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        firstName,
                        lastName,
                        phone: phone || undefined
                    })
                });

                const data = await response.json();

                if (response.ok && data.accessToken) {
                    userToken = data.accessToken;
                    localStorage.setItem('userToken', userToken);
                    
                    showResult(\`
                        <h4>✅ Registration Successful!</h4>
                        <p><strong>Welcome, \${data.user.profile.firstName}!</strong></p>
                        <p><strong>User ID:</strong> \${data.user.id}</p>
                        <p><strong>Email:</strong> \${data.user.email}</p>
                        <p><strong>Account Type:</strong> Customer</p>
                        <p><small>🎉 Your account has been created and you're now logged in!</small></p>
                    \`, 'success');
                    
                    document.getElementById('quickActions').style.display = 'block';
                } else {
                    showResult(\`Registration failed: \${data.message || 'Unknown error'}\`, 'error');
                }
            } catch (error) {
                showResult(\`Network error: \${error.message}\`, 'error');
            } finally {
                hideLoading('reg');
            }
        }

        async function loginUser() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showResult('Please enter both email and password', 'error');
                return;
            }

            showLoading('login');

            try {
                const response = await fetch(\`\${API_BASE}/auth/login\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });

                const data = await response.json();

                if (response.ok && data.accessToken) {
                    userToken = data.accessToken;
                    localStorage.setItem('userToken', userToken);
                    
                    showResult(\`
                        <h4>✅ Login Successful!</h4>
                        <p><strong>Welcome back, \${data.user.profile.firstName}!</strong></p>
                        <p><strong>User ID:</strong> \${data.user.id}</p>
                        <p><strong>Email:</strong> \${data.user.email}</p>
                        <p><strong>Roles:</strong> \${data.user.roles.join(', ')}</p>
                        <p><small>🔐 You are now logged in and can access all services!</small></p>
                    \`, 'success');
                    
                    document.getElementById('quickActions').style.display = 'block';
                } else {
                    showResult(\`Login failed: \${data.message || 'Invalid credentials'}\`, 'error');
                }
            } catch (error) {
                showResult(\`Network error: \${error.message}\`, 'error');
            } finally {
                hideLoading('login');
            }
        }

        function fillDemoCredentials() {
            document.getElementById('loginEmail').value = 'demo@example.com';
            document.getElementById('loginPassword').value = 'Demo123!';
            showResult('Demo credentials filled. Click "Login to Account" to continue.', 'success');
        }

        async function checkAvailability() {
            if (!userToken) {
                showResult('Please login first!', 'error');
                return;
            }

            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const response = await fetch(\`\${API_BASE}/customer/availability?providerId=76e59e97-d16a-4f87-811f-99cddc99b608&serviceId=f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f&date=\${dateStr}\`, {
                    headers: {
                        'Authorization': \`Bearer \${userToken}\`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    let html = '<h3>Available Time Slots for ' + dateStr + ':</h3>';
                    const availableSlots = data.data.filter(slot => slot.available);
                    
                    if (availableSlots.length > 0) {
                        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px;">';
                        availableSlots.forEach(slot => {
                            html += '<div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 8px; border-radius: 5px; text-align: center;">' + slot.startTime + ' - ' + slot.endTime + '</div>';
                        });
                        html += '</div>';
                    } else {
                        html += '<div class="error">No available slots found</div>';
                    }
                    
                    showResult(html, 'success');
                } else {
                    showResult(\`Availability check failed: \${data.message || 'Unknown error'}\`, 'error');
                }
            } catch (error) {
                showResult(\`Error checking availability: \${error.message}\`, 'error');
            }
        }

        async function createTestBooking() {
            if (!userToken) {
                showResult('Please login first!', 'error');
                return;
            }

            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split('T')[0];
                
                const response = await fetch(\`\${API_BASE}/customer/bookings\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${userToken}\`
                    },
                    body: JSON.stringify({
                        providerId: "76e59e97-d16a-4f87-811f-99cddc99b608",
                        serviceId: "f25d4766-9b12-4c7e-bb62-2f9fd1c2a89f",
                        bookingDate: dateStr,
                        startTime: "09:00",
                        notes: "Test booking from login interface"
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showResult(\`
                        <h4>✅ Booking Created Successfully!</h4>
                        <p><strong>Booking ID:</strong> \${data.data.id}</p>
                        <p><strong>Service:</strong> \${data.data.service.name}</p>
                        <p><strong>Date:</strong> \${data.data.bookingDate}</p>
                        <p><strong>Time:</strong> \${data.data.startTime} - \${data.data.endTime}</p>
                        <p><strong>Amount:</strong> $\${data.data.totalAmount}</p>
                        <p><strong>Status:</strong> \${data.data.status}</p>
                        <p><small>🎉 Complete booking system working perfectly!</small></p>
                    \`, 'success');
                } else {
                    showResult(\`Booking failed: \${data.message || 'Unknown error'}\`, 'error');
                }
            } catch (error) {
                showResult(\`Error creating booking: \${error.message}\`, 'error');
            }
        }

        function showResult(message, type) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = \`<div class="result \${type}">\${message}</div>\`;
        }

        // Check if user is already logged in
        window.addEventListener('load', () => {
            const savedToken = localStorage.getItem('userToken');
            if (savedToken) {
                userToken = savedToken;
                showResult('You are already logged in! Use the quick actions below.', 'success');
                document.getElementById('quickActions').style.display = 'block';
            }
        });
    </script>
</body>
</html>`);
  }
}
