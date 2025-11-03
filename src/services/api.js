import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add timestamp to requests
        config.metadata = { startTime: new Date() };
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Calculate response time
        const endTime = new Date();
        const duration = endTime - response.config.metadata.startTime;
        console.log(`API Call: ${response.config.url} - ${duration}ms`);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// =============================================
// REPORT API CALLS
// =============================================

export const reportAPI = {
    // Get all reports
    getAll: (params = {}) => {
        return api.get('/reports', { params });
    },

    // Get report by ID
    getById: (id) => {
        return api.get(`/reports/${id}`);
    },

    // Get reports by status
    getByStatus: (status) => {
        return api.get(`/reports/status/${status}`);
    },

    // Get report statistics
    getStats: () => {
        return api.get('/reports/stats');
    },

    // Create new report
    create: (data) => {
        return api.post('/reports', data);
    },

    // Update report status
    updateStatus: (id, status) => {
        return api.put(`/reports/${id}`, { status });
    },

    // Delete report
    delete: (id) => {
        return api.delete(`/reports/${id}`);
    },
};

// =============================================
// ACTION API CALLS
// =============================================

export const actionAPI = {
    // Get all actions
    getAll: () => {
        return api.get('/actions');
    },

    // Get actions by report ID
    getByReportId: (reportId) => {
        return api.get(`/actions/report/${reportId}`);
    },

    // Create new action
    create: (data) => {
        return api.post('/actions', data);
    },
};

// =============================================
// CATEGORY API CALLS
// =============================================

export const categoryAPI = {
    // Get all categories
    getAll: () => {
        return api.get('/categories');
    },

    // Get category by ID
    getById: (id) => {
        return api.get(`/categories/${id}`);
    },

    // Create new category
    create: (data) => {
        return api.post('/categories', data);
    },
};

// =============================================
// RESPONDER API CALLS
// =============================================

export const responderAPI = {
    // Get all responders
    getAll: () => {
        return api.get('/responders');
    },

    // Get responder by ID
    getById: (id) => {
        return api.get(`/responders/${id}`);
    },

    // Create new responder
    create: (data) => {
        return api.post('/responders', data);
    },
};

// =============================================
// USER API CALLS
// =============================================

export const userAPI = {
    // Get all users
    getAll: () => {
        return api.get('/users');
    },

    // Get user by ID
    getById: (id) => {
        return api.get(`/users/${id}`);
    },

    // Create new user
    create: (data) => {
        return api.post('/users', data);
    },
};

// =============================================
// UTILITY API CALLS
// =============================================

export const utilityAPI = {
    // Health check
    healthCheck: () => {
        return api.get('/health');
    },
};

export default api;