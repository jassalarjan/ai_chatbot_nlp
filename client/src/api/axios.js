import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    console.log('Debug - Request interceptor:', {
        url: config.url,
        method: config.method,
        hasToken: !!token
    });
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error('Debug - Request interceptor error:', error);
    return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        console.log('Debug - Response interceptor:', {
            url: response.config.url,
            status: response.status,
            hasData: !!response.data
        });
        return response;
    },
    async (error) => {
        console.error('Debug - Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.error || error.message
        });

        // Special handling for health check
        if (error.config?.url === '/health') {
            return Promise.reject(error);
        }

        // If any request fails with 401/403, clear token and redirect to login
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;