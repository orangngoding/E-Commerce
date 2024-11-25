import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import { toast } from 'react-hot-toast';
import Alert from '../../common/alert';
import { Switch } from '@headlessui/react';

const CustomerManagement = () => {
    const { isDarkMode } = useOutletContext();
    const [customers, setCustomers] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    
    const [alert, setAlert] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {},
        onCancel: () => {}
    });

    // Fetch customers and statistics
    const fetchData = async (page = 1, status = '') => {
        try {
            setLoading(true);
            const params = {
                page,
                per_page: 10,
                status: status || undefined
            };
            
            const [customersResponse, statsResponse] = await Promise.all([
                apiService.customerUsers.list(params),
                apiService.customerUsers.getStatistics()
            ]);

            setCustomers(customersResponse.data.data.data);
            setTotalPages(Math.ceil(customersResponse.data.data.total / 10));
            setStatistics(statsResponse.data.data);
        } catch (error) {
            toast.error('Failed to fetch customer data');
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchData(1, statusFilter);
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.customerUsers.search(searchQuery);
            setCustomers(response.data.data.data);
            setTotalPages(Math.ceil(response.data.data.total / 10));
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery) {
                handleSearch();
            } else {
                fetchData(currentPage, statusFilter);
            }
        }, 300); // 300ms delay for debouncing

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery,currentPage, statusFilter]);

    // Handle status update
    const handleStatusUpdate = async (customerId, newStatus) => {
        try {
            await apiService.customerUsers.updateStatus(customerId, newStatus);
            toast.success('Status updated successfully');
            fetchData(currentPage, statusFilter);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Modified delete handler with alert
    const handleDelete = (customerId) => {
        setAlert({
            isOpen: true,
            title: 'Delete Customer',
            message: 'Are you sure you want to delete this customer? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await apiService.customerUsers.delete(customerId);
                    toast.success('Customer deleted successfully');
                    fetchData(currentPage, statusFilter);
                } catch (error) {
                    toast.error('Failed to delete customer');
                }
                setAlert({ ...alert, isOpen: false });
            },
            onCancel: () => setAlert({ ...alert, isOpen: false })
        });
    };

    // Handle customer deletion
    const StatusBadgeWithDropdown = ({ customer }) => {
        const [showDropdown, setShowDropdown] = useState(false);
        const [showAlert, setShowAlert] = useState(false);
        const [selectedStatus, setSelectedStatus] = useState(null);
        const dropdownRef = useRef(null);
        const buttonRef = useRef(null);
    
        const statusOptions = [
            { 
                value: 'active', 
                label: 'Active', 
                color: 'green',
                icon: '✓',
            },
            { 
                value: 'inactive', 
                label: 'Inactive', 
                color: 'yellow',
                icon: '⊘',
            },
            { 
                value: 'suspended', 
                label: 'Suspended', 
                color: 'red',
                icon: '⊗',
            }
        ];
    
        const currentStatus = statusOptions.find(s => s.value === customer.status);
    
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                    !buttonRef.current.contains(event.target)) {
                    setShowDropdown(false);
                }
            };
    
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);
    
        const handleStatusSelect = (status) => {
            setSelectedStatus(status);
            setShowAlert(true);
            setShowDropdown(false);
        };
    
        const getDropdownPosition = () => {
            if (!buttonRef.current) return {};
            const rect = buttonRef.current.getBoundingClientRect();
            return {
                top: `${rect.bottom + window.scrollY + 5}px`,
                left: `${rect.left + window.scrollX}px`
            };
        };
    
        return (
            <>
                <div className="relative inline-block">
                    <button
                        ref={buttonRef}
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={`
                            px-3 py-1.5 inline-flex items-center gap-2
                            text-sm font-medium rounded-full
                            transition-all duration-200
                            bg-${currentStatus.color}-100 
                            text-${currentStatus.color}-800
                            hover:bg-${currentStatus.color}-200
                            focus:outline-none focus:ring-2 focus:ring-${currentStatus.color}-500 focus:ring-opacity-50
                        `}
                    >
                        <span className="text-lg">{currentStatus.icon}</span>
                        {currentStatus.label}
                        <svg className={`w-4 h-4 ml-1 transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                             fill="none" 
                             stroke="currentColor" 
                             viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
    
                    {showDropdown && (
                        <div
                            ref={dropdownRef}
                            style={getDropdownPosition()}
                            className={`
                                fixed z-50 w-64
                                bg-white rounded-lg shadow-lg
                                border border-gray-200
                                animate-fadeIn
                            `}
                        >
                            <div className="py-2">
                                {statusOptions.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusSelect(status)}
                                        className={`
                                            w-full px-4 py-3
                                            flex items-center gap-3
                                            hover:bg-gray-50 transition-colors
                                            ${customer.status === status.value ? 'bg-gray-50' : ''}
                                            ${customer.status === status.value ? `text-${status.color}-600` : 'text-gray-700'}
                                        `}
                                    >
                                        <span className={`
                                            flex-shrink-0 w-8 h-8
                                            rounded-full
                                            bg-${status.color}-100
                                            text-${status.color}-600
                                            flex items-center justify-center
                                            text-lg font-bold
                                        `}>
                                            {status.icon}
                                        </span>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium">{status.label}</p>
                                        </div>
                                        {customer.status === status.value && (
                                            <span className="flex-shrink-0 text-${status.color}-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
    
                <Alert
                    isOpen={showAlert}
                    title="Update Status"
                    message={`Are you sure you want to change the status to ${selectedStatus?.label}?`}
                    type="warning"
                    confirmText="Update Status"
                    onConfirm={() => {
                        handleStatusUpdate(customer.id, selectedStatus.value);
                        setShowAlert(false);
                    }}
                    onCancel={() => setShowAlert(false)}
                />
            </>
        );
    };
    

    const TableLoading = ({ isDarkMode }) => (
        <tr>
            <td colSpan="4" className="px-6 py-4">
                <div className="flex justify-center items-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading data...
                    </span>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statistics && (
                    <>
                        <StatCard
                            title="Total Customers"
                            value={statistics.total}
                            isDarkMode={isDarkMode}
                            icon="users"
                        />
                        <StatCard
                            title="Active Customers"
                            value={statistics.active}
                            isDarkMode={isDarkMode}
                            icon="check-circle"
                            color="green"
                        />
                        <StatCard
                            title="Inactive Customers"
                            value={statistics.inactive}
                            isDarkMode={isDarkMode}
                            icon="x-circle"
                            color="yellow"
                        />
                        <StatCard
                            title="Suspended Customers"
                            value={statistics.suspended}
                            isDarkMode={isDarkMode}
                            icon="ban"
                            color="red"
                        />
                    </>
                )}
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`rounded-lg px-4 py-2 w-full md:w-80 ${
                            isDarkMode 
                                ? 'bg-gray-700 text-white' 
                                : 'bg-white text-gray-900'
                        }`}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`rounded-lg px-4 py-2 ${
                        isDarkMode 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-white text-gray-900'
                    }`}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Customers Table */}
            <div className={`overflow-x-auto rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow`}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {loading ? (
                                <TableLoading isDarkMode={isDarkMode} />
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                        customers.map((customer) => (
                            <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className={`text-sm font-medium ${
                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                {customer.username}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {customer.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadgeWithDropdown 
                                        customer={customer} 
                                        handleStatusUpdate={handleStatusUpdate} 
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.last_login_at 
                                        ? new Date(customer.last_login_at).toLocaleDateString()
                                        : 'Never'
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center space-x-2">
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-3 py-1 rounded ${
                            currentPage === index + 1
                                ? 'bg-blue-600 text-white'
                                : isDarkMode
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-white text-gray-700'
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <CustomerDetailModal
                    customer={selectedCustomer}
                    isOpen={!!selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    onStatusUpdate={handleStatusUpdate}
                    isDarkMode={isDarkMode}
                />
            )}

        <Alert
            isOpen={alert.isOpen}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            confirmText={alert.confirmText}
            onConfirm={alert.onConfirm}
            onCancel={alert.onCancel}
        />
        </div>
    );
};

// Helper Components
const StatCard = ({ title, value, icon, color = 'blue', isDarkMode }) => (
    <div className={`p-6 rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
    } shadow-lg`}>
        <div className="flex items-center justify-between">
            <div>
                <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                    {title}
                </p>
                <p className={`text-3xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    {value}
                </p>
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
                {/* Add icon component based on the icon prop */}
            </div>
        </div>
    </div>
);

const CustomerDetailModal = ({ customer, isOpen, onClose, onStatusUpdate, isDarkMode }) => {
    const [isStatusEnabled, setIsStatusEnabled] = useState(customer.status === 'active');
    const [showAlert, setShowAlert] = useState(false);

    const handleStatusToggle = () => {
        setShowAlert(true);
    };

    const confirmStatusUpdate = async () => {
        const newStatus = !isStatusEnabled ? 'active' : 'inactive';
        try {
            await onStatusUpdate(customer.id, newStatus);
            setIsStatusEnabled(!isStatusEnabled);
            setShowAlert(false);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-lg w-full max-w-2xl mx-4 overflow-hidden shadow-xl transform transition-all`}>
                    {/* Header */}
                    <div className={`px-6 py-4 border-b ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-xl font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Customer Profile
                            </h2>
                            <button
                                onClick={onClose}
                                className={`rounded-full p-1 hover:bg-gray-100 ${
                                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-sm font-medium ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Account Status
                                    </label>
                                    <div className="mt-1 flex items-center space-x-3">
                                        <Switch
                                            checked={isStatusEnabled}
                                            onChange={handleStatusToggle}
                                            className={`${
                                                isStatusEnabled ? 'bg-green-600' : 'bg-gray-400'
                                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                                        >
                                            <span className={`${
                                                isStatusEnabled ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                                        </Switch>
                                        <span className={`text-sm ${
                                            isStatusEnabled ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {isStatusEnabled ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className={`text-sm font-medium ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Username
                                    </label>
                                    <p className={`mt-1 text-base ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {customer.username}
                                    </p>
                                </div>

                                <div>
                                    <label className={`text-sm font-medium ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Email
                                    </label>
                                    <p className={`mt-1 text-base ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {customer.email}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-sm font-medium ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Registration Date
                                    </label>
                                    <p className={`mt-1 text-base ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {new Date(customer.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div>
                                    <label className={`text-sm font-medium ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        Last Login
                                    </label>
                                    <p className={`mt-1 text-base ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {customer.last_login_at 
                                            ? new Date(customer.last_login_at).toLocaleDateString()
                                            : 'Never'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 border-t ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 rounded-md ${
                                    isDarkMode
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Alert
                isOpen={showAlert}
                title="Update Status"
                message={`Are you sure you want to ${isStatusEnabled ? 'deactivate' : 'activate'} this customer?`}
                type="warning"
                confirmText={isStatusEnabled ? 'Deactivate' : 'Activate'}
                onConfirm={confirmStatusUpdate}
                onCancel={() => setShowAlert(false)}
            />
        </>
    );
};

export default CustomerManagement;


