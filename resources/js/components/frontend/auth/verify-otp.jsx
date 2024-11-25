import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaEnvelope } from 'react-icons/fa';

const VerifyOtp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(180); // 3 minutes countdown

    useEffect(() => {
        if (!userId) {
            navigate('/register');
            toast.error('Invalid session. Please register again.');
            return;
        }

        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else {
            setResendDisabled(false);
        }

        return () => clearInterval(timer);
    }, [countdown, userId, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP code');
            setLoading(false);
            return;
        }

        try {
            const response = await apiService.authcustomer.verifyOtp({
                user_id: userId,
                otp_code: otp
            });
            toast.success('Email verified successfully!');
            localStorage.setItem('token', response.data.data.token);
            navigate('/customer/login');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Verification failed';
            if (errorMessage.includes('expired')) {
                toast.error('OTP code has expired. Please request a new one.');
            } else if (errorMessage.includes('invalid')) {
                toast.error('Invalid OTP code. Please try again.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendDisabled) {
            toast.error(`Please wait ${countdown} seconds before requesting a new OTP`);
            return;
        }

        try {
            await apiService.authcustomer.resendOtp({ user_id: userId });
            toast.success('New OTP code sent successfully to your email');
            setResendDisabled(true);
            setCountdown(180); // Reset countdown to 3 minutes
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
            if (errorMessage.includes('verified')) {
                toast.error('Email is already verified');
            } else {
                toast.error(errorMessage);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <FaEnvelope className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Verify Your Email
                        </h2>
                        <p className="text-gray-600">
                            Please enter the 6-digit OTP code sent to your email
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleVerify}>
                        <div>
                            <div className="flex justify-center space-x-2">
                                <input
                                    type="text"
                                    required
                                    className="appearance-none text-center tracking-widest font-mono text-2xl block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        if (value.length <= 6) setOtp(value);
                                    }}
                                    maxLength="6"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white 
                                    ${loading || otp.length !== 6 
                                        ? 'bg-blue-300 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    } transition duration-150 ease-in-out`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify OTP'
                                )}
                            </button>
                        </div>

                        <div className="text-center space-y-2">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendDisabled}
                                className={`text-sm ${resendDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-500'}`}
                            >
                                Resend OTP
                            </button>
                            {countdown > 0 && (
                                <p className="text-sm text-gray-500">
                                    Resend available in {Math.floor(countdown / 60)}:
                                    {String(countdown % 60).padStart(2, '0')}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
