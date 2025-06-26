import axios from 'axios';

// Determine the correct API base URL
const getApiBaseUrl = () => {
    let apiBaseUrl = import.meta.env.VITE_API_URL;

    // If no environment variable is set, determine the correct URL based on the current domain
    if (!apiBaseUrl) {
        if (typeof window !== 'undefined') {
            if (window.location.hostname === 'localhost') {
                apiBaseUrl = 'http://localhost:5000/api';
            } else {
                // Production - use the Railway backend
                apiBaseUrl = 'https://arcis-production.up.railway.app/api';
            }
        } else {
            // Fallback for SSR or other contexts
            apiBaseUrl = 'https://arcis-production.up.railway.app/api';
        }
    }

    return apiBaseUrl;
};

// Create axios instance with base configuration
const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth tokens if needed
api.interceptors.request.use(
    (config) => {
        // You can add auth tokens here later
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle common responses
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.log('Unauthorized access - redirect to login');
        }
        return Promise.reject(error);
    }
);

export default api; 