import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const Slider = () => {
    const { isDarkMode } = useOutletContext();
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlider, setSelectedSlider] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState({
        judul: '',
        image: null,
        status: true
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
        try {
            const formPayload = new FormData();
            formPayload.append('judul', formData.judul);
            formPayload.append('status', formData.status ? 1 : 0); // Convert boolean to integer
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
                toast.success(response.data.message);
                setIsModalOpen(false);
                setSelectedSlider(null);
                setFormData({ judul: '', image: null, status: true });
                await fetchSliders(currentPage);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Failed to save slider');
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (id) => {
        try {
            await apiService.sliders.updateStatus(id);
            fetchSliders(currentPage);
            toast.success('Status updated successfully');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this slider?')) {
            try {
                await apiService.sliders.delete(id);
                toast.success('Slider deleted successfully');
                fetchSliders(currentPage);
            } catch (error) {
                toast.error('Failed to delete slider');
            }
        }
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
                                    <td className="px-6 py-4 font-medium">{slider.judul}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleStatusToggle(slider.id)}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg w-full max-w-md`}>
                        <h2 className="text-xl font-bold mb-4">
                            {selectedSlider ? 'Edit Slider' : 'Add New Slider'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.judul}
                                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                                    className={`w-full px-3 py-2 rounded ${
                                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Image</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                    className="w-full"
                                    accept="image/*"
                                    {...(!selectedSlider && { required: true })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded bg-gray-500 text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-blue-600 text-white"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Slider;
