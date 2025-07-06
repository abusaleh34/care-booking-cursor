const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// In-memory user storage (in production, this would be a database)
const users = new Map();
const sessions = new Map();

// Middleware
app.use(cors({
    origin: ['http://localhost:3001', 'file://', 'null'],
    credentials: true
}));
app.use(express.json());

// Helper Functions
function generateId() {
    return crypto.randomUUID();
}

function generateJWT(userId) {
    // Simplified JWT (in production, use proper JWT library)
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    // E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Sample data
const categories = [
    {
        id: 1,
        name: "Beauty & Wellness",
        description: "Professional beauty treatments and wellness services",
        serviceCount: 12,
        icon: "💄"
    },
    {
        id: 2,
        name: "Fitness & Training",
        description: "Personal training and fitness coaching services", 
        serviceCount: 8,
        icon: "💪"
    },
    {
        id: 3,
        name: "Hair & Styling",
        description: "Professional hair cutting, styling, and treatments",
        serviceCount: 15,
        icon: "✂️"
    },
    {
        id: 4,
        name: "Massage Therapy",
        description: "Therapeutic and relaxation massage services",
        serviceCount: 6,
        icon: "💆"
    }
];

// API Routes
app.get('/api/v1', (req, res) => {
    res.json({
        success: true,
        message: 'Care Services API - Real Authentication Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            register: 'POST /api/v1/auth/register',
            login: 'POST /api/v1/auth/login', 
            categories: 'GET /api/v1/customer/categories',
            verify: 'POST /api/v1/auth/verify-phone'
        }
    });
});

// Registration endpoint
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { email, phone, password, firstName, lastName } = req.body;

        // Validation
        if (!email || !phone || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (!validatePhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone format. Use E.164 format (e.g., +14155552222)'
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
            });
        }

        // Check if user already exists
        const existingUser = Array.from(users.values()).find(
            user => user.email === email || user.phone === phone
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const userId = generateId();
        const user = {
            id: userId,
            email,
            phone,
            passwordHash: hashedPassword,
            firstName,
            lastName,
            isVerified: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: null
        };

        users.set(userId, user);

        // Generate tokens
        const accessToken = generateJWT(userId);
        const refreshToken = generateJWT(userId);

        // Store session
        sessions.set(accessToken, {
            userId,
            createdAt: new Date(),
            lastAccessed: new Date()
        });

        console.log(`✅ New user registered: ${email} (${firstName} ${lastName})`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: userId,
                    email,
                    phone,
                    firstName,
                    lastName,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: 86400 // 24 hours
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// Login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = Array.from(users.values()).find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been suspended'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLoginAt = new Date();
        user.updatedAt = new Date();

        // Generate tokens
        const accessToken = generateJWT(user.id);
        const refreshToken = generateJWT(user.id);

        // Store session
        sessions.set(accessToken, {
            userId: user.id,
            createdAt: new Date(),
            lastAccessed: new Date()
        });

        console.log(`✅ User logged in: ${email}`);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                    lastLoginAt: user.lastLoginAt
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: 86400 // 24 hours
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Get categories endpoint
app.get('/api/v1/customer/categories', (req, res) => {
    console.log('📋 Categories requested');
    
    res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
    });
});

// Phone verification endpoints (mock for demo)
app.post('/api/v1/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    
    if (!validatePhone(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid phone format'
        });
    }

    console.log(`📱 OTP requested for ${phone}`);
    
    res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
            phone,
            otpId: generateId(),
            expiresIn: 300 // 5 minutes
        }
    });
});

app.post('/api/v1/auth/verify-otp', (req, res) => {
    const { phone, otp, otpId } = req.body;
    
    // Mock verification - in production, verify against stored OTP
    if (otp === '123456') {
        console.log(`✅ OTP verified for ${phone}`);
        
        res.json({
            success: true,
            message: 'Phone number verified successfully',
            data: {
                phone,
                isVerified: true
            }
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid OTP code'
        });
    }
});

// Status endpoint
app.get('/api/v1/status', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        users: users.size,
        sessions: sessions.size,
        categories: categories.length,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Care Services REAL Authentication API running on http://localhost:3000');
    console.log('📱 Real authentication endpoints ready:');
    console.log('   POST /api/v1/auth/register - Create new user account');
    console.log('   POST /api/v1/auth/login - Login with email/password');
    console.log('   GET  /api/v1/customer/categories - Get service categories');
    console.log('   POST /api/v1/auth/send-otp - Send phone verification OTP');
    console.log('   POST /api/v1/auth/verify-otp - Verify phone OTP');
    console.log('   GET  /api/v1/status - Server status');
    console.log('✅ Real authentication server ready for testing!');
    console.log('');
    console.log('🎯 Open demo-login.html in your browser to test real registration and login');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Care Services Demo API...');
    process.exit(0);
});

module.exports = app; 