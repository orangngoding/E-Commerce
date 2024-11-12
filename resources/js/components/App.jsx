import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import PasswordReset from './pages/pwreset';
import ForgotPassword from './pages/forgotpassword';
import Dashboard from './backend/dashboard';
import Kategori from './backend/kategori';
import Product from './backend/product';
import UserManagement from './backend/user_management';
import Slider from './backend/slider';
import Kupon from './backend/kupon';
import Home from './frontend/home';
import ProtectedRoute from './ProtectedRoute';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/home" element={<Home />} />
        
            
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
                <Route path="sliders" element={<Slider />} />
                <Route path="kupons" element={<Kupon />} />
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
                <Route path="sliders" element={<Slider />} />
                <Route path="kupons" element={<Kupon />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;
