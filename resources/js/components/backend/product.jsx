import React, { useState, useEffect, useCallback } from 'react';;
import { useOutletContext } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import Alert from '../../common/alert';
import { debounce } from 'lodash';


const DEBOUNCE_DELAY = 500; // 500ms delay

const Product = () => {
    const { isDarkMode } = useOutletContext();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [formMode, setFormMode] = useState('create');
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [imagesToRemove, setImagesToRemove] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        kategori_id: '',
        name: '',
        description: '',
        price: '',
        stock: '',
        images: [],
        status: 'draft',
        existingPrimaryId: '',
        newPrimaryImageIndex: -1, // For tracking selected primary image in new uploads
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        kategori_id: '',
        in_stock: false
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0
    });

    const [alert, setAlert] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => {},
        onCancel: () => {}
    });

    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (searchTerm) => {
            setIsSearching(true);
            setPagination(prev => ({ ...prev, currentPage: 1 }));
            setSearchQuery(searchTerm);
            setIsSearching(false);
        }, DEBOUNCE_DELAY),
        []
    );

    const handleSearchChange = (e) => {
        const searchTerm = e.target.value;
        debouncedSearch(searchTerm);
    };

    // Fetch products and categories
    useEffect(() => {
        fetchProducts();
    }, [searchQuery, filters, pagination.currentPage]);
    
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let response;
    
            if (searchQuery) {
                response = await apiService.products.search(searchQuery);
            } else {
                const queryParams = {
                    page: pagination.currentPage,
                    status: filters.status || undefined,
                    kategori_id: filters.kategori_id || undefined,
                    in_stock: filters.in_stock || undefined
                };
    
                Object.keys(queryParams).forEach(key => 
                    queryParams[key] === undefined && delete queryParams[key]
                );
    
                response = await apiService.products.list(queryParams);
            }
            
            if (response?.data?.data) {
                const { data: productData } = response.data;
                
                // Sort products by ID in ascending order (oldest first)
                const sortedProducts = [...productData.data].sort((a, b) => a.id - b.id);
                
                setProducts(sortedProducts);
                setPagination({
                    currentPage: productData.current_page,
                    lastPage: productData.last_page,
                    perPage: productData.per_page,
                    total: productData.total
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setPagination({
                currentPage: 1,
                lastPage: 1,
                perPage: 10,
                total: 0
            });
        } finally {
            setLoading(false);
        }
    };    

    const fetchCategories = async () => {
        try {
            const response = await apiService.kategoris.list();
            // Filter to only show active categories
            const activeCategories = response.data.data.data.filter(category => category.status);
            setCategories(activeCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setAlert({
            isOpen: true,
            title: formMode === 'create' ? 'Create Product' : 'Update Product',
            message: `Are you sure you want to ${formMode === 'create' ? 'create' : 'update'} this product?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    // Validate primary image selection
                    const hasImages = formData.images.length > 0 || 
                        (selectedProduct?.images?.length > 0 && imagesToRemove.length < selectedProduct.images.length);
                    
                    const hasPrimaryImage = formData.newPrimaryImageIndex !== -1 || formData.existingPrimaryId;
                    
                    // Auto-select primary image if needed
                    if (hasImages && !hasPrimaryImage) {
                        if (formData.images.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                newPrimaryImageIndex: 0,
                                existingPrimaryId: null
                            }));
                        } else {
                            const firstAvailableImage = selectedProduct?.images?.find(
                                img => !imagesToRemove.includes(img.id)
                            );
                            if (firstAvailableImage) {
                                setFormData(prev => ({
                                    ...prev,
                                    newPrimaryImageIndex: -1,
                                    existingPrimaryId: firstAvailableImage.id
                                }));
                            }
                        }
                    }
    
                    const formDataObj = new FormData();
                    
                    // Append basic form data
                    Object.keys(formData).forEach(key => {
                        if (!['images', 'newPrimaryImageIndex', 'existingPrimaryId'].includes(key) && formData[key] !== null) {
                            formDataObj.append(key, formData[key]);
                        }
                    });
    
                    // Handle new images
                    if (formData.images.length > 0) {
                        formData.images.forEach((img, index) => {
                            formDataObj.append('images[]', img);
                            formDataObj.append(`is_primary[${index}]`, 
                                formData.newPrimaryImageIndex === index ? '1' : '0'
                            );
                        });
                    }
    
                    // Handle existing images in edit mode
                    if (formMode === 'edit' && selectedProduct?.images) {
                        // Add images to remove
                        if (imagesToRemove.length > 0) {
                            formDataObj.append('images_to_remove', JSON.stringify(imagesToRemove));
                        }
    
                        // Handle existing images' primary status
                        const existingImagesData = {};
                        selectedProduct.images.forEach(img => {
                            // Only include images that are not marked for removal
                            if (!imagesToRemove.includes(img.id)) {
                                existingImagesData[img.id] = img.id === formData.existingPrimaryId ? '1' : '0';
                            }
                        });
                        
                        // Only append if there are remaining images
                        if (Object.keys(existingImagesData).length > 0) {
                            formDataObj.append('existing_images', JSON.stringify(existingImagesData));
                        }
                    }
    
                    let response;
                    if (formMode === 'create') {
                        response = await apiService.products.create(formDataObj);
                    } else {
                        response = await apiService.products.update(selectedProduct.id, formDataObj);
                    }
    
                    setAlert({
                        isOpen: true,
                        title: 'Success',
                        message: `Product ${formMode === 'create' ? 'created' : 'updated'} successfully!`,
                        type: 'info',
                        onConfirm: () => {
                            setAlert(prev => ({ ...prev, isOpen: false }));
                            setModalOpen(false);
                            resetForm();
                            fetchProducts();
                        },
                        onCancel: () => setAlert(prev => ({ ...prev, isOpen: false }))
                    });
                } catch (error) {
                    setAlert({
                        isOpen: true,
                        title: 'Error',
                        message: `Failed to ${formMode} product: ${error.message}`,
                        type: 'danger',
                        onConfirm: () => setAlert(prev => ({ ...prev, isOpen: false })),
                        onCancel: () => setAlert(prev => ({ ...prev, isOpen: false }))
                    });
                }
            },
            onCancel: () => setAlert(prev => ({ ...prev, isOpen: false }))
        });
    };
    


    const handleView = (product) => {
        setViewProduct(product);
        setViewModalOpen(true);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setFormData({
            kategori_id: product.kategori_id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            status: product.status,
            images: [], // New images to upload
            newPrimaryImageIndex: -1, // For new images
            existingPrimaryId: product.images.find(img => img.is_primary)?.id || null // Track existing primary
        });
        setImagesToRemove([]);
        setFormMode('edit');
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        setAlert({
            isOpen: true,
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await apiService.products.delete(id);
                    setAlert({
                        isOpen: true,
                        title: 'Success',
                        message: 'Product deleted successfully!',
                        type: 'info',
                        onConfirm: () => {
                            setAlert({ ...alert, isOpen: false });
                            fetchProducts();
                        },
                        onCancel: () => setAlert({ ...alert, isOpen: false })
                    });
                } catch (error) {
                    setAlert({
                        isOpen: true,
                        title: 'Error',
                        message: `Failed to delete product: ${error.message}`,
                        type: 'danger',
                        onConfirm: () => setAlert({ ...alert, isOpen: false }),
                        onCancel: () => setAlert({ ...alert, isOpen: false })
                    });
                }
            },
            onCancel: () => setAlert({ ...alert, isOpen: false })
        });
    };

    const handleStatusToggle = async (product) => {
        const newStatus = product.status === 'published' ? 'draft' : 'published';
        
        setAlert({
            isOpen: true,
            title: 'Update Status',
            message: `Are you sure you want to change the status to ${newStatus}?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await apiService.products.updateStatus(product.id, newStatus);
                    
                    // Update products list
                    setProducts(products.map(p => 
                        p.id === product.id 
                            ? { ...p, status: newStatus }
                            : p
                    ));
                    
                    // Update view modal if open
                    if (viewProduct && viewProduct.id === product.id) {
                        setViewProduct({ ...viewProduct, status: newStatus });
                    }
                    
                    setAlert({
                        isOpen: true,
                        title: 'Success',
                        message: 'Product status updated successfully!',
                        type: 'info',
                        onConfirm: () => setAlert(prev => ({ ...prev, isOpen: false })),
                        onCancel: () => setAlert(prev => ({ ...prev, isOpen: false }))
                    });
                } catch (error) {
                    setAlert({
                        isOpen: true,
                        title: 'Error',
                        message: `Failed to update status: ${error.message}`,
                        type: 'danger',
                        onConfirm: () => setAlert(prev => ({ ...prev, isOpen: false })),
                        onCancel: () => setAlert(prev => ({ ...prev, isOpen: false }))
                    });
                }
            },
            onCancel: () => setAlert(prev => ({ ...prev, isOpen: false }))
        });
    };    

    const resetForm = () => {
        setFormData({
            kategori_id: '',
            name: '',
            description: '',
            price: '',
            stock: '',
            images: [],
            status: 'draft'
        });
        setSelectedProduct(null);
        setFormMode('create');
    };

    return (
        <>
        <div className={`container mx-auto px-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Products Management</h1>
                <button
                    onClick={() => {
                        resetForm();
                        setModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Add New Product
                </button>
            </div>

            {/* Filters */}
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search products..."
                        onChange={handleSearchChange}
                        className={`rounded-lg px-4 py-2 ${
                            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                        }`}
                    />
                    <select
                        value={filters.kategori_id}
                        onChange={(e) => setFilters({ ...filters, kategori_id: e.target.value })}
                        className={`rounded-lg px-4 py-2 ${
                            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                        }`}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className={`rounded-lg px-4 py-2 ${
                            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                        }`}
                    >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="inStock"
                            checked={filters.in_stock}
                            onChange={(e) => setFilters({ ...filters, in_stock: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="inStock">In Stock Only</label>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {loading || isSearching ? (
                <div className="text-center py-4">
                    {isSearching ? 'Searching products...' : 'Loading products...'}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-4">
                    {searchQuery ? `No products found for "${searchQuery}"` : 'No products found'}
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.primary_image ? (
                                        <img
                                            src={`/storage/${product.primary_image.image}`}
                                            alt={product.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-400 italic">No image</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{product.kategori?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">${product.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.status === 'published' ? (
                                        product.stock ?? <span className="text-gray-400 italic">No stock</span>
                                    ) : (
                                        <span className="text-gray-400 italic">Draft</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleStatusToggle(product)}
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors duration-200 ${
                                            product.status === 'published'
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                        }`}
                                    >
                                        {product.status}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleView(product)}
                                        className="text-green-600 hover:text-green-900 mr-4"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop with blur effect */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                    
                    {/* Modal Container with smooth animation */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div 
                            className={`
                                relative w-full max-w-4xl max-h-[90vh] overflow-hidden 
                                ${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
                                rounded-xl shadow-2xl transform transition-all duration-300 ease-out
                            `}
                        >
                            {/* Modal Header */}
                            <div className={`
                                sticky top-0 z-10 px-6 py-4 border-b 
                                ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}
                            `}>
                                <h2 className="text-2xl font-bold">
                                    {formMode === 'create' ? 'Add New Product' : 'Edit Product'}
                                </h2>
                            </div>

                            {/* Modal Body with Scroll */}
                            <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
                                <div className="px-6 py-4">
                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-6">
                                            {/* Form Grid Layout */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Category Field */}
                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-2">Category</label>
                                                    <select
                                                        value={formData.kategori_id}
                                                        onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                                                        className={`
                                                            w-full rounded-lg px-4 py-2.5 border transition-colors
                                                            ${isDarkMode 
                                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                                                                : 'bg-gray-50 border-gray-300 focus:border-blue-600'}
                                                        `}
                                                        required
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(category => (
                                                            <option 
                                                                key={category.id} 
                                                                value={category.id}
                                                                disabled={!category.status} // Disable inactive categories as fallback
                                                            >
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Name Field */}
                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-2">Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className={`
                                                            w-full rounded-lg px-4 py-2.5 border transition-colors
                                                            ${isDarkMode 
                                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                                                                : 'bg-gray-50 border-gray-300 focus:border-blue-600'}
                                                        `}
                                                        required
                                                    />
                                                </div>

                                                {/* Description Field */}
                                                <div className="col-span-full">
                                                    <label className="block text-sm font-medium mb-2">Description</label>
                                                    <textarea
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        className={`
                                                            w-full rounded-lg px-4 py-2.5 border transition-colors
                                                            ${isDarkMode 
                                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                                                                : 'bg-gray-50 border-gray-300 focus:border-blue-600'}
                                                        `}
                                                        rows="4"
                                                        required
                                                    />
                                                </div>

                                                {/* Price Field */}
                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-2">Price</label>
                                                    <input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        className={`
                                                            w-full rounded-lg px-4 py-2.5 border transition-colors
                                                            ${isDarkMode 
                                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                                                                : 'bg-gray-50 border-gray-300 focus:border-blue-600'}
                                                        `}
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </div>

                                                {/* Stock Field - Conditional Rendering */}
                                                {formData.status === 'published' && (
                                                    <div className="form-group">
                                                        <label className="block text-sm font-medium mb-2">Stock</label>
                                                        <input
                                                            type="number"
                                                            value={formData.stock}
                                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                            className={`
                                                                w-full rounded-lg px-4 py-2.5 border transition-colors
                                                                ${isDarkMode 
                                                                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                                                                    : 'bg-gray-50 border-gray-300 focus:border-blue-600'}
                                                            `}
                                                            min="0"
                                                            required
                                                        />
                                                    </div>
                                                )}

                                                {/* Status Field */}
                                                <div className="form-group">
                                                    <label className="block text-sm font-medium mb-2">Status</label>
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                        className={`
                                                            w-full rounded-lg px-4 py-2.5 border transition-colors
                                                            ${isDarkMode 
                                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                                                                : 'bg-gray-50 border-gray-300 focus:border-blue-600'}
                                                        `}
                                                        required
                                                    >
                                                        <option value="published">Published</option>
                                                        <option value="draft">Draft</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Image Upload Section */}
                                            <div className="col-span-full space-y-4">
                                                <label className="block text-sm font-medium mb-2">Product Images</label>
                                                
                                                {/* Drop Zone */}
                                                <div 
                                                    className={`
                                                        border-2 border-dashed rounded-lg p-6 transition-colors
                                                        ${isDarkMode 
                                                            ? 'border-gray-600 hover:border-gray-500' 
                                                            : 'border-gray-300 hover:border-gray-400'}
                                                    `}
                                                    onClick={() => document.getElementById('image-input').click()}
                                                >
                                                   <input
                                                        id="image-input"
                                                        type="file"
                                                        onChange={(e) => {
                                                            const newFiles = Array.from(e.target.files);
                                                            setFormData(prev => {
                                                                // If this is the first and only image being added (no existing images)
                                                                const shouldAutoSetPrimary = 
                                                                    newFiles.length === 1 && 
                                                                    prev.images.length === 0 && 
                                                                    !prev.existingPrimaryId;

                                                                return {
                                                                    ...prev,
                                                                    images: [...prev.images, ...newFiles],
                                                                    // Automatically set as primary if it's the only image
                                                                    newPrimaryImageIndex: shouldAutoSetPrimary ? prev.images.length : prev.newPrimaryImageIndex
                                                                };
                                                            });
                                                        }}
                                                        className="hidden"
                                                        accept="image/*"
                                                        multiple
                                                    />
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                                            />
                                                        </svg>
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-500">Drop images here or click to select</p>
                                                            <p className="text-xs text-gray-400 mt-1">Supports multiple images</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Image Preview Grid */}
                                                {(formData.images.length > 0 || (formMode === 'edit' && selectedProduct?.images?.length > 0)) && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                                        {/* New Images */}
                                                        {formData.images.map((img, idx) => (
                                                        <div key={`new-${idx}`} className="relative group">
                                                            <div className="aspect-square rounded-lg overflow-hidden">
                                                                <img
                                                                    src={URL.createObjectURL(img)}
                                                                    alt={`Preview ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                {formData.newPrimaryImageIndex === idx && !formData.existingPrimaryId && (
                                                                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                                                                        Primary
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        // Set this new image as primary and clear existing primary
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            newPrimaryImageIndex: idx,
                                                                            existingPrimaryId: null
                                                                        }));
                                                                    }}
                                                                    className={`p-2 rounded-full ${
                                                                        formData.newPrimaryImageIndex === idx && !formData.existingPrimaryId
                                                                            ? 'bg-green-500'
                                                                            : 'bg-blue-500 hover:bg-blue-600'
                                                                    } text-white transition-colors`}
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newImages = formData.images.filter((_, i) => i !== idx);
                                                                        setFormData(prev => {
                                                                            // If removing the primary image and there's only one image left
                                                                            const shouldAutoSetNewPrimary = 
                                                                                prev.newPrimaryImageIndex === idx && 
                                                                                newImages.length === 1 && 
                                                                                !prev.existingPrimaryId;

                                                                            return {
                                                                                ...prev,
                                                                                images: newImages,
                                                                                newPrimaryImageIndex: shouldAutoSetNewPrimary 
                                                                                    ? 0 // Set the remaining image as primary
                                                                                    : prev.newPrimaryImageIndex === idx
                                                                                        ? -1
                                                                                        : prev.newPrimaryImageIndex > idx
                                                                                            ? prev.newPrimaryImageIndex - 1
                                                                                            : prev.newPrimaryImageIndex
                                                                            };
                                                                        });
                                                                    }}
                                                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Existing Images in Edit Mode */}
                                                    {formMode === 'edit' && selectedProduct?.images?.map((img) => (
                                                        !imagesToRemove.includes(img.id) && (
                                                            <div key={`existing-${img.id}`} className="relative group">
                                                                <div className="aspect-square rounded-lg overflow-hidden">
                                                                    <img
                                                                        src={`/storage/${img.image}`}
                                                                        alt="Product"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {formData.existingPrimaryId === img.id && (
                                                                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                                                                            Primary
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            // Set this image as primary and clear any new image primary selection
                                                                            setFormData(prev => ({
                                                                                ...prev,
                                                                                existingPrimaryId: img.id,
                                                                                newPrimaryImageIndex: -1
                                                                            }));
                                                                        }}
                                                                        className={`p-2 rounded-full ${
                                                                            formData.existingPrimaryId === img.id
                                                                                ? 'bg-green-500'
                                                                                : 'bg-blue-500 hover:bg-blue-600'
                                                                        } text-white transition-colors`}
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setImagesToRemove([...imagesToRemove, img.id]);
                                                                            
                                                                            // Count remaining existing images (not marked for removal)
                                                                            const remainingExistingImages = selectedProduct.images.filter(
                                                                                existingImg => !imagesToRemove.includes(existingImg.id) && existingImg.id !== img.id
                                                                            );
                                                                            
                                                                            // Count new images
                                                                            const totalNewImages = formData.images.length;
                                                                            
                                                                            // If removing primary image
                                                                            if (formData.existingPrimaryId === img.id) {
                                                                                setFormData(prev => {
                                                                                    // If there's exactly one remaining image (either existing or new)
                                                                                    if (remainingExistingImages.length === 1 && totalNewImages === 0) {
                                                                                        // Set the remaining existing image as primary
                                                                                        return {
                                                                                            ...prev,
                                                                                            existingPrimaryId: remainingExistingImages[0].id,
                                                                                            newPrimaryImageIndex: -1
                                                                                        };
                                                                                    } else if (remainingExistingImages.length === 0 && totalNewImages === 1) {
                                                                                        // Set the only new image as primary
                                                                                        return {
                                                                                            ...prev,
                                                                                            existingPrimaryId: null,
                                                                                            newPrimaryImageIndex: 0
                                                                                        };
                                                                                    } else {
                                                                                        // Clear primary if there are multiple or no images
                                                                                        return {
                                                                                            ...prev,
                                                                                            existingPrimaryId: null,
                                                                                            newPrimaryImageIndex: -1
                                                                                        };
                                                                                    }
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Modal Footer - Fixed at bottom */}
                                        <div className={`
                                            sticky bottom-0 left-0 right-0 
                                            mt-6 px-6 py-4 border-t flex justify-end space-x-3
                                            ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}
                                        `}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setModalOpen(false);
                                                    resetForm();
                                                }}
                                                className={`
                                                    px-4 py-2 rounded-lg border transition-colors
                                                    ${isDarkMode 
                                                        ? 'border-gray-600 hover:bg-gray-700' 
                                                        : 'border-gray-300 hover:bg-gray-100'}
                                                `}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            >
                                                {formMode === 'create' ? 'Create Product' : 'Update Product'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* View Modal */}
            {viewModalOpen && viewProduct && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop with blur effect */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    
                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className={`
                            relative w-full max-w-5xl max-h-[90vh] overflow-hidden 
                            ${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
                            rounded-xl shadow-2xl
                        `}>
                            {/* Modal Header */}
                            <div className={`
                                sticky top-0 z-10 px-6 py-4 border-b flex justify-between items-center
                                ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}
                            `}>
                                <h2 className="text-2xl font-bold">Product Details</h2>
                                <button 
                                    onClick={() => setViewModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body with Scroll */}
                            <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Image Gallery Section */}
                                        <div className="space-y-4">
                                            {viewProduct.images && viewProduct.images.length > 0 ? (
                                                <div className="space-y-4">
                                                    {/* Primary Image - Larger Display */}
                                                    {viewProduct.images.find(img => img.is_primary) && (
                                                        <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                                                            <img
                                                                src={`/storage/${viewProduct.images.find(img => img.is_primary).image}`}
                                                                alt={viewProduct.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                                Primary Image
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Additional Images Grid */}
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {viewProduct.images
                                                            .filter(img => !img.is_primary)
                                                            .map((img, idx) => (
                                                                <div 
                                                                    key={idx} 
                                                                    className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                                                >
                                                                    <img
                                                                        src={`/storage/${img.image}`}
                                                                        alt={`${viewProduct.name} ${idx + 1}`}
                                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                                            />
                                                        </svg>
                                                        <p className="mt-2 text-gray-500 dark:text-gray-400">No images available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details Section */}
                                        <div className="space-y-6">
                                            {/* Product Header */}
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold">{viewProduct.name}</h3>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        viewProduct.status === 'published'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                                    }`}>
                                                        {viewProduct.status}
                                                    </span>
                                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        ${Number(viewProduct.price).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Product Info Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h4>
                                                        <p className="mt-1 font-medium">{viewProduct.kategori?.name || 'N/A'}</p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock Status</h4>
                                                        {viewProduct.status === 'published' ? (
                                                            <div className="mt-1 flex items-center space-x-2">
                                                                <span className={`w-3 h-3 rounded-full ${
                                                                    Number(viewProduct.stock) > 0 ? 'bg-green-500' : 'bg-red-500'
                                                                }`}></span>
                                                                <span className="font-medium">
                                                                    {Number(viewProduct.stock) > 0 ? `${viewProduct.stock} units` : 'Out of stock'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className="mt-1 text-gray-400 italic">Draft</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h4>
                                                        <p className="mt-1">{new Date(viewProduct.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h4>
                                                        <p className="mt-1">{new Date(viewProduct.updated_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h4>
                                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                                    {viewProduct.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`
                                sticky bottom-0 left-0 right-0 
                                px-6 py-4 border-t flex justify-end space-x-3
                                ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}
                            `}>
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        <div className="mt-4 flex justify-center">
                {pagination.lastPage > 1 && (
                    <div className="flex space-x-2">
                        {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded ${
                                    pagination.currentPage === page
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
                )}
            </div>

            {/* Show total items count */}
            <div className="mt-2 text-center text-sm">
                Total items: {pagination.total}
            </div>

                </div>

                
                <Alert
                    isOpen={alert.isOpen}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    onConfirm={alert.onConfirm}
                    onCancel={alert.onCancel}
                />

                </>
            );
};

export default Product;
