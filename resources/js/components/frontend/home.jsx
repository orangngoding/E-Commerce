import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../utils/axios';
import Navbar from './navbar';
import CategoryCarousel from './frontend-component/CategoryCarousel';


const Home = () => {
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('next');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slidersRes = await apiService.sliders.getActive();
        const transformedSliders = slidersRes.data.data.map(slider => ({
          ...slider,
          image_url: slider.image_url || null
        }));
        setSliders(transformedSliders);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };


    fetchData();
  }, []);


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


  useEffect(() => {
    if (sliders.length <= 1) return;
  
    const slideTimer = setInterval(() => {
      setDirection('next');
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 10000); // Change every 5 seconds
  
    return () => clearInterval(slideTimer);
  }, [sliders.length]);


  const handleSlideChange = (newIndex) => {
    if (isTransitioning) return;
    
    const nextIndex = typeof newIndex === 'function' ? newIndex(currentSlide) : newIndex;
    const newDirection = nextIndex > currentSlide ? 'next' : 'prev';
    
    setDirection(newDirection);
    setIsTransitioning(true);
    setCurrentSlide(nextIndex);


    // Reset transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Reduced to 400ms for snappier transitions
  };


  const SliderImage = ({ slider, isActive, direction, isTransitioning }) => {
    const [hasAnimated, setHasAnimated] = useState(false);
  
    useEffect(() => {
      let animationTimer;
      if (isActive && !isTransitioning) {
        setHasAnimated(false);
        animationTimer = setTimeout(() => {
          setHasAnimated(true);
        }, 50);
      }
      return () => clearTimeout(animationTimer);
    }, [isActive, isTransitioning]);
  
    const getTitleClass = () => {
      const baseClasses = 'text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4';
      return isActive && !isTransitioning && hasAnimated ? `${baseClasses} animate-fadeIn` : baseClasses;
    };  
  
    const getSlideClass = () => {
      if (!isActive && !isTransitioning) return 'hidden';
      
      const baseClasses = 'absolute w-full h-full transition-transform duration-500 ease-in-out';
      
      if (isActive) {
        return `${baseClasses} translate-x-0`;
      }
  
      return direction === 'next'
        ? `${baseClasses} translate-x-full`
        : `${baseClasses} -translate-x-full`;
    };  
  
    return (
      <div className={getSlideClass()}>
        <div className="relative w-full h-full">
          <img
            src={slider.image_url}
            alt={slider.judul || 'Slider Image'}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
            <div className="container mx-auto h-full flex items-center justify-center px-6">
              <div className="max-w-3xl text-center">
                <h2 className={getTitleClass()}>
                  {slider.judul || 'Welcome to Our Store'}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };  


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }


  return ( 
    <div className="min-h-screen bg-gray-50">
        
      {/* Navbar */}
      <Navbar />


            {/* Hero Slider */}
            <div className="relative h-[500px] md:h-[600px] lg:h-[700px] mt-16 overflow-hidden">
            {sliders.length > 0 ? (
                <>
                <div className="relative w-full h-full">
                    {sliders.map((slider, index) => (
                    <SliderImage
                        key={slider.id}
                        slider={slider}
                        isActive={index === currentSlide}
                        direction={direction}
                        isTransitioning={isTransitioning}
                    />
                    ))}
                </div>


                {/* Enhanced Navigation Dots */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
                    {sliders.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleSlideChange(index)}
                        className={`h-2 rounded-full transition-all duration-300 
                        ${index === currentSlide 
                            ? 'bg-white w-8' 
                            : 'bg-white/50 hover:bg-white/75 w-2'}`}
                        disabled={isTransitioning}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                    ))}
                </div>


                {/* Enhanced Navigation Arrows */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 md:px-8">
                    <button
                    onClick={() => handleSlideChange((currentSlide - 1 + sliders.length) % sliders.length)}
                    className="p-2 md:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 
                            transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isTransitioning}
                    aria-label="Previous slide"
                    >
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    </button>
                    <button
                    onClick={() => handleSlideChange((currentSlide + 1) % sliders.length)}
                    className="p-2 md:p-3 rounded-full bg-black/30 text-white hover:bg-black/50 
                            transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isTransitioning}
                    aria-label="Next slide"
                    >
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    </button>
                </div>
                </>
            ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Sliders Available</span>
                </div>
            )}
            </div>


      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <CategoryCarousel 
          categories={categories}
          loading={categoriesLoading}
          itemsPerSlide={6}
        />
      </div>


      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
        </div>
      </div>
    </div>
  );
};


export default Home;