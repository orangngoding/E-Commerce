import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../utils/axios';

const CustomerProtectedRoute = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem('customerToken');
    const customerUser = JSON.parse(localStorage.getItem('customerUser'));

    useEffect(() => {
        const verifyCustomerStatus = async () => {
            try {
                if (!token || !customerUser) return;

                const response = await apiService.authcustomer.me();
                
                if (!response.data.success || !response.data.data || response.data.data.status !== 'active') {
                    localStorage.removeItem('customerToken');
                    localStorage.removeItem('customerUser');
                    navigate('/customer/login', { replace: true });
                }
            } catch (error) {
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerUser');
                navigate('/customer/login', { replace: true });
            }
        };

        verifyCustomerStatus();
    }, [location.pathname]);

    if (!token || !customerUser) {
        return <Navigate to="/customer/login" state={{ from: location }} replace />;
    }

    if (customerUser.status !== 'active') {
        return <Navigate to="/customer/verify-otp" state={{ userId: customerUser.id }} replace />;
    }

    return children;
};

export default CustomerProtectedRoute;
