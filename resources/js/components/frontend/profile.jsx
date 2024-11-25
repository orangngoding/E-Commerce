import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { apiService } from '../../utils/axios';
import Navbar from './frontend-component/navbar';
import { FiUser, FiSettings, FiLogOut, FiEdit2, FiLock } from 'react-icons/fi';

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('customerUser')));
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
  
  });

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiService.authcustomer.logout();
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      toast.success('Logged out successfully');
      navigate('/home');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiService.authcustomer.updateProfile(formData);
      
      if (response.data.success) {
        localStorage.setItem('customerUser', JSON.stringify(response.data.data));
        setUser(response.data.data);
        toast.success('Profile updated successfully');
        setShowEditModal(false);
        
        setFormData({
          ...formData,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow p-6 h-fit">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl mb-4">
                {user?.username?.[0]?.toUpperCase() || <FiUser size={32} />}
              </div>
              <h3 className="text-lg font-semibold">{user?.username}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              <Link
                to="/customer/profile"
                className="flex items-center space-x-3 px-4 py-2 text-gray-700 rounded-lg bg-gray-100"
              >
                <FiUser /> <span>Profile</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiSettings /> <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 w-full"
              >
                <FiLogOut /> <span>Logout</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiEdit2 /> <span>Edit Profile</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Username</h3>
                    <p className="mt-1 text-lg text-gray-900">{user?.username}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-lg text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user?.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="mt-1 text-lg text-gray-900">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                  <Link
                    to="/customer/change-password"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <FiLock className="w-4 h-4" />
                    <span>Change Password</span>
                  </Link>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
