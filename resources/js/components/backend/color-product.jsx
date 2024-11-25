import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import { toast } from 'react-hot-toast';

const ColorProduct = () => {
    const { isDarkMode } = useOutletContext();
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        hex_code: '',
        status: true
    });

    // Fetch colors
    const fetchColors = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const params = {
                page,
                search: search.trim(), // Trim whitespace
                per_page: 10
            };
            
            const response = await apiService.colors.list(params);
            
            if (response.data.success) {
                setColors(response.data.data.data);
                setTotalPages(Math.ceil(response.data.data.total / response.data.data.per_page));
                setCurrentPage(response.data.data.current_page);
            } else {
                toast.error('Failed to fetch colors');
            }
        } catch (error) {
            toast.error('Error fetching colors: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };    

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchColors(1, searchQuery); // Reset to page 1 when searching
        }, 500); // 500ms debounce
    
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset page when searching
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedColor) {
                await apiService.colors.update(selectedColor.id, formData);
                toast.success('Color updated successfully');
            } else {
                await apiService.colors.create(formData);
                toast.success('Color created successfully');
            }
            setShowModal(false);
            fetchColors(currentPage, searchQuery);
            resetForm();
        } catch (error) {
            toast.error(error.message || 'Failed to save color');
        }
    };

    // Handle color deletion
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this color?')) {
            try {
                await apiService.colors.delete(id);
                toast.success('Color deleted successfully');
                fetchColors(currentPage, searchQuery);
            } catch (error) {
                toast.error('Failed to delete color');
            }
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (id, currentStatus) => {
        try {
            await apiService.colors.updateStatus(id, !currentStatus);
            toast.success('Status updated successfully');
            fetchColors(currentPage, searchQuery);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            hex_code: '',
            status: true
        });
        setSelectedColor(null);
    };

    return (
        <div className={`container mx-auto px-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Color Management</h1>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add New Color
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search colors..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className={`w-full px-4 py-2 rounded-lg ${
                        isDarkMode 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-white text-gray-800'
                    } border border-gray-300`}
                />
            </div>

            {/* Colors Table */}
            <div className="overflow-x-auto">
                <table className={`min-w-full ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-md rounded-lg`}>
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-6 py-3 text-left">Color</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {loading ? (
                            <tr>
                                <td colSpan="3" className="text-center py-4">Loading...</td>
                            </tr>
                        ) : colors.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-4">No color found</td>
                            </tr>
                        ) : (
                         colors.map((color) => (
                            <tr key={color.id} className={`border-b ${
                                isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                                <td className="px-6 py-4">{color.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div 
                                            className="w-6 h-6 rounded-full mr-2" 
                                            style={{ backgroundColor: color.hex_code }}
                                        />
                                        {color.hex_code}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleStatusToggle(color.id, color.status)}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            color.status 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {color.status ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setFormData({
                                                    name: color.name,
                                                    hex_code: color.hex_code,
                                                    status: color.status
                                                });
                                                setShowModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(color.id)}
                                            className="text-red-600 hover:text-red-800"
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
            <div className="mt-6 flex justify-center">
                <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : isDarkMode
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } p-6 rounded-lg w-full max-w-md`}>
                        <h2 className="text-xl font-bold mb-4">
                            {selectedColor ? 'Edit Color' : 'Add New Color'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className={`w-full px-3 py-2 rounded ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-800'
                                    } border border-gray-300`}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Color Code</label>
                                <input
                                    type="color"
                                    value={formData.hex_code}
                                    onChange={(e) => setFormData({...formData, hex_code: e.target.value})}
                                    className="w-full h-10 rounded cursor-pointer"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value === 'true'})}
                                    className={`w-full px-3 py-2 rounded ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-800'
                                    } border border-gray-300`}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {selectedColor ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorProduct;
