import { Controller, Get, Res } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller()
export class DashboardController {
  @Public()
  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard interface' })
  @ApiResponse({ status: 200, description: 'Dashboard HTML interface' })
  getDashboard(@Res() res: Response): void {
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
    <title>Care Services Platform - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .logo {
            font-size: 1.8rem;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nav-buttons {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .btn-admin {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            background: #6c757d;
            color: white;
            min-width: 70px;
        }

        .btn-admin:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }

        .welcome-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }

        .welcome-section h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .welcome-section p {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 2rem;
        }

        .section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }

        .section h2 {
            margin-bottom: 1.5rem;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 0.5rem;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .card h3 {
            color: #667eea;
            margin-bottom: 1rem;
        }

        .btn {
            padding: 0.7rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            margin: 0.25rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-success { background: #28a745; }
        .btn-warning { background: #ffc107; color: #333; }
        .btn-danger { background: #dc3545; }
        .btn-info { background: #17a2b8; }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }

        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 0.7rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 1rem;
            }

            .nav-buttons {
                flex-wrap: wrap;
                justify-content: center;
            }

            .container {
                padding: 0 0.5rem;
            }

            .welcome-section h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🏥 Care Services Platform</div>
        <div class="nav-buttons">
            <div id="adminToggle" style="display: none;">
                <button onclick="showAdminPanel()" class="btn-admin">🔧 Quick Admin</button>
                <button onclick="window.location.href='/admin'" class="btn-admin" style="background: #28a745 !important;">🚀 Full Admin Dashboard</button>
            </div>
            <div id="userLoginToggle" style="display: block;">
                <button id="userLoginToggleBtn" class="btn-admin" style="background: #17a2b8 !important;">👤 User Login & Registration</button>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="welcome-section">
            <h1>Welcome to Care Services Platform</h1>
            <p>Your comprehensive platform for booking and managing care services</p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button onclick="loadCategories()" class="btn btn-info">🔄 Refresh Services</button>
                <button onclick="showBookingForm()" class="btn btn-success">📅 Quick Book</button>
                <button onclick="showProviderSearch()" class="btn btn-warning">🔍 Find Providers</button>
            </div>
        </div>

        <!-- Service Categories Section -->
        <div class="section">
            <h2>📋 Available Service Categories</h2>
            <div id="categoriesGrid" class="grid">
                <div class="card">
                    <h3>Loading services...</h3>
                    <p>Please wait while we fetch the available service categories.</p>
                </div>
            </div>
        </div>

        <!-- Quick Booking Section -->
        <div id="quickBookingSection" class="section" style="display: none;">
            <h2>📅 Quick Booking</h2>
            <div class="grid">
                <div class="card">
                    <h3>Book a Service</h3>
                    <form id="quickBookingForm">
                        <div class="form-group">
                            <label for="serviceCategory">Service Category</label>
                            <select id="serviceCategory" required>
                                <option value="">Select a category...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="preferredDate">Preferred Date</label>
                            <input type="date" id="preferredDate" required>
                        </div>
                        <div class="form-group">
                            <label for="customerNotes">Special Requirements</label>
                            <textarea id="customerNotes" rows="3" placeholder="Any special requirements or notes..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-success">📅 Check Availability</button>
                        <button type="button" onclick="hideBookingForm()" class="btn btn-danger">❌ Cancel</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Provider Search Section -->
        <div id="providerSearchSection" class="section" style="display: none;">
            <h2>🔍 Find Service Providers</h2>
            <div class="grid">
                <div class="card">
                    <h3>Search Providers</h3>
                    <form id="providerSearchForm">
                        <div class="form-group">
                            <label for="searchLocation">Location</label>
                            <input type="text" id="searchLocation" placeholder="Enter city or area...">
                        </div>
                        <div class="form-group">
                            <label for="searchCategory">Service Type</label>
                            <select id="searchCategory">
                                <option value="">All categories...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="searchRadius">Search Radius</label>
                            <select id="searchRadius">
                                <option value="5">5 km</option>
                                <option value="10" selected>10 km</option>
                                <option value="25">25 km</option>
                                <option value="50">50 km</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-info">🔍 Search Providers</button>
                        <button type="button" onclick="hideProviderSearch()" class="btn btn-danger">❌ Cancel</button>
                    </form>
                </div>
            </div>
            <div id="searchResults" class="grid" style="margin-top: 2rem; display: none;">
                <!-- Search results will be populated here -->
            </div>
        </div>

        <!-- User Login Panel -->
        <div id="userLoginPanel" class="section" style="display: none; border: 2px solid #17a2b8;">
            <h2>👤 User Login & Registration</h2>
            <div style="margin-bottom: 15px;">
                <button id="closeUserLoginBtn" style="background: #dc3545;">Close Panel</button>
            </div>
            
            <div style="display: flex; gap: 20px;">
                <!-- Registration Form -->
                <div style="flex: 1; min-width: 300px;">
                    <h3>📝 Create New Account</h3>
                    <form id="registrationForm">
                        <div class="form-group">
                            <label for="regEmail">Email Address</label>
                            <input type="email" id="regEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="regPassword">Password</label>
                            <input type="password" id="regPassword" name="password" required 
                                   placeholder="Min 8 chars, 1 upper, 1 lower, 1 number, 1 special">
                        </div>
                        <div class="form-group">
                            <label for="regFirstName">First Name</label>
                            <input type="text" id="regFirstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label for="regLastName">Last Name</label>
                            <input type="text" id="regLastName" name="lastName" required>
                        </div>
                        <div class="form-group">
                            <label for="regPhone">Phone Number (Optional)</label>
                            <input type="tel" id="regPhone" name="phone">
                        </div>
                        <button type="button" id="registerBtn" style="background: #28a745; width: 100%;">Create Account</button>
                    </form>
                </div>

                <!-- Login Form -->
                <div style="flex: 1; min-width: 300px;">
                    <h3>🔐 Login to Account</h3>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="loginEmail">Email Address</label>
                            <input type="email" id="loginEmail" name="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" name="loginPassword" required>
                        </div>
                        <button type="button" id="loginBtn" style="background: #17a2b8; width: 100%;">Login to Account</button>
                        <button type="button" id="demoBtn" style="background: #ffc107; width: 100%; margin-top: 10px;">Use Demo Account</button>
                    </form>
                </div>
            </div>

            <!-- User Status Display -->
            <div id="userStatusDisplay" style="display: none; margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px;">
                <h3>✅ Logged In Successfully</h3>
                <div id="userInfo">
                    <p><strong>Welcome back!</strong></p>
                    <p id="userDetails"></p>
                </div>
                <div style="margin-top: 15px;">
                    <button id="testBookingBtn" style="background: #28a745;">Test Booking</button>
                    <button id="checkAvailBtn" style="background: #17a2b8;">Check Availability</button>
                    <button id="logoutBtn" style="background: #dc3545;">Logout</button>
                </div>
            </div>

            <!-- Results Display -->
            <div id="userLoginResults" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;">
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let categories = [];
        let userToken = null;

        // User Login Functions
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
            resultsDiv.style.display = 'block';
            resultsDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
            resultsDiv.style.color = type === 'success' ? '#155724' : '#721c24';
            resultsDiv.innerHTML = message;
        }

        async function registerUser() {
            const formData = new FormData(document.getElementById('registrationForm'));
            const userData = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/v1/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showUserLoginResult('✅ Account created successfully! Please check your email for verification.', 'success');
                    document.getElementById('registrationForm').reset();
                } else {
                    showUserLoginResult('❌ Registration failed: ' + (result.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                showUserLoginResult('❌ Network error. Please try again.', 'error');
            }
        }

        async function loginUser() {
            const email = document.querySelector('input[name="loginEmail"]').value;
            const password = document.querySelector('input[name="loginPassword"]').value;
            
            if (!email || !password) {
                showUserLoginResult('❌ Please enter both email and password.', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    userToken = result.accessToken;
                    localStorage.setItem('userToken', userToken);
                    
                    document.getElementById('userStatusDisplay').style.display = 'block';
                    document.getElementById('userDetails').innerHTML = 
                        \`Email: \${result.user.email}<br>Name: \${result.user.profile.firstName} \${result.user.profile.lastName}\`;
                    
                    showUserLoginResult('✅ Login successful!', 'success');
                } else {
                    showUserLoginResult('❌ Login failed: ' + (result.message || 'Invalid credentials'), 'error');
                }
            } catch (error) {
                showUserLoginResult('❌ Network error. Please try again.', 'error');
            }
        }

        function logoutUser() {
            userToken = null;
            localStorage.removeItem('userToken');
            document.getElementById('userStatusDisplay').style.display = 'none';
            document.getElementById('loginForm').reset();
            showUserLoginResult('👋 Logged out successfully.', 'success');
        }

        async function testUserBooking() {
            if (!userToken) {
                showUserLoginResult('❌ Please login first.', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/v1/customer/bookings', {
                    method: 'GET',
                    headers: { 
                        'Authorization': \`Bearer \${userToken}\`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const bookings = await response.json();
                    showUserLoginResult(\`✅ Found \${bookings.length} booking(s). API connection working!\`, 'success');
                } else {
                    showUserLoginResult('❌ API test failed. Please check your login.', 'error');
                }
            } catch (error) {
                showUserLoginResult('❌ Network error during API test.', 'error');
            }
        }

        async function checkUserAvailability() {
            if (!userToken) {
                showUserLoginResult('❌ Please login first.', 'error');
                return;
            }
            
            showUserLoginResult('🔍 Checking availability... Feature coming soon!', 'success');
        }

        // Dashboard Functions
        async function loadCategories() {
            try {
                const response = await fetch('/api/v1/customer/categories');
                if (response.ok) {
                    categories = await response.json();
                    displayCategories();
                    populateSearchSelects();
                } else {
                    console.error('Failed to load categories');
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        function displayCategories() {
            const grid = document.getElementById('categoriesGrid');
            if (categories.length === 0) {
                grid.innerHTML = '<div class="card"><h3>No categories available</h3><p>Please check back later.</p></div>';
                return;
            }

            grid.innerHTML = categories.map(category => \`
                <div class="card">
                    <h3>\${category.name}</h3>
                    <p>\${category.description || 'Professional care services'}</p>
                    <p><strong>Services available: \${category.serviceCount || 0}</strong></p>
                    <button onclick="viewCategoryServices('\${category.id}')" class="btn btn-info">View Services</button>
                </div>
            \`).join('');
        }

        function populateSearchSelects() {
            const categorySelects = [
                document.getElementById('serviceCategory'),
                document.getElementById('searchCategory')
            ];

            categorySelects.forEach(select => {
                if (select) {
                    const currentValue = select.value;
                    select.innerHTML = select.id === 'searchCategory' ? 
                        '<option value="">All categories...</option>' : 
                        '<option value="">Select a category...</option>';
                    
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                    
                    if (currentValue) select.value = currentValue;
                }
            });
        }

        function showBookingForm() {
            document.getElementById('quickBookingSection').style.display = 'block';
            document.getElementById('quickBookingSection').scrollIntoView({ behavior: 'smooth' });
        }

        function hideBookingForm() {
            document.getElementById('quickBookingSection').style.display = 'none';
        }

        function showProviderSearch() {
            document.getElementById('providerSearchSection').style.display = 'block';
            document.getElementById('providerSearchSection').scrollIntoView({ behavior: 'smooth' });
        }

        function hideProviderSearch() {
            document.getElementById('providerSearchSection').style.display = 'none';
            document.getElementById('searchResults').style.display = 'none';
        }

        async function viewCategoryServices(categoryId) {
            try {
                const response = await fetch(\`/api/v1/customer/categories/\${categoryId}/services\`);
                if (response.ok) {
                    const services = await response.json();
                    // For now, just show an alert with the number of services
                    alert(\`Found \${services.length} services in this category\`);
                } else {
                    alert('Failed to load services for this category');
                }
            } catch (error) {
                alert('Error loading services');
            }
        }

        // Admin Functions
        function checkAdminStatus() {
            // Check if user has admin role
            // For now, we'll hide admin controls by default
            const adminToggle = document.getElementById('adminToggle');
            // This would be replaced with actual role checking
            const isAdmin = false; // This should check actual user roles
            
            if (isAdmin) {
                adminToggle.style.display = 'block';
            }
        }

        function showAdminPanel() {
            // This would show the inline admin panel
            alert('Quick admin panel would open here. Use "Full Admin Dashboard" for complete interface.');
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
            const registerBtn = document.getElementById('registerBtn');
            const loginBtn = document.getElementById('loginBtn');
            const demoBtn = document.getElementById('demoBtn');
            const testBookingBtn = document.getElementById('testBookingBtn');
            const checkAvailBtn = document.getElementById('checkAvailBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const userLoginToggleBtn = document.getElementById('userLoginToggleBtn');
            const closeUserLoginBtn = document.getElementById('closeUserLoginBtn');
            
            if (registerBtn) registerBtn.addEventListener('click', registerUser);
            if (loginBtn) loginBtn.addEventListener('click', loginUser);
            if (demoBtn) demoBtn.addEventListener('click', fillDemoCredentials);
            if (testBookingBtn) testBookingBtn.addEventListener('click', testUserBooking);
            if (checkAvailBtn) checkAvailBtn.addEventListener('click', checkUserAvailability);
            if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
            if (userLoginToggleBtn) userLoginToggleBtn.addEventListener('click', showUserLogin);
            if (closeUserLoginBtn) closeUserLoginBtn.addEventListener('click', hideUserLogin);
        };
    </script>
</body>
</html>`);
  }
}
