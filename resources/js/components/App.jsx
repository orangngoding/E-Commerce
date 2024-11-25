import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import PasswordReset from './pages/pwreset';
import ForgotPassword from './pages/forgotpassword';
import Dashboard from './backend/dashboard';
import Kategori from './backend/kategori';
import Product from './backend/product';
import SizeProduct from './backend/size_product';
import ColorProduct from './backend/color-product';
import UserManagement from './backend/user_management';
import Slider from './backend/slider';
import Kupon from './backend/kupon';
import CustomerManagement from './backend/customer_management';
import Home from './frontend/home';
import Profile from './frontend/profile';
import DetailProduct from './frontend/detail-product';
import Register from './frontend/auth/register';
import VerifyOtp from './frontend/auth/verify-otp';
import LoginCustomer from './frontend/auth/login-customer';
import ResetPasswordCustomer from './frontend/auth/resetpw-customer';
import ChangePw from './frontend/auth/change-pw';
import ProtectedRoute from './ProtectedRoute';
import CustomerProtectedRoute from './CustomerProtectedRoute';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<PasswordReset />} />

            {/* register route customer user */}
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

             {/* public routes for customer user */}
            <Route path="/home" element={<Home />} />
            <Route path="/products/:id" element={<DetailProduct />} />
        
            {/* Customer auth routes */}
            <Route path="/customer/login" element={<LoginCustomer />} />
            <Route path="/customer/reset-password" element={<ResetPasswordCustomer />} />
            
            {/* Protected customer routes */}
            <Route path="/customer/*" element={
                <CustomerProtectedRoute>
                    <Routes>
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/change-password" element={<ChangePw />} />  

                        {/* <Route path="orders" element={<CustomerOrders />} /> */}
                        {/* Add more protected customer routes here */}
                    </Routes>
                </CustomerProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                    <Dashboard />
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<div>Welcome to Admin Dashboard</div>} />
                <Route path="users" element={<UserManagement />} />
                <Route path="kategoris" element={<Kategori />} />
                <Route path="products" element={<Product />} />
                <Route path="size-products" element={<SizeProduct/>} />
                <Route path="color-products" element={<ColorProduct/>} />
                <Route path="sliders" element={<Slider />} />
                <Route path="kupons" element={<Kupon />} />
                <Route path="customer-users" element={<CustomerManagement />} />
            </Route>

            {/* Staff routes */}
            <Route path="/staff/*" element={
                <ProtectedRoute allowedRoles={['super_admin', 'staff']}>
                    <Dashboard />
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<div>Welcome to Staff Dashboard</div>} />
                <Route path="kategoris" element={<Kategori />} />
                <Route path="products" element={<Product />} />
                <Route path="size-products" element={<SizeProduct/>} />
                <Route path="color-products" element={<ColorProduct/>} />
                <Route path="sliders" element={<Slider />} />
                <Route path="kupons" element={<Kupon />} />
                <Route path="customer-users" element={<CustomerManagement />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
    );
}

export default App;
