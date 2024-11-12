import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CategoryCarousel = ({ categories, loading, itemsPerSlide = 6 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedSlides, setLoadedSlides] = useState(new Set([0]));
  const [touchStart, setTouchStart] = useState(null);
  const slideContainerRef = useRef(null);

  // Calculate total slides and items
  const totalItems = categories.length;
  const totalSlides = Math.ceil(totalItems / itemsPerSlide);
  const hasMultipleSlides = totalSlides > 1;
  const sortedCategories = [...categories].sort((a, b) => a.id - b.id);

  const getItemsForSlide = (slideIndex) => {
    const start = slideIndex * itemsPerSlide;
    const itemsForCurrentSlide = sortedCategories.slice(start, start + itemsPerSlide);
    
    // Fill remaining slots with items from the beginning if needed
    if (itemsForCurrentSlide.length < itemsPerSlide && sortedCategories.length > 0) {
      const remainingSlots = itemsPerSlide - itemsForCurrentSlide.length;
      const fillerItems = sortedCategories.slice(0, remainingSlots);
      return [...itemsForCurrentSlide, ...fillerItems];
    }
    
    return itemsForCurrentSlide;
  };

  // Touch handlers remain the same
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      handleSlideChange(diff > 0 ? 'next' : 'prev');
      setTouchStart(null);
    }
  };

  const handleSlideChange = (direction) => {
    if (isTransitioning) return;

    const nextSlide = direction === 'next'
      ? (currentSlide + 1) % totalSlides
      : (currentSlide - 1 + totalSlides) % totalSlides;

    setIsTransitioning(true);
    setLoadedSlides(prev => new Set([...prev, nextSlide]));
    setCurrentSlide(nextSlide);

    setTimeout(() => setIsTransitioning(false), 400);
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Shop by Category</h2>
        <Link 
          to="/categories" 
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 transition-colors"
        >
          View All 
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div 
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        ref={slideContainerRef}
      >
        {/* Adjusted height to be more compact */}
        <div className="relative h-[195px]"> {/* Reduced from 320px to 260px */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(itemsPerSlide)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-square mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : sortedCategories.length > 0 ? (
            [...Array(totalSlides)].map((_, slideIndex) => (
              loadedSlides.has(slideIndex) && (
                <div 
                  key={slideIndex} 
                  className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-transform duration-400 ease-in-out"
                  style={{ transform: `translateX(${(slideIndex - currentSlide) * 100}%)` }}
                >
                  {getItemsForSlide(slideIndex).map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.id}`}
                      className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-102"
                    >
                      <div className="aspect-square relative">
                        {category.image ? (
                          <img
                            src={`/storage/${category.image}`}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                        
                        {/* Optimized overlay with better spacing */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-x-0 bottom-0 p-3"> {/* Reduced padding */}
                          <div className="text-center">
                            <h3 className="text-white font-semibold text-base tracking-wide drop-shadow-lg">
                              {category.name}
                            </h3>
                            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                                Explore →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories available</p>
            </div>
          )}
        </div>

        {/* Navigation Arrows - Enhanced */}
        {hasMultipleSlides && !loading && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
            <button
              onClick={() => handleSlideChange('prev')}
              className={`pointer-events-auto p-3 rounded-full bg-white/95 text-gray-800 hover:bg-white
                       shadow-lg backdrop-blur-sm transform transition-all duration-300
                       ${currentSlide === 0 ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-4'}
                       hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isTransitioning}
              aria-label="Previous categories"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleSlideChange('next')}
              className={`pointer-events-auto p-3 rounded-full bg-white/95 text-gray-800 hover:bg-white
                       shadow-lg backdrop-blur-sm transform transition-all duration-300
                       ${currentSlide === totalSlides - 1 ? 'opacity-0 translate-x-full' : 'opacity-100 -translate-x-4'}
                       hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isTransitioning}
              aria-label="Next categories"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Enhanced Slide Indicators */}
        {hasMultipleSlides && !loading && (
          <div className="absolute -bottom-6 left-0 right-0 flex justify-center space-x-2">
            {[...Array(totalSlides)].map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning && index !== currentSlide) {
                    setLoadedSlides(prev => new Set([...prev, index]));
                    setCurrentSlide(index);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 
                  ${index === currentSlide 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400 w-2'}`}
                disabled={isTransitioning}
                aria-label={`Go to category slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCarousel;
