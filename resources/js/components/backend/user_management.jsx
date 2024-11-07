import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import Modal from '../../common/modal';
import Alert from '../../common/alert';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';

const UserManagement = () => {
    const { isDarkMode } = useOutletContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff'
    });
    const [errors, setErrors] = useState({});

    const [alert, setAlert] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => {},
      });

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            try {
                setLoading(true);
                const response = await apiService.users.search(query);
                const filteredUsers = roleFilter !== 'all' 
                    ? response.data.data.filter(user => user.role === roleFilter)
                    : response.data.data;
                setUsers(filteredUsers);
                setTotalPages(Math.ceil(response.data.total / response.data.per_page));
                setCurrentPage(1);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [roleFilter]
    );

    // Fetch users with role filter
    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const response = await apiService.users.list(page);
            const filteredUsers = roleFilter !== 'all' 
                ? response.data.data.filter(user => user.role === roleFilter)
                : response.data.data;
            setUsers(filteredUsers);
            setTotalPages(Math.ceil(response.data.total / response.data.per_page));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            debouncedSearch(searchQuery);
        } else {
            fetchUsers(1);
        }
    }, [searchQuery, roleFilter]);


    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
      
        // Show confirmation alert before proceeding
        setAlert({
          show: true,
          title: 'Confirm Action',
          message: `Are you sure you want to ${modalMode === 'create' ? 'create' : 'update'} this user?`,
          type: 'warning',
          onConfirm: async () => {
            try {
              if (modalMode === 'create') {
                await apiService.users.create(formData);
                showSuccessAlert('User created successfully');
              } else {
                await apiService.users.update(selectedUser.id, formData);
                showSuccessAlert('User updated successfully');
              }
              setShowModal(false);
              fetchUsers(currentPage);
              resetForm();
            } catch (error) {
              if (error.errors) {
                setErrors(error.errors);
                showErrorAlert('Please check the form for errors');
              } else {
                showErrorAlert('An error occurred while saving the user');
              }
            }
          },
          onCancel: () => {
            setAlert({ ...alert, show: false });
            // Keep modal open when user cancels
            setShowModal(true);
          }
        });
      };

    // Delete user
    const handleDelete = (userId) => {
        setAlert({
          show: true,
          title: 'Delete User',
          message: 'Are you sure you want to delete this user? This action cannot be undone.',
          type: 'danger',
          onConfirm: async () => {
            try {
              await apiService.users.delete(userId);
              fetchUsers(currentPage);
              showSuccessAlert('User deleted successfully');
            } catch (error) {
              showErrorAlert('Failed to delete user');
            }
          },
        });
      };

      const showSuccessAlert = (message) => {
        setAlert({
          show: true,
          title: 'Success',
          message,
          type: 'info',
          onConfirm: () => {
            setAlert({ ...alert, show: false });
            setShowModal(false); // Close modal after success
          },
        });
      };
      
      const showErrorAlert = (message) => {
        setAlert({
          show: true,
          title: 'Error',
          message,
          type: 'danger',
          onConfirm: () => {
            setAlert({ ...alert, show: false });
            setShowModal(true); // Keep modal open on error
          },
        });
      };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'staff'
        });
        setSelectedUser(null);
    };

    // Edit user
    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: ''
        });
        setModalMode('edit');
        setShowModal(true);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <>
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold">User Management</h1>
                <button
                    onClick={() => {
                        setModalMode('create');
                        setShowModal(true);
                        resetForm();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add New User
                </button>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1">
                    <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                    }`}
                    />
                </div>
                    <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                    >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="staff">Staff</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="relative">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-500'} uppercase tracking-wider`}>Name</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-500'} uppercase tracking-wider`}>Email</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-500'} uppercase tracking-wider`}>Role</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-500'} uppercase tracking-wider`}>Created At</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200`}>
                        {users.map((user) => (
                            <tr key={user.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.name}</td>
                                <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.role === 'super_admin' 
                                            ? isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                                            : isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className={`${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-900'} mr-4`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                 {/* Table Loading Overlay */}
                 {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} w-full h-full flex items-center justify-center`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                                    Loading...
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => fetchUsers(page)}
                            className={`px-3 py-1 text-sm rounded ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <div className="text-sm text-gray-500">
                    Showing page {currentPage} of {totalPages}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => {
                    setShowModal(false);
                    resetForm();
                    setErrors({});
                    }}
                    title={modalMode === 'create' ? 'Add New User' : 'Edit User'}
                    isDarkMode={isDarkMode}
                    size="md"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Name
                        </label>
                        <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-300'
                        }`}
                        />
                        {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Email
                        </label>
                        <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-300'
                        }`}
                        />
                        {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Password
                        </label>
                        <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-300'
                        }`}
                        />
                        {errors.password && (
                        <p className="mt-1 text-sm text-red-500">{errors.password[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Role
                        </label>
                        <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'border-gray-300'
                        }`}
                        >
                        <option value="staff">Staff</option>
                        <option value="super_admin">Super Admin</option>
                        </select>
                        {errors.role && (
                        <p className="mt-1 text-sm text-red-500">{errors.role[0]}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                        type="button"
                        onClick={() => {
                            setShowModal(false);
                            resetForm();
                            setErrors({});
                        }}
                        className={`px-4 py-2 rounded-md border shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isDarkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        >
                        Cancel
                        </button>
                        <button
                        type="submit"
                        className="px-4 py-2 rounded-md border border-transparent shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                        {modalMode === 'create' ? 'Create User' : 'Update User'}
                        </button>
                    </div>
                    </form>
                </Modal>
                )}
    
            </div>

            <Alert
                isOpen={alert.show}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onConfirm={alert.onConfirm}
                onCancel={() => setAlert({ ...alert, show: false })}
                confirmText={alert.type === 'danger' ? 'Delete' : 'OK'}
                cancelText="Cancel"
            />
            </>
        );

        
    };
    
    export default UserManagement;
    