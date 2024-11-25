import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { apiService } from '../../../utils/axios';
import { toast } from 'react-hot-toast';

const ProfileDropdown = ({ user, onLogoutSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiService.authcustomer.logout();
      
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      
      onLogoutSuccess();
      
      toast.success('Logged out successfully');
      navigate('/home');
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoggingOut) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="text-black hover:text-blue-600 transition-colors">
          <FiUser className="w-6 h-6" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <Link
            to="/customer/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FiUser className="mr-3" /> Profile
          </Link>

          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FiSettings className="mr-3" /> Settings
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
          >
            <FiLogOut className="mr-3" /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
