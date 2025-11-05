// =============================================
// Constants for the Application
// Centralized constants for consistency
// =============================================

// Report Status Options
export const REPORT_STATUS_OPTIONS = [
    { value: 'All', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
];

// Report Status Options for Responder (no 'All' option)
export const RESPONDER_STATUS_OPTIONS = [
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
];

// Priority Options
export const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
];

// Default Priority
export const DEFAULT_PRIORITY = 'Medium';

// Priority to Color Mapping (Bootstrap variant colors)
export const PRIORITY_COLOR_MAP = {
    'Critical': 'danger',
    'High': 'warning',
    'Medium': 'info',
    'Low': 'secondary',
    'default': 'secondary'
};

// Helper function to get priority color
export const getPriorityColor = (priority) => {
    return PRIORITY_COLOR_MAP[priority] || PRIORITY_COLOR_MAP.default;
};

// Status Color Mapping is already in helpers.js (getStatusColor)
