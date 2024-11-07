import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true // Important for cookies/session handling
});

// Request interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        // Get CSRF token from meta tag
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }

        // Add auth token if exists
        const authToken = localStorage.getItem('token');
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
            // Refresh the page to get a new CSRF token
            window.location.reload();
            return Promise.reject(error);
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            window.location.href = '/unauthorized';
            return Promise.reject(error);
        }

        // Handle 422 Validation errors
        if (error.response?.status === 422) {
            return Promise.reject(error.response.data);
        }

        // Handle 500 Server errors
        if (error.response?.status >= 500) {
            console.error('Server Error:', error.response.data);
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

// API service methods
const apiService = {
    // Auth endpoints
    auth: {
        login: (credentials) => axiosInstance.post('/login', credentials),
        logout: () => axiosInstance.post('/logout'),
        me: () => axiosInstance.get('/me'),
        forgotPassword: (data) => axiosInstance.post('/forgot-password', data),
        resetPassword: (data) => axiosInstance.post('/reset-password', data),
    },

    // User endpoints
    users: {
        list: (page = 1) => axiosInstance.get(`/users?page=${page}`),
        get: (id) => axiosInstance.get(`/users/${id}`),
        create: (data) => axiosInstance.post('/users', data),
        update: (id, data) => axiosInstance.put(`/users/${id}`, data),
        delete: (id) => axiosInstance.delete(`/users/${id}`),
        search: (query) => axiosInstance.get(`/users/search?query=${query}`),
        updateStatus: (id) => axiosInstance.patch(`/users/${id}/status`),
    },

    // kategoris endpoints
    kategoris: {
        list: (page = 1) => axiosInstance.get(`/kategoris?page=${page}`),
        get: (id) => axiosInstance.get(`/kategoris/${id}`),
        create: (data) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            return axiosInstance.post('/kategoris', data, config);
        },
        update: (id, data) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            return axiosInstance.post(`/kategoris/${id}`, data, config);
        },
        delete: (id) => axiosInstance.delete(`/kategoris/${id}`),
        search: (query) => axiosInstance.get(`/kategoris/search?keyword=${query}`),
        updateStatus: (id) => axiosInstance.patch(`/kategoris/${id}/status`),
    },

    //product endpoints
    products: {
        list: (params = {}) => axiosInstance.get('/products', {
            params,
            paramsSerializer: params => {
                return Object.entries(params)
                    .filter(([_, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
            }
        }),
        search: (keyword) => axiosInstance.get('/products/search', {
            params: { search: keyword }
        }),
        get: (id) => axiosInstance.get(`/products/${id}`),
        create: (data) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            return axiosInstance.post('/products', data, config);
        },
        update: (id, data) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            return axiosInstance.post(`/products/${id}`, data, config);
        },
        delete: (id) => axiosInstance.delete(`/products/${id}`),
        updateStatus: (id, newStatus) => 
            axiosInstance.patch(`/products/${id}/status`, { status: newStatus }),
    },

    //slider endpoints
    sliders: {
        list: (page = 1) => axiosInstance.get(`/sliders?page=${page}`),
        getActive: () => axiosInstance.get('/sliders/active'),
        get: (id) => axiosInstance.get(`/sliders/${id}`),
        create: (data) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            return axiosInstance.post('/sliders', data, config);
        },
        update: (id, data) => {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            return axiosInstance.post(`/sliders/${id}`, data, config);
        },
        delete: (id) => axiosInstance.delete(`/sliders/${id}`),
        search: (query) => axiosInstance.get(`/sliders/search?q=${query}`),
        updateStatus: (id) => axiosInstance.patch(`/sliders/${id}/status`),
    },
    
    // Add more API endpoints as needed
};

export { axiosInstance as default, apiService };
