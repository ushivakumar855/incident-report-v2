// =============================================
// Incident Reporting System - Backend Server
// Database: myapp (MySQL)
// User: ushivakumar855
// =============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const reportRoutes = require('./routes/reportRoutes');
const actionRoutes = require('./routes/actionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const responderRoutes = require('./routes/responderRoutes');
const userRoutes = require('./routes/userRoutes');

// Import database connection
const db = require('./config/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE CONFIGURATION
// =============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Request timestamp middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// =============================================
// API ROUTES
// =============================================

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Incident Reporting System API',
        version: '1.0.0',
        author: 'ushivakumar855',
        database: process.env.DB_NAME || 'incident_db1',
        timestamp: req.requestTime
    });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await db.query('SELECT 1');
        
        res.status(200).json({
            status: 'success',
            message: 'API and Database are running',
            timestamp: req.requestTime,
            environment: process.env.NODE_ENV || 'development',
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            timestamp: req.requestTime
        });
    }
});

// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Incident Reporting API v1.0',
        endpoints: {
            reports: {
                'GET /api/reports': 'Get all reports',
                'GET /api/reports/:id': 'Get report by ID',
                'POST /api/reports': 'Create new report',
                'PUT /api/reports/:id': 'Update report status',
                'DELETE /api/reports/:id': 'Delete report'
            },
            actions: {
                'GET /api/actions': 'Get all actions',
                'GET /api/actions/report/:reportId': 'Get actions for specific report',
                'POST /api/actions': 'Add new action'
            },
            categories: {
                'GET /api/categories': 'Get all categories',
                'GET /api/categories/:id': 'Get category by ID',
                'POST /api/categories': 'Create new category'
            },
            responders: {
                'GET /api/responders': 'Get all responders',
                'GET /api/responders/:id': 'Get responder by ID',
                'POST /api/responders': 'Create new responder'
            },
            users: {
                'GET /api/users': 'Get all users',
                'GET /api/users/:id': 'Get user by ID',
                'POST /api/users': 'Create new user'
            }
        }
    });
});

// Main API routes
app.use('/api/reports', reportRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/users', userRoutes);

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
        timestamp: req.requestTime
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(statusCode).json({
        status: 'error',
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    });
});

// =============================================
// DATABASE CONNECTION & SERVER START
// =============================================

// Start server
const server = app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 Incident Reporting System API');
    console.log('==========================================');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'incident_db1'}`);
    console.log(`👤 User: ${process.env.DB_USER || 'root'}`);
    console.log('==========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    console.error(err);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        db.end().then(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;