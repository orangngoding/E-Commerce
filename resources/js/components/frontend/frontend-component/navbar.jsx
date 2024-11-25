import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('customerToken');
    const userData = localStorage.getItem('customerUser');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogoutSuccess = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const renderAuthButton = () => {
    if (isLoading) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (isAuthenticated) {
      return <ProfileDropdown user={user} onLogoutSuccess={handleLogoutSuccess} />;
    }

    return (
      <Link
        to="/customer/login"
        className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
      >
        Login
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">E-Shop</Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/home" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/store" className="text-gray-700 hover:text-blue-600 transition-colors">Store</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">About</Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</Link>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/cart" className="relative text-gray-700 hover:text-blue-600 transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {renderAuthButton()}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
