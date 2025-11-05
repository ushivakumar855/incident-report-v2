// =============================================
// Database Configuration for MySQL
// Adapted for existing 'myapp' database
// =============================================

const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'myapp',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+00:00'
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ MySQL connection error:', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
        return;
    }
    
    if (connection) {
        console.log('✅ MySQL connected to database:', process.env.DB_NAME || 'incident_db1');
        connection.release();
    }
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle MySQL client', err);
    process.exit(-1);
});

// Export promisified pool
module.exports = pool.promise();