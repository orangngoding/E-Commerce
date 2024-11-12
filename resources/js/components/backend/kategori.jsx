import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import Modal from '../../common/modal';
import Alert from '../../common/alert';
import debounce from 'lodash/debounce';
import { format } from 'date-fns';

const Kategori = () => {
    const { isDarkMode } = useOutletContext();
    const [kategoris, setKategoris] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        image: null,
        status: true
    });
    const [editMode, setEditMode] = useState(false);
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
                const response = await apiService.kategoris.search(query);
                const filteredKategoris = statusFilter !== 'all' 
                    ? response.data.data.data.filter(kategori => 
                        statusFilter === 'active' ? kategori.status : !kategori.status)
                    : response.data.data.data;
                
                // Sort by ID ascending (oldest first)
                const sortedKategoris = [...filteredKategoris].sort((a, b) => a.id - b.id);
                
                setKategoris(sortedKategoris);
                setTotalPages(Math.ceil(response.data.data.total / 10));
            } catch (error) {
                console.error('Error searching kategoris:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [statusFilter]
    );
    
    const fetchKategoris = async (page = 1) => {
        try {
            setLoading(true);
            const response = await apiService.kategoris.list(page);
            const filteredKategoris = statusFilter !== 'all' 
                ? response.data.data.data.filter(kategori => 
                    statusFilter === 'active' ? kategori.status : !kategori.status)
                : response.data.data.data;
            
            // Sort by ID ascending (oldest first)
            const sortedKategoris = [...filteredKategoris].sort((a, b) => a.id - b.id);
            
            setKategoris(sortedKategoris);
            setTotalPages(Math.ceil(response.data.data.total / 10));
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching kategoris:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            debouncedSearch(searchQuery);
        } else {
            fetchKategoris(currentPage);
        }
    }, [searchQuery, statusFilter, currentPage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setAlert({
            show: true,
            title: 'Confirm Action',
            message: `Are you sure you want to ${editMode ? 'update' : 'create'} this category?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    const formDataObj = new FormData();
                    formDataObj.append('name', formData.name);
                    formDataObj.append('status', formData.status ? 1 : 0);
                    
                    if (editMode) {
                        // Explicitly handle image removal
                        if (formData.image === 'remove') {
                            formDataObj.append('remove_image', '1');
                        } else if (formData.image instanceof File) {
                            formDataObj.append('image', formData.image);
                        }
                        
                        await apiService.kategoris.update(selectedKategori.id, formDataObj);
                    } else {
                        if (formData.image instanceof File) {
                            formDataObj.append('image', formData.image);
                        }
                        await apiService.kategoris.create(formDataObj);
                    }
                    
                    showSuccessAlert(`Category ${editMode ? 'updated' : 'created'} successfully`);
                    fetchKategoris(currentPage);
                    setShowModal(false);
                    resetForm();
                } catch (error) {
                    showErrorAlert('An error occurred while saving the category');
                    console.error('Error:', error);
                }
            }
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
                setShowModal(false);
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
                setShowModal(true);
            },
        });
    };

    const handleDelete = (id) => {
        setAlert({
            show: true,
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await apiService.kategoris.delete(id);
                    showSuccessAlert('Category deleted successfully');
                    fetchKategoris(currentPage);
                } catch (error) {
                    showErrorAlert('Failed to delete category');
                }
            },
        });
    };

    const handleStatusToggle = async (id) => {
        try {
            await apiService.kategoris.updateStatus(id);
            fetchKategoris(currentPage);
            showSuccessAlert('Status updated successfully');
        } catch (error) {
            showErrorAlert('Failed to update status');
        }
    };

    const handleEdit = (kategori) => {
        setSelectedKategori(kategori);
        setFormData({
            name: kategori.name,
            status: kategori.status,
            image: null
        });
        // Set image preview if kategori has image
        setImagePreview(kategori.image ? `/storage/${kategori.image}` : null);
        setEditMode(true);
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        if (editMode && selectedKategori?.image) {
            setFormData(prev => ({
                ...prev,
                image: 'remove'
            }));
            setImagePreview(null);
            // Clear the image from selectedKategori to update UI immediately
            setSelectedKategori(prev => ({
                ...prev,
                image: null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                image: null
            }));
            setImagePreview(null);
        }
    };
    

    const handleViewDetails = (kategori) => {
        setSelectedKategori(kategori);
        setShowDetailModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            image: null,
            status: true
        });
        setSelectedKategori(null);
        setEditMode(false);
        setImagePreview(null);
    };

    return (
        <>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Category Management</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add New Category
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="mb-6 flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                            }`}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Categories Table */}
                <div className="relative">
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200`}>
                            {kategoris.map((kategori) => (
                                <tr key={kategori.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">{kategori.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {kategori.image ? (
                                            <img
                                                src={`/storage/${kategori.image}`}
                                                alt={kategori.name}
                                                className="h-10 w-10 object-cover rounded cursor-pointer"
                                                onClick={() => handleViewDetails(kategori)}
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleStatusToggle(kategori.id)}
                                            className={`px-3 py-1 rounded-full text-sm ${
                                                kategori.status
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {kategori.status ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {format(new Date(kategori.created_at), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => handleViewDetails(kategori)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEdit(kategori)}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(kategori.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
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
                                onClick={() => fetchKategoris(page)}
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

                {/* Create/Edit Modal */}
                {showModal && (
                    <Modal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            resetForm();
                            setImagePreview(null);
                        }}
                        title={editMode ? 'Edit Category' : 'Add New Category'}
                        isDarkMode={isDarkMode}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full rounded-lg shadow-sm px-4 py-2.5 ${
                                            isDarkMode 
                                                ? 'bg-gray-700 text-white border-gray-600' 
                                                : 'bg-white border-gray-300'
                                        } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                        required
                                        placeholder="Enter category name"
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category Image</label>
                                    <div className={`p-4 rounded-lg border-2 border-dashed ${
                                        isDarkMode ? 'border-gray-600' : 'border-gray-300'
                                    }`}>
                                        {/* Image Preview */}
                                        {(imagePreview || (editMode && selectedKategori?.image)) && (
                                            <div className="mb-4">
                                                <div className="relative w-full max-w-[200px] mx-auto">
                                                    <img
                                                        src={imagePreview || `/storage/${selectedKategori?.image}`}
                                                        alt="Preview"
                                                        className="rounded-lg w-full h-auto object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Button */}
                                        <div className="text-center">
                                            <label className="cursor-pointer inline-flex items-center space-x-2">
                                                <span className={`px-4 py-2 rounded-lg ${
                                                    isDarkMode 
                                                        ? 'bg-gray-600 hover:bg-gray-500' 
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                } transition-colors`}>
                                                    <span className="text-sm">Choose Image</span>
                                                </span>
                                                <input
                                                    type="file"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                    accept="image/*"
                                                />
                                            </label>
                                            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                PNG, JPG or JPEG (MAX. 2MB)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                                        className={`w-full rounded-lg shadow-sm px-4 py-2.5 ${
                                            isDarkMode 
                                                ? 'bg-gray-700 text-white border-gray-600' 
                                                : 'bg-white border-gray-300'
                                        } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                        setImagePreview(null);
                                    }}
                                    className={`px-4 py-2 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gray-600 hover:bg-gray-500' 
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    } transition-colors`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    {editMode ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* Detail View Modal */}
                {showDetailModal && selectedKategori && (
                    <Modal
                        isOpen={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        title="Category Details"
                        isDarkMode={isDarkMode}
                        size="lg"
                    >
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                {selectedKategori.image ? (
                                    <img
                                        src={`/storage/${selectedKategori.image}`}
                                        alt={selectedKategori.name}
                                        className="max-h-64 object-contain rounded-lg"
                                    />
                                ) : (
                                    <div className="h-64 w-64 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                        No Image Available
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium">Name</h3>
                                    <p className="mt-1">{selectedKategori.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">Status</h3>
                                    <p className="mt-1">
                                        <span className={`px-2 py-1 rounded-full text-sm ${
                                            selectedKategori.status
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {selectedKategori.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">Created At</h3>
                                    <p className="mt-1">
                                        {format(new Date(selectedKategori.created_at), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium">Updated At</h3>
                                    <p className="mt-1">
                                        {format(new Date(selectedKategori.updated_at), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Alert Component */}
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
            </div>
        </>
    );
};

export default Kategori;
