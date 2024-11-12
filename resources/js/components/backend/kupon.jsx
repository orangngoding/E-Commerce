import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import { format } from 'date-fns';
import Alert from '../../common/alert';

const Kupon = () => {
    const { isDarkMode } = useOutletContext();
    const [kupons, setKupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedKupon, setSelectedKupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discount_amount: '',
        discount_type: 'nominal',
        start_date: '',
        end_date: '',
        max_usage: '',
    });
    const [errors, setErrors] = useState({});

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0
    });

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {},
        onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
    });

    const [filters, setFilters] = useState({
        status: 'all',
        sortBy: 'created_at',
        sort: 'desc',
        page: 1,
        discount_type: 'all' 
    });    

    // Fetch kupons
    const fetchKupons = async () => {
        try {
            setLoading(true);
            const params = {
                sort: filters.sort,
                sort_by: filters.sortBy,
                status: filters.status !== 'all' ? filters.status : undefined,
                discount_type: filters.discount_type !== 'all' ? filters.discount_type : undefined,
                page: filters.page
            };
            
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v != null)
            );
            
            const response = await apiService.kupons.list(cleanParams);
            setKupons(response.data.data.data);
            setPagination({
                currentPage: response.data.data.current_page,
                lastPage: response.data.data.last_page,
                perPage: response.data.data.per_page,
                total: response.data.data.total
            });
        } catch (error) {
            console.error('Error fetching kupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setFilters(prev => ({
            ...prev,
            page: page
        }));
    };
    
    // Handle search
    const handleSearch = async () => {
        try {
            setLoading(true);
            const response = await apiService.kupons.search(searchQuery);
            setKupons(response.data.data.data);
            setPagination({
                currentPage: response.data.data.current_page,
                lastPage: response.data.data.last_page,
                perPage: response.data.data.per_page,
                total: response.data.data.total
            });
        } catch (error) {
            console.error('Error searching kupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (value) => {
        setFilters(prev => ({ 
            ...prev, 
            status: value,
            page: 1 // Reset page when changing filters
        }));
    };

    const handleSort = (value) => {
        const [sortBy, sort] = value.split('-');
        setLoading(true);
        setFilters(prev => ({
            ...prev,
            sortBy,
            sort,
            page: 1 // Reset page when sorting changes
        }));
    };

    const handleDiscountTypeChange = (value) => {
        setFilters(prev => ({ 
            ...prev, 
            discount_type: value,
            page: 1
        }));
    };    
    
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery) {
                handleSearch();
            } else {
                fetchKupons();
            }
        }, 300);
    
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, filters]);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return format(date, 'yyyy-MM-dd');
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setAlertConfig({
            isOpen: true,
            title: 'Submit Confirmation',
            message: `Are you sure you want to ${selectedKupon ? 'update' : 'create'} this coupon?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    const submissionData = {
                        ...formData,
                        start_date: `${formData.start_date}T00:00:00.000Z`,
                        end_date: `${formData.end_date}T00:00:00.000Z`,
                    };
    
                    if (selectedKupon) {
                        await apiService.kupons.update(selectedKupon.id, submissionData);
                    } else {
                        await apiService.kupons.create(submissionData);
                    }

                    if (formData.discount_type === 'percent' && formData.discount_amount > 100) {
                        setErrors({
                            ...errors,
                            discount_amount: ['Percentage discount cannot exceed 100%']
                        });
                        return;
                    }
                    
                    setAlertConfig({
                        isOpen: true,
                        title: 'Success',
                        message: `Coupon successfully ${selectedKupon ? 'updated' : 'created'}.`,
                        type: 'info',
                        onConfirm: () => {
                            setAlertConfig(prev => ({...prev, isOpen: false}));
                            setShowModal(false);
                            setSelectedKupon(null);
                            setFormData({
                                code: '',
                                discount_amount: '',
                                start_date: '',
                                end_date: '',
                                max_usage: '',
                            });
                            fetchKupons();
                        },
                        onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
                    });
    
                } catch (error) {
                    if (error.response?.data?.errors) {
                        setErrors(error.response.data.errors);
                        setAlertConfig({
                            isOpen: true,
                            title: 'Validation Error',
                            message: 'Please check the form for errors.',
                            type: 'danger',
                            onConfirm: () => setAlertConfig(prev => ({...prev, isOpen: false})),
                            onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
                        });
                    }
                }
            },
            onCancel: () => {
                setAlertConfig(prev => ({...prev, isOpen: false}));
            }
        });
    };

    const handleEdit = (kupon) => {
        setSelectedKupon(kupon);
        setFormData({
            code: kupon.code,
            discount_amount: kupon.discount_amount,
            discount_type: kupon.discount_type,
            start_date: formatDateForInput(kupon.start_date),
            end_date: formatDateForInput(kupon.end_date),
            max_usage: kupon.max_usage,
        });
        setShowModal(true);
    };
    

    // Handle status toggle
    const handleStatusToggle = (id, currentStatus) => {
        const newStatus = !currentStatus;
        setAlertConfig({
            isOpen: true,
            title: 'Update Status',
            message: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this coupon?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await apiService.kupons.updateStatus(id);
                    fetchKupons();
                    setAlertConfig(prev => ({...prev, isOpen: false}));
                } catch (error) {
                    console.error('Error updating status:', error);
                    setAlertConfig({
                        isOpen: true,
                        title: 'Error',
                        message: 'Failed to update coupon status. Please try again.',
                        type: 'danger',
                        onConfirm: () => setAlertConfig(prev => ({...prev, isOpen: false})),
                        onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
                    });
                }
            },
            onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
        });
    };

    // Handle delete
    const handleDelete = (id) => {
        setAlertConfig({
            isOpen: true,
            title: 'Delete Coupon',
            message: 'Are you sure you want to delete this coupon? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await apiService.kupons.delete(id);
                    fetchKupons();
                    setAlertConfig(prev => ({...prev, isOpen: false}));
                } catch (error) {
                    console.error('Error deleting kupon:', error);
                    setAlertConfig({
                        isOpen: true,
                        title: 'Error',
                        message: 'Failed to delete coupon. Please try again.',
                        type: 'danger',
                        onConfirm: () => setAlertConfig(prev => ({...prev, isOpen: false})),
                        onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
                    });
                }
            },
            onCancel: () => setAlertConfig(prev => ({...prev, isOpen: false}))
        });
    };

    return (
        <div className={`container mx-auto px-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Coupon Management</h1>
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center mt-4">
                        <input
                            type="text"
                            placeholder="Search coupons..."
                            className={`px-4 py-2 rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-800'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className={`px-3 py-2 rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-800'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="all">All Status</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                        <select
                            value={filters.discount_type}
                            onChange={(e) => handleDiscountTypeChange(e.target.value)}
                            className={`px-3 py-2 rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-800'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="all">All Types</option>
                            <option value="nominal">Nominal</option>
                            <option value="percent">Percentage</option>
                        </select>
                        <select
                            value={`${filters.sortBy}-${filters.sort}`}
                            onChange={(e) => handleSort(e.target.value)}
                            className={`px-3 py-2 rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-800'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            disabled={loading} // Disable during loading
                        >
                            <option value="created_at-desc">Newest First</option>
                            <option value="created_at-asc">Oldest First</option>
                            <option value="start_date-asc">Start Date (Ascending)</option>
                            <option value="start_date-desc">Start Date (Descending)</option>
                            <option value="end_date-asc">End Date (Ascending)</option>
                            <option value="end_date-desc">End Date (Descending)</option>
                            <option value="current_usage-desc">Most Used</option>
                            <option value="current_usage-asc">Least Used</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        Add New Coupon
                    </button>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <tr>
                        <td colSpan="7" className="text-center py-4">
                            <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        </td>
                    </tr>
                ) : kupons.length === 0 ? (
                    <tr>
                        <td colSpan="7" className="text-center py-4">
                            No coupons found
                        </td>
                    </tr>
                ) : (
                <table className={`min-w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                            <th className="px-6 py-3 text-left">Code</th>
                            <th className="px-6 py-3 text-left">Discount Type</th>
                            <th className="px-6 py-3 text-left">Discount</th>
                            <th className="px-6 py-3 text-left">Validity</th>
                            <th className="px-6 py-3 text-left">Usage</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kupons.map((kupon) => (
                            <tr 
                                key={kupon.id}
                                className={`border-t ${
                                    isDarkMode 
                                        ? 'border-gray-700 hover:bg-gray-700' 
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <td className="px-6 py-4">{kupon.code}</td>
                                <td className="px-6 py-4 capitalize">{kupon.discount_type}</td>
                                <td className="px-6 py-4">
                                    {kupon.discount_amount}
                                    {kupon.discount_type === 'percent' ? '%' : ' IDR'}
                                </td>
                                <td className="px-6 py-4">
                                    {format(new Date(kupon.start_date), 'dd/MM/yyyy')} - 
                                    {format(new Date(kupon.end_date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    {kupon.current_usage} / {kupon.max_usage}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleStatusToggle(kupon.id, kupon.is_active)}
                                        className={`px-3 py-1 rounded-full text-white ${
                                            kupon.is_active ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    >
                                        {kupon.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                handleEdit(kupon);
                                            }}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(kupon.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-md w-full`}>
                        <h2 className="text-2xl font-bold mb-4">
                            {selectedKupon ? 'Edit Coupon' : 'Add New Coupon'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-1">Coupon Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    />
                                    {errors.code && (
                                        <p className="text-red-500 text-sm mt-1">{errors.code[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block mb-1">Discount Type</label>
                                    <select
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    >
                                        <option value="nominal">Nominal</option>
                                        <option value="percent">Percentage</option>
                                    </select>
                                    {errors.discount_type && (
                                        <p className="text-red-500 text-sm mt-1">{errors.discount_type[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block mb-1">Discount Amount (%)</label>
                                    <input
                                        type="number"
                                        name="discount_amount"
                                        value={formData.discount_amount}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">Maximum Usage</label>
                                    <input
                                        type="number"
                                        name="max_usage"
                                        value={formData.max_usage}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 rounded ${
                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedKupon(null);
                                        setFormData({
                                            code: '',
                                            discount_amount: '',
                                            discount_type: 'nominal',
                                            start_date: '',
                                            end_date: '',
                                            max_usage: '',
                                        });
                                        setErrors({});
                                    }}
                                    className={`px-4 py-2 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gray-600 hover:bg-gray-500' 
                                            : 'bg-gray-200 hover:bg-gray-300'
                                    } transition-colors`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    {selectedKupon ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && kupons.length > 0 && (
                <div className="mt-4 flex justify-between items-center">
                    {/* Page Numbers - Now on the left */}
                    <div className="flex gap-2">
                        {[...Array(pagination.lastPage)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={`px-3 py-1 rounded ${
                                    pagination.currentPage === index + 1
                                        ? 'bg-blue-500 text-white'
                                        : isDarkMode
                                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } transition-colors`}
                                disabled={loading}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {/* Info Text - Now on the right */}
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of{' '}
                        {pagination.total} entries
                    </div>
                </div>
            )}


            <Alert
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
            />
        </div>
    );
};

export default Kupon;
