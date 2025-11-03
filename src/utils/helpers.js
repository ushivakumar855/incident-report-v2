

// Format date to readable format
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    
    return date.toLocaleDateString('en-US', options);
};

// Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateString);
};

// Get status badge color
export const getStatusColor = (status) => {
    const colors = {
        'Pending': 'warning',
        'In Progress': 'info',
        'Resolved': 'success',
        'Closed': 'secondary',
        'Rejected': 'danger',
    };
    return colors[status] || 'primary';
};

// Get priority badge color
export const getPriorityColor = (priority) => {
    const colors = {
        'Low': 'success',
        'Medium': 'warning',
        'High': 'danger',
        'Critical': 'dark',
    };
    return colors[priority] || 'secondary';
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Validate email
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Generate anonymous user ID
export const generateAnonymousId = () => {
    return `Anonymous_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// Handle API errors
export const handleAPIError = (error) => {
    if (error.response) {
        // Server responded with error
        return error.response.data.message || 'An error occurred';
    } else if (error.request) {
        // Request made but no response
        return 'Network error. Please check your connection.';
    } else {
        // Something else happened
        return error.message || 'An unexpected error occurred';
    }
};

// Success toast notification
export const showSuccessToast = (message) => {
    alert(`✅ ${message}`);
};

// Error toast notification
export const showErrorToast = (message) => {
    alert(`❌ ${message}`);
};

// Export all statuses
export const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected'];

// Export all priorities
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];