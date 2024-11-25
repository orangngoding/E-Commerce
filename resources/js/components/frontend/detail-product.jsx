import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import Navbar from './frontend-component/navbar';
import CategoryCarousel from './frontend-component/CategoryCarousel';
import Swal from 'sweetalert2';

const DetailProduct = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [availableVariants, setAvailableVariants] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('customerToken');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiService.products.getPublished(id);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          console.error('Error:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
}, [id]);

useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.kategoris.getActive();
        const activeCategories = response.data.data.data.filter(category => category.status);
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
  
    fetchCategories();
  }, []);

  const hasVariants = () => {
    return product?.variants && product.variants.length > 0;
  };

  // Helper function to check if product has standalone sizes
  const hasStandaloneSizes = () => {
    return product?.sizes && product.sizes.length > 0;
  };

  // Helper function to check if product has standalone colors
  const hasStandaloneColors = () => {
    return product?.colors && product.colors.length > 0;
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    const basePrice = parseFloat(product.price) || 0;
    let totalPrice = basePrice;
    
    if (selectedVariant) {
      totalPrice += parseFloat(selectedVariant.additional_price) || 0;
    } else {
      if (selectedSize) {
        totalPrice += parseFloat(selectedSize.pivot.additional_price) || 0;
      }
      if (selectedColor) {
        totalPrice += parseFloat(selectedColor.pivot.additional_price) || 0;
      }
    }
    
    return totalPrice * quantity;
  };
  
  // Update the formatPrice function to handle numeric values more robustly
  const formatPrice = (price) => {
    // Ensure price is a valid number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericPrice);
  };

  const getAvailableStock = () => {
    if (!product) return 0;
    
    if (selectedVariant) {
      return selectedVariant.stock;
    }
    
    if (selectedSize && selectedColor) {
      const variant = product.variants?.find(
        v => v.size_id === selectedSize.id && v.color_id === selectedColor.id
      );
      return variant?.stock || 0;
    }
    
    if (selectedSize) {
      return selectedSize.pivot.stock;
    }
    
    if (selectedColor) {
      return selectedColor.pivot.stock;
    }
    
    return product.stock;
  };

  const handleSizeSelect = (size) => {
    if (selectedSize?.id === size.id) {
      setSelectedSize(null); // Deselect if clicking the same size
    } else {
      setSelectedSize(size);
    }
    setQuantity(1); // Reset quantity when changing size
  };

  const handleVariantSelect = (variant) => {
    if (selectedVariant?.id === variant.id) {
      setSelectedVariant(null);
      setSelectedSize(null);
      setSelectedColor(null);
    } else {
      setSelectedVariant(variant);
      setSelectedSize(variant.size);
      setSelectedColor(variant.color);
    }
    setQuantity(1);
  };
  

  // Handle color selection
  const handleColorSelect = (color) => {
    if (selectedColor?.id === color.id) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
    setSelectedVariant(null);
    setQuantity(1);
  };

  const renderSizeOptions = () => {
    if (!hasStandaloneSizes() && !hasVariants()) return null;

    return (
      <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Size</h3>
          <div className="grid grid-cols-3 gap-3">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSizeSelect(size)}
                disabled={size.pivot.stock === 0}
                className={`p-4 rounded-lg border-2 transition-all duration-300
                  ${selectedSize?.id === size.id
                    ? 'border-blue-500 bg-blue-50 shadow-md transform -translate-y-1'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow'}
                  ${size.pivot.stock === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : 'hover:bg-blue-50'}`}
              >
                <div className="text-base font-semibold">{size.name}</div>
                {size.pivot.additional_price > 0 && (
                  <div className="text-sm text-blue-600 font-medium mt-1">
                    +{formatPrice(size.pivot.additional_price)}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Stock: {size.pivot.stock}
                </div>
              </button>
            ))}
          </div>
        </div>
    );
  };

  const renderColorOptions = () => {
    if (!hasStandaloneColors() && !hasVariants()) return null;
  
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Color</h3>
        <div className="grid grid-cols-3 gap-4">
          {product.colors.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorSelect(color)}
              disabled={color.pivot?.stock === 0}
              className={`relative p-3 rounded-lg border-2 transition-all duration-300
                ${selectedColor?.id === color.id
                  ? 'border-blue-500 bg-blue-50 shadow-sm transform -translate-y-1'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                ${color.pivot?.stock === 0
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:bg-blue-50'}`}
            >
              <div className="flex items-center space-x-3">
                {/* Smaller Color Swatch */}
                <div 
                  className="w-5 h-5 rounded-full border-2 border-gray-200 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color.hex_code }}
                />
                
                {/* Color Info */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">{color.name}</div>
                </div>
              </div>
  
              {/* Price and Stock - More Compact */}
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                {color.pivot?.additional_price > 0 && (
                  <div className="text-blue-600 font-medium">
                    +{formatPrice(color.pivot.additional_price)}
                  </div>
                )}
                <div className="text-gray-500">
                  Stock: {color.pivot?.stock || 0}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };
  

  // Add this section to render variants
  const renderVariants = () => {
    if (!hasVariants()) return null;
  
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Size & Color</h3>
        <div className="grid grid-cols-2 gap-4">
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => handleVariantSelect(variant)}
              disabled={variant.stock === 0}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300
                ${selectedVariant?.id === variant.id
                  ? 'border-blue-500 bg-blue-50 shadow-md transform -translate-y-1'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow'}
                ${variant.stock === 0
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:bg-blue-50'}`}
            >
              <div className="flex flex-col space-y-3">
                {/* Size Badge */}
                <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 w-fit">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M6 6h12M6 12h12m-12 6h12" />
                  </svg>
                  <span className="text-sm font-medium">{variant.size?.name}</span>
                </div>
  
                {/* Color Display */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-inner"
                      style={{ backgroundColor: variant.color?.hex_code }}
                    />
                    <span className="text-sm font-medium">{variant.color?.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{variant.color?.hex_code}</span>
                </div>
  
                {/* Price and Stock Info */}
                <div className="flex justify-between items-center mt-2">
                  {variant.additional_price > 0 && (
                    <div className="flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm font-semibold">
                        {formatPrice(variant.additional_price)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm">Stock: {variant.stock}</span>
                  </div>
                </div>
              </div>
  
              {/* Selected Indicator */}
              {selectedVariant?.id === variant.id && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <p className="text-gray-500">Product not found</p>
        </div>
      </div>
    );
  }


  // Add this new function to handle checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please login to proceed with checkout',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Cancel',
        customClass: {
          container: 'font-sans',
          title: 'text-xl font-bold text-gray-900',
          content: 'text-base text-gray-600',
          confirmButton: 'font-semibold',
          cancelButton: 'font-semibold'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/customer/login', { 
            state: { 
              returnUrl: `/detail-product/${id}`,
              message: 'Please login to complete your purchase' 
            } 
          });
        }
      });
      return;
    }

    // If authenticated, proceed with checkout
    navigate('/checkout', {
      state: {
        product: {
          ...product,
          selectedSize,
          quantity,
          totalPrice: calculateTotalPrice()
        }
      }
    });
};



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Page Title Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 mt-16">
          <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
          <nav className="mt-2">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>Home</li>
              <li>•</li>
              <li>{product?.kategori?.name}</li>
              <li>•</li>
              <li className="text-blue-600">{product?.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md mb-6">
              <img
                src={`/storage/${currentImage || product?.primary_image?.image}`}
                alt={product?.name}
                className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
              />
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {product?.images?.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImage(image.image)}
                  className={`aspect-square rounded-lg overflow-hidden shadow hover:shadow-lg
                    ${currentImage === image.image 
                      ? 'ring-2 ring-blue-500 scale-105' 
                      : 'hover:scale-105'}`}
                >
                  <img
                    src={`/storage/${image.image}`}
                    alt={`${product.name} view`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Card */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">{product?.name}</h2>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {product?.kategori?.name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${getAvailableStock() > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'}`}>
                    {getAvailableStock() > 0 ? `${getAvailableStock()} in stock` : 'Out of Stock'}
                  </span>
                </div>
                <div className="prose max-w-none text-gray-600">
                  <p className="text-lg leading-relaxed">{product?.description}</p>
                </div>
              </div>
            </div>

            {/* Price and Options Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Stock Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Stock:</span>
                    <span className="font-semibold text-gray-900">{getAvailableStock()} units</span>
                  </div>
                </div>
              </div>

              {/* Render options based on availability */}
              {hasStandaloneSizes() && renderSizeOptions()}
              {hasStandaloneColors() && renderColorOptions()}
              {hasVariants() && renderVariants()}

              {/* Quantity Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center space-x-6 bg-gray-50 rounded-lg p-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 
                      transition-colors duration-300 shadow-sm"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-2xl font-semibold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(getAvailableStock(), quantity + 1))}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 
                      transition-colors duration-300 shadow-sm"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Base Price</p>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(product?.price)}
                    </span>
                  </div>
                  
                  {(selectedVariant || selectedSize || selectedColor) && (
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-gray-500">Additional Price</p>
                      <span className="text-lg font-semibold text-blue-600">
                        +{formatPrice(
                          selectedVariant?.additional_price ||
                          (selectedSize?.pivot?.additional_price || 0) +
                          (selectedColor?.pivot?.additional_price || 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Price ({quantity} items)</p>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatPrice(calculateTotalPrice())}
                      </span>
                    </div>
                    {selectedSize && (
                      <div className="text-sm text-gray-500">
                        Selected Size: <span className="font-semibold text-gray-900">{selectedSize.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    disabled={getAvailableStock() === 0}
                    className="w-full py-4 px-8 rounded-lg bg-blue-600 text-white font-semibold
                      hover:bg-blue-700 transform transition-all duration-300 hover:-translate-y-1
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                      shadow-lg hover:shadow-xl"
                  >
                    Add to Cart
                  </button>
                  <button
                        disabled={getAvailableStock() === 0}
                        onClick={handleCheckout}
                        className="w-full py-4 px-8 rounded-lg bg-green-600 text-white font-semibold
                        hover:bg-green-700 transform transition-all duration-300 hover:-translate-y-1
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        shadow-lg hover:shadow-xl"
                    >
                        Buy Now
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <CategoryCarousel 
          categories={categories}
          loading={categoriesLoading}
          itemsPerSlide={6}
        />
      </div>
    </div>
  );
};

export default DetailProduct;