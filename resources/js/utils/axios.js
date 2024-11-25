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
        // Get CSRF token
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }

        // Check if it's a customer endpoint
        const isCustomerEndpoint = config.url?.startsWith('customer/');
        
        // Add appropriate auth token
        if (isCustomerEndpoint) {
            const customerToken = localStorage.getItem('customerToken');
            if (customerToken) {
                config.headers.Authorization = `Bearer ${customerToken}`;
            }
        } else {
            const adminToken = localStorage.getItem('adminToken');
            if (adminToken) {
                config.headers.Authorization = `Bearer ${adminToken}`;
            }
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
        const isCustomerEndpoint = originalRequest.url?.startsWith('customer/');
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            if (isCustomerEndpoint) {
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerUser');
                window.location.href = '/customer/login';
            } else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
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
    // Auth endpoints untuk admin
    auth: {
        login: (credentials) => axiosInstance.post('/login', credentials),
        logout: () => axiosInstance.post('/logout'),
        me: () => axiosInstance.get('/me'),
        forgotPassword: (data) => axiosInstance.post('/forgot-password', data),
        resetPassword: (data) => axiosInstance.post('/reset-password', data),
    },

    //auth endpoints untuk customer user
    authcustomer: {
        register: (data) => axiosInstance.post('customer/register', data),
        verifyOtp: (data) => axiosInstance.post('customer/verify-otp', data),
        resendOtp: (data) => axiosInstance.post('customer/resend-otp', data),
        login: (data) => axiosInstance.post('customer/login', data),
        logout: () => axiosInstance.post('customer/logout'),
        me: () => axiosInstance.get('customer/me'),
        forgotPassword: (data) => axiosInstance.post('customer/forgot-password', data),
        resetPassword: (data) => axiosInstance.post('customer/reset-password', data),
        updateProfile: (data) => axiosInstance.put('customer/profile', data),
        changePassword: (data) => axiosInstance.post('customer/change-password', data),
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
            return axiosInstance.post(`/kategoris/${id}?_method=PUT`, data, config);
        },
        delete: (id) => axiosInstance.delete(`/kategoris/${id}`),
        search: (query) => axiosInstance.get(`/kategoris/search?keyword=${query}`),
        updateStatus: (id) => axiosInstance.patch(`/kategoris/${id}/status`),
        getActive: (page = 1) => axiosInstance.get('/kategoris', {
            params: {
                status: true,
                page
            }
        }),
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
        getLatestPublished: () => axiosInstance.get('/products/latest-published'),
        getPublished: (id = null) => {
            if (id) {
                return axiosInstance.get(`/products/get-published/${id}`);
            }
            return axiosInstance.get('/products/get-published');
        },
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
    
    // kupons endpoints
    kupons: {
        list: (params = {}) => axiosInstance.get('/kupons', {
            params,
            paramsSerializer: params => {
                return Object.entries(params)
                    .filter(([_, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
            }
        }),
        getActive: () => axiosInstance.get('/kupons/active'),
        get: (id) => axiosInstance.get(`/kupons/${id}`),
        create: (data) => axiosInstance.post('/kupons', data),
        update: (id, data) => axiosInstance.put(`/kupons/${id}`, data),
        delete: (id) => axiosInstance.delete(`/kupons/${id}`),
        search: (query) => axiosInstance.get(`/kupons/search?q=${query}`),
        updateStatus: (id) => axiosInstance.patch(`/kupons/${id}/status`),
    },

    //customer user endpoints
    customerUsers: {
        list: (params = {}) => axiosInstance.get('/customer-users', {
            params,
            paramsSerializer: params => {
                return Object.entries(params)
                    .filter(([_, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
            }
        }),
        search: (query) => axiosInstance.get(`/customer-users/search?q=${query}`),
        get: (id) => axiosInstance.get(`/customer-users/${id}`),
        updateStatus: (id, status) => axiosInstance.patch(`/customer-users/${id}/status`, { status }),
        delete: (id) => axiosInstance.delete(`/customer-users/${id}`),
        getStatistics: () => axiosInstance.get('/customer-users/statistics'),
    },

    //sizes endpoints
    sizes: {
        list: (params = {}) => axiosInstance.get('/sizes', {
            params,
            paramsSerializer: params => {
                return Object.entries(params)
                    .filter(([_, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
            }
        }),
        getActive: () => axiosInstance.get('/sizes/active'),
        get: (id) => axiosInstance.get(`/sizes/${id}`),
        create: (data) => axiosInstance.post('/sizes', data),
        update: (id, data) => axiosInstance.put(`/sizes/${id}`, data),
        delete: (id) => axiosInstance.delete(`/sizes/${id}`),
        search: (query) => axiosInstance.get(`/sizes/search?q=${query}`),
        updateStatus: (id, status) => axiosInstance.patch(`/sizes/${id}/status`, { status }),
        manageColors: (id, colors) => axiosInstance.post(`/sizes/${id}/colors`, { colors: JSON.stringify(colors) }),
        // Optionally add a method to get available colors for a size
        getAvailableColors: (id) => axiosInstance.get(`/sizes/${id}/colors`),
    },

    //colors endpoints
    colors: {
        list: (params = {}) => axiosInstance.get('/colors', {
            params,
            paramsSerializer: params => {
                return Object.entries(params)
                    .filter(([_, value]) => value !== undefined && value !== '')
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
            }
        }),
        getActive: () => axiosInstance.get('/colors/active'),
        get: (id) => axiosInstance.get(`/colors/${id}`),
        create: (data) => axiosInstance.post('/colors', data),
        update: (id, data) => axiosInstance.put(`/colors/${id}`, data),
        delete: (id) => axiosInstance.delete(`/colors/${id}`),
        search: (query) => axiosInstance.get(`/colors/search?q=${query}`),
        updateStatus: (id, status) => axiosInstance.patch(`/colors/${id}/status`, { status }),
    },
    // Add more API endpoints as needed
};

export { axiosInstance as default, apiService };
