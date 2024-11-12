import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { apiService } from '../../utils/axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
    const [isKuponOpen, setIsKuponOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    const handleLogout = async () => {
        try {
            await apiService.auth.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
            {/* Navigation */}
            <nav className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="max-w-full mx-0 px-0">
                    <div className="flex justify-between h-16">
                        {/* Left side - Logo and Title */}
                        <div className="flex items-center pl-4">
                            <div className="flex items-center space-x-3">
                                <img 
                                    src="/images/logo.png" 
                                    alt="Logo" 
                                    className="h-8 w-auto"
                                />
                                <span className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
                                    Admin Panel
                                </span>
                            </div>
                        </div>

                        {/* Right side - Notifications and Profile */}
                        <div className="flex items-center pr-4">
                            {/* Notifications */}
                            <div className="relative mr-3">
                                <button
                                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                                </button>
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                        <span className="text-white font-medium">{user?.name?.charAt(0)}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                            {user?.name}
                                        </p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {user?.role}
                                        </p>
                                    </div>
                                </button>

                                {/* Updated Profile Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg ${
                                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                                    } ring-1 ring-black ring-opacity-5`}>
                                        <div className="p-2 space-y-1">
                                            {/* Dark Mode Toggle in Dropdown */}
                                            <button
                                                onClick={() => setIsDarkMode(!isDarkMode)}
                                                className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                                                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {isDarkMode ? (
                                                    <>
                                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        <span>Light Mode</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                        </svg>
                                                        <span>Dark Mode</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* Divider */}
                                            <div className={`my-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

                                            {/* Sign Out Button */}
                                            <button
                                                onClick={handleLogout}
                                                className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                                                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Sign out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>


            {/* Sidebar and Main Content */}
            <div className="flex">
                {/* Sidebar */}
                <div className={`w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-screen`}>
                    <nav className="mt-5">
                        <div className="px-2 space-y-1">
                            <Link
                                to="dashboard"
                                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                                    location.pathname.includes('/dashboard')
                                        ? isDarkMode
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-blue-50 text-blue-600'
                                        : isDarkMode
                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <svg className="mr-4 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Dashboard
                            </Link>

                             {/* Master Data Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                                    className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                                        location.pathname.includes('/kategoris') || 
                                        location.pathname.includes('/products') || 
                                        location.pathname.includes('/kupons')
                                            ? isDarkMode
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-blue-50 text-blue-600'
                                            : isDarkMode
                                                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <svg className="mr-4 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Master Data
                                    <svg className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${isMasterDataOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isMasterDataOpen && (
                                    <div className="pl-11 space-y-1">
                                        {/* Categories */}
                                        <Link
                                            to="kategoris"
                                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                location.pathname.includes('/kategoris')
                                                    ? isDarkMode
                                                        ? 'bg-gray-900 text-white'
                                                        : 'bg-blue-50 text-blue-600'
                                                    : isDarkMode
                                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Categories
                                        </Link>

                                        {/* Products */}
                                        <Link
                                            to="products"
                                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                location.pathname.includes('/products')
                                                    ? isDarkMode
                                                        ? 'bg-gray-900 text-white'
                                                        : 'bg-blue-50 text-blue-600'
                                                    : isDarkMode
                                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            Products
                                        </Link>

                                        {/* Kupon with sub-menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsKuponOpen(!isKuponOpen)}
                                                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                    isDarkMode
                                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                                </svg>
                                                Kupon
                                                <svg className={`ml-auto h-4 w-4 transform transition-transform duration-200 ${isKuponOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {isKuponOpen && (
                                                <div className="pl-8">
                                                    <Link
                                                        to="kupons"
                                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                            location.pathname === '/kupons' || location.pathname.endsWith('/kupons')
                                                                ? isDarkMode
                                                                    ? 'bg-gray-900 text-white'
                                                                    : 'bg-blue-50 text-blue-600'
                                                                : isDarkMode
                                                                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Set Kupon
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* Settings Dropdown */}
                            {user?.role === 'super_admin' && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                        className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                                            isDarkMode
                                                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <svg className="mr-4 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                        <svg className={`ml-auto h-5 w-5 transform ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isSettingsOpen && (
                                        <div className="pl-11 space-y-1">
                                            <Link
                                                to="users"
                                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                    location.pathname.includes('/users')
                                                        ? isDarkMode
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-blue-50 text-blue-600'
                                                        : isDarkMode
                                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <svg 
                                                    className="mr-3 h-5 w-5"
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth="2" 
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                                                    />
                                                </svg>
                                                User Management
                                            </Link>
                                            <Link
                                                to="sliders"
                                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                    location.pathname.includes('/sliders')
                                                        ? isDarkMode
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-blue-50 text-blue-600'
                                                        : isDarkMode
                                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <svg 
                                                    className="mr-3 h-5 w-5"
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth="2" 
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                Slider
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Main Content */}
                <div className={`flex-1 p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                    <Outlet context={{ isDarkMode }} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
