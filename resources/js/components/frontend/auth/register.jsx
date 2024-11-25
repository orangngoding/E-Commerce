import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../../utils/axios';
import { toast } from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateEmail = (email) => {
        // Basic email validation
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            return false;
        }

        // Check for common disposable email domains
        const disposableDomains = ['tempmail.com', 'throwaway.com', 'temp-mail.org'];
        const domain = email.split('@')[1];
        return !disposableDomains.includes(domain);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });

        if (name === 'email' && value) {
            if (!validateEmail(value)) {
                setErrors(prev => ({
                    ...prev,
                    email: 'Please enter a valid email address'
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (!validateEmail(formData.email)) {
            setErrors({ email: 'Invalid or disposable email address not allowed' });
            setLoading(false);
            toast.error('Please use a valid email address');
            return;
        }

        try {
            const response = await apiService.authcustomer.register(formData);
            
            // Check response status and message
            if (!response.data.success) {
                toast.error(response.data.message);
                setErrors({ email: response.data.message });
                setLoading(false);
                return;
            }

            // Check if OTP email failed to send
            if (response.data.data?.email_status === 'failed') {
                toast.error('Unable to send verification email. Please check your email address.');
                setErrors({ 
                    email: 'This email address appears to be invalid or non-existent. Please use a valid email address.' 
                });
                setLoading(false);
                return;
            }

            toast.success('Registration successful! Please check your email for OTP');
            navigate('/verify-otp', { state: { userId: response.data.data.user_id } });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            
            if (errorMessage.includes('invalid') || errorMessage.includes('non-existent')) {
                toast.error('The provided email address appears to be invalid or non-existent');
                setErrors({
                    email: 'Please use a valid and existing email address'
                });
            } else {
                toast.error(errorMessage);
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Create Account
                        </h2>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                                        errors.username ? 'border-red-500' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                                        errors.password ? 'border-red-500' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    name="password_confirmation"
                                    type="password"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm your password"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'Register'
                                )}
                            </button>
                        </div>

                        <div className="text-center text-sm">
                            <span className="text-gray-600">Already have an account? </span>
                            <Link to="/customer/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
