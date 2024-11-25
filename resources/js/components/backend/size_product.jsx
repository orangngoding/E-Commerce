import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import { toast } from 'react-hot-toast';
import Select from 'react-select';

const SizeProduct = () => {
    const { isDarkMode } = useOutletContext();
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([])
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentSize, setCurrentSize] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        status: true,
        colors: []
    });

    // Fetch sizes
    const fetchSizes = async (search = '') => {
        try {
            setLoading(true);
            const params = { search };
            const response = await apiService.sizes.list(params);
            setSizes(response.data.data.data);
        } catch (error) {
            toast.error('Failed to fetch sizes');
        } finally {
            setLoading(false);
        }
    };

    const fetchColors = async () => {
        try {
            const response = await apiService.colors.getActive();
            setColors(response.data.data.map(color => ({
                value: color.id,
                label: color.name,
                color: color.hex_code
            })));
        } catch (error) {
            toast.error('Failed to fetch colors');
        }
    };


    useEffect(() => {
        fetchSizes();
        fetchColors();
    }, []);

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        fetchSizes(e.target.value);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentSize) {
                // Update flow - remains unchanged
                await apiService.sizes.update(currentSize.id, {
                    ...formData,
                    colors: JSON.stringify(formData.colors.map(c => c.value))
                });
                await apiService.sizes.manageColors(currentSize.id, 
                    formData.colors.map(c => c.value));
                toast.success('Size updated successfully');
            } else {
                // Create flow - modified
                const createData = {
                    name: formData.name,
                    status: formData.status,
                    colors: JSON.stringify(formData.colors.map(c => c.value))
                };
                
                const response = await apiService.sizes.create(createData);
                
                if (response.data.data.id && formData.colors.length > 0) {
                    await apiService.sizes.manageColors(
                        response.data.data.id,
                        formData.colors.map(c => c.value)
                    );
                }
                
                toast.success('Size created successfully');
            }
            
            setShowModal(false);
            fetchSizes();
            resetForm();
        } catch (error) {
            toast.error(error.message || 'Failed to save size');
        }
    };    

    // Handle status toggle
    const handleStatusToggle = async (id, currentStatus) => {
        try {
            await apiService.sizes.updateStatus(id, !currentStatus);
            toast.success('Status updated successfully');
            fetchSizes();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this size?')) {
            try {
                await apiService.sizes.delete(id);
                toast.success('Size deleted successfully');
                fetchSizes();
            } catch (error) {
                toast.error('Failed to delete size');
            }
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            status: true,
            colors: []
        });
        setCurrentSize(null);
    };

    // Edit size
    const handleEdit = async (size) => {
        try {
            const detailResponse = await apiService.sizes.get(size.id);
            const sizeDetail = detailResponse.data.data;
            
            setCurrentSize(sizeDetail);
            setFormData({
                name: sizeDetail.name,
                status: sizeDetail.status,
                colors: sizeDetail.colors.map(color => ({
                    value: color.id,
                    label: color.name,
                    color: color.hex_code
                }))
            });
            setShowModal(true);
        } catch (error) {
            toast.error('Failed to load size details');
        }
    };

    const customStyles = {
        control: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#374151' : 'white',
            borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: isDarkMode 
                ? state.isSelected ? '#4B5563' : '#374151'
                : state.isSelected ? '#E5E7EB' : 'white',
            color: isDarkMode ? 'white' : 'black',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: isDarkMode ? 'white' : 'black',
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#374151' : 'white',
        })
    };

    return (
        <div className={`container mx-auto px-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Size Management</h1>
                <div className="flex justify-between items-center">
                    <div className="w-1/3">
                        <input
                            type="text"
                            placeholder="Search sizes..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className={`w-full px-4 py-2 rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 text-white' 
                                    : 'bg-white text-gray-800'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add New Size
                    </button>
                </div>
            </div>

            {/* Size List */}
            <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <table className="min-w-full">
                    <thead>
                        <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Colors</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="text-center py-4">Loading...</td>
                            </tr>
                        ) : sizes.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-4">No sizes found</td>
                            </tr>
                        ) : (
                            sizes.map((size) => (
                                <tr key={size.id}>
                                    <td className="px-6 py-4">{size.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {size.colors?.map(color => (
                                                <span
                                                    key={color.id}
                                                    className="px-2 py-1 rounded-full text-xs"
                                                    style={{
                                                        backgroundColor: color.hex_code,
                                                        color: getContrastColor(color.hex_code)
                                                    }}
                                                >
                                                    {color.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleStatusToggle(size.id, size.status)}
                                            className={`px-3 py-1 rounded-full text-sm ${
                                                size.status
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {size.status ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(size)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(size.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-96`}>
                        <h2 className="text-xl font-bold mb-4">
                            {currentSize ? 'Edit Size' : 'Add New Size'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-3 py-2 rounded border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-800'
                                    }`}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Status</label>
                                <select
                                    value={formData.status.toString()}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                                    className={`w-full px-3 py-2 rounded border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-800'
                                    }`}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Colors</label>
                                <Select
                                    isMulti
                                    options={colors}
                                    value={formData.colors}
                                    onChange={(selectedOptions) => 
                                        setFormData({ ...formData, colors: selectedOptions || [] })}
                                    styles={customStyles}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {currentSize ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const getContrastColor = (hexcolor) => {
    // Convert hex to RGB
    const r = parseInt(hexcolor.slice(1,3), 16);
    const g = parseInt(hexcolor.slice(3,5), 16);
    const b = parseInt(hexcolor.slice(5,7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default SizeProduct;
