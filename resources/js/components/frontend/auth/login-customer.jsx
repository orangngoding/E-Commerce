import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiService } from '../../../utils/axios';
import { toast } from 'react-hot-toast';

const LoginCustomer = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        device_name: navigator.userAgent
    });
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            const response = await apiService.authcustomer.login(formData);
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                
                // Store auth data
                localStorage.setItem('customerToken', token);
                localStorage.setItem('customerUser', JSON.stringify(user));
                
                toast.success('Login successful!');
                
                // Redirect to intended page or home
                const redirectTo = location.state?.from?.pathname || '/home';
                navigate(redirectTo, { replace: true });
            } else {
                window.alert(response.data.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            window.alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        try {
            const response = await apiService.authcustomer.forgotPassword({ email: resetEmail });
            
            if (response.data.success) {
                toast.success('Password reset instructions sent to your email');
                setShowForgotPassword(false);
            } else {
                window.alert(response.data.message);
            }
        } catch (error) {
            window.alert('Failed to send reset instructions');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">
                            {showForgotPassword ? 'Reset Password' : 'Sign In'}
                        </h2>
                    </div>

                    {!showForgotPassword ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    Forgot your password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>

                            <div className="text-center">
                                <Link
                                    to="/register"
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    Don't have an account? Register here
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {loading ? 'Sending...' : 'Send Reset Instructions'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                                className="w-full text-sm text-blue-600 hover:text-blue-500"
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginCustomer;
