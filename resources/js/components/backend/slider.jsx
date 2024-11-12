import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import { toast } from 'react-hot-toast';
import Alert from '../../common/alert';
import { FiEdit2, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';

const Slider = () => {
    const { isDarkMode } = useOutletContext();
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedSlider, setSelectedSlider] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        judul: '',
        image: null,
        status: true
    });

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {},
    });

    // Fetch sliders
    const fetchSliders = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response = search
                ? await apiService.sliders.search(search)
                : await apiService.sliders.list(page);
            
            let filteredData = response.data.data.data;
            if (statusFilter !== 'all') {
                filteredData = filteredData.filter(slider => 
                    statusFilter === 'active' ? slider.status : !slider.status
                );
            }
            
            // Sort by ID ascending (oldest first)
            filteredData.sort((a, b) => a.id - b.id);
            
            setSliders(filteredData);
            setTotalPages(Math.ceil(response.data.data.total / response.data.data.per_page));
            setCurrentPage(response.data.data.current_page);
        } catch (error) {
            toast.error('Failed to fetch sliders');
        } finally {
            setLoading(false);
        }
    };

    // Update useEffect to include statusFilter
    useEffect(() => {
        fetchSliders(currentPage, searchQuery);
    }, [currentPage, searchQuery, statusFilter]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Show confirmation alert
        setAlertConfig({
            isOpen: true,
            title: 'Confirm Submission',
            message: `Are you sure you want to ${selectedSlider ? 'update' : 'create'} this slider?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    const formPayload = new FormData();
                    formPayload.append('judul', formData.judul);
                    formPayload.append('status', formData.status ? 1 : 0);
                    if (formData.image) {
                        formPayload.append('image', formData.image);
                    }
    
                    let response;
                    if (selectedSlider) {
                        response = await apiService.sliders.update(selectedSlider.id, formPayload);
                    } else {
                        response = await apiService.sliders.create(formPayload);
                    }
    
                    if (response.data.success) {
                        setAlertConfig({
                            isOpen: true,
                            title: 'Success',
                            message: response.data.message,
                            type: 'info',
                            onConfirm: () => {
                                setIsModalOpen(false);
                                setSelectedSlider(null);
                                setFormData({ judul: '', image: null, status: true });
                                fetchSliders(currentPage);
                                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                            }
                        });
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error) {
                    setAlertConfig({
                        isOpen: true,
                        title: 'Error',
                        message: error.response?.data?.message || 'Failed to save slider',
                        type: 'danger',
                        onConfirm: () => {
                            setAlertConfig(prev => ({ ...prev, isOpen: false }));
                        }
                    });
                }
            },
            onCancel: () => {
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
                setIsModalOpen(true); // Keep modal open on cancel
            }
        });
    };

    // Handle status toggle
    const handleStatusToggle = (id, currentStatus) => {
        setAlertConfig({
            isOpen: true,
            title: 'Update Status',
            message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this slider?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await apiService.sliders.updateStatus(id);
                    fetchSliders(currentPage);
                    toast.success('Status updated successfully');
                } catch (error) {
                    toast.error('Failed to update status');
                }
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Handle delete
    const handleDelete = (id) => {
        setAlertConfig({
            isOpen: true,
            title: 'Delete Slider',
            message: 'Are you sure you want to delete this slider?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await apiService.sliders.delete(id);
                    toast.success('Slider deleted successfully');
                    fetchSliders(currentPage);
                } catch (error) {
                    toast.error('Failed to delete slider');
                }
                setAlertConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const ImageDisplay = ({ src, alt }) => {
        const [error, setError] = useState(false);
        
        if (!src || error) {
            return (
                <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                </div>
            );
        }
        
        return (
            <div className="w-32 h-24 relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain bg-white p-1"
                    onError={() => setError(true)}
                />
            </div>
        );
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


    return (
        <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {/* Enhanced Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold mb-4 md:mb-0">
                    Slider Management
                </h1>
                <button
                    onClick={() => {
                        setSelectedSlider(null);
                        setFormData({ judul: '', image: null, status: true });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <FiPlus /> Add New Slider
                </button>
            </div>

            {/* Enhanced Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search sliders..."
                    className={`w-full px-4 py-3 rounded-lg ${
                        isDarkMode 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-white text-gray-800'
                    } border focus:ring-2 focus:ring-blue-500 transition-all`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg ${
                        isDarkMode 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-white text-gray-800'
                    } border focus:ring-2 focus:ring-blue-500 transition-all`}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Enhanced Table with Loading State */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Image</th>
                                <th className="px-6 py-4 text-left font-semibold">Title</th>
                                <th className="px-6 py-4 text-left font-semibold">Status</th>
                                <th className="px-6 py-4 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sliders.map((slider) => (
                                <tr 
                                    key={slider.id} 
                                    className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                                >
                                    <td className="px-6 py-3">
                                        <div className="flex justify-start items-center">
                                            <ImageDisplay
                                                src={slider.image_url}
                                                alt={slider.judul}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {slider.judul || <span className="text-gray-400 italic">No Title</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleStatusToggle(slider.id, slider.status)}
                                            className={`px-4 py-2 rounded-full text-white transition-colors ${
                                                slider.status 
                                                    ? 'bg-green-500 hover:bg-green-600' 
                                                    : 'bg-red-500 hover:bg-red-600'
                                            }`}
                                        >
                                            {slider.status ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => {
                                                    setViewData(slider);
                                                    setIsViewModalOpen(true);
                                                }}
                                                className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 transition-colors"
                                            >
                                                <FiEye />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSlider(slider);
                                                    setFormData({
                                                        judul: slider.judul,
                                                        status: slider.status,
                                                        image: null
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slider.id)}
                                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Enhanced Pagination */}
            <div className="mt-6 flex justify-center gap-2">
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`min-w-[40px] h-10 rounded-lg ${
                            currentPage === index + 1
                                ? 'bg-blue-600 text-white'
                                : isDarkMode
                                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } transition-colors`}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg w-full max-w-2xl mx-4`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">
                                {selectedSlider ? 'Edit Slider' : 'Add New Slider'}
                            </h2>
                            <button 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setImagePreview(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.judul}
                                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600' 
                                            : 'bg-white border-gray-300'
                                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                    placeholder="Enter slider title"
                                />
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Image</label>
                                <div className="space-y-4">
                                    {/* Image Preview */}
                                    <div className={`w-full h-48 rounded-lg border-2 border-dashed ${
                                        isDarkMode ? 'border-gray-600' : 'border-gray-300'
                                    } flex items-center justify-center overflow-hidden`}>
                                        {imagePreview || (selectedSlider && selectedSlider.image_url) ? (
                                            <div className="relative w-full h-full group">
                                                <img
                                                    src={imagePreview || selectedSlider.image_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImagePreview(null);
                                                            setFormData({ ...formData, image: null });
                                                        }}
                                                        className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <p className="mt-1 text-sm text-gray-500">Click or drag image here</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* File Input */}
                                    <input
                                        type="file"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                        id="image-upload"
                                        {...(!selectedSlider && { required: true })}
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer ${
                                            isDarkMode 
                                                ? 'bg-gray-700 hover:bg-gray-600' 
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        } transition-colors`}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Choose Image
                                    </label>
                                </div>
                            </div>

                            {/* Status Toggle */}
                            <div className="flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium">Active</span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setImagePreview(null);
                                    }}
                                    className={`px-4 py-2 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gray-700 hover:bg-gray-600' 
                                            : 'bg-gray-200 hover:bg-gray-300'
                                    } transition-colors`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {selectedSlider ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewModalOpen && viewData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg w-full max-w-3xl mx-4`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Slider Details</h2>
                            <button 
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setViewData(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Image Section */}
                            <div className="flex justify-center">
                                <div className="relative w-full max-w-lg aspect-video rounded-lg overflow-hidden shadow-lg">
                                    {viewData.image_url ? (
                                        <img
                                            src={viewData.image_url}
                                            alt={viewData.judul}
                                            className="w-full h-full object-contain bg-gray-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <span className="text-gray-400">No Image Available</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ID */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">ID</label>
                                    <p className="text-lg font-semibold">{viewData.id}</p>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Title</label>
                                    <p className="text-lg font-semibold">
                                        {viewData.judul || <span className="text-gray-400 italic">No Title</span>}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            viewData.status 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {viewData.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* Created At */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Created At</label>
                                    <p className="text-lg font-semibold">
                                        {new Date(viewData.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end mt-8">
                                <button
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        setViewData(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Alert
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />

        </div>
    );
};

export default Slider;
