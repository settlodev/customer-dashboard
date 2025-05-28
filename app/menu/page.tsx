'use client';
import React, { useState, useEffect, useRef } from 'react';
import { locationMenuDetails, menuProducts } from '@/lib/actions/product-actions';
import { Product } from '@/types/product/type';
import Header from '@/components/site/Header';
import CategoryMenu from '@/components/site/CategoryMenu';
import LoadingStates from '@/components/site/LoadingStates';
import ProductGrid from '@/components/site/ProductGrid';
import Footer from '@/components/site/Footer';
import MobileMenu from '@/components/site/MobileMenu';
import ScrollToTop from '@/components/site/ScrollToTop';
import { businessTypes, CategorizedProducts, ExtendedProduct,} from '@/types/site/type';
import { LocationDetails } from '@/types/menu/type';

const ProductMenu = () => {
  // State Management
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageLimit] = useState(50);
  const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProducts>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [productsInitialLoad, setProductsInitialLoad] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [businessType, setBusinessType] = useState(businessTypes.default);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Separate location/business loading states
  const [locationLoading, setLocationLoading] = useState(true);
  const [, setLocation] = useState<LocationDetails | null>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null); // Start with null instead of default
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isBusinessDataReady, setIsBusinessDataReady] = useState(false);

  // Get locationId from URL parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const locationParam = urlParams.get('locationId');
      if (locationParam) {
        setLocationId(locationParam);
       
      } else {
        // If no URL params, set error state
        setLocationError("Missing location or business ID");
        setLocationLoading(false);
      }
    }
  }, []);

  // Fetch location data first - this is critical for business info
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!locationId) {
        setLocationLoading(false);
        return;
      }

      try {
        setLocationLoading(true);
        setLocationError(null); // Clear previous errors
        
        const locationData = await locationMenuDetails(locationId);
       
      
       
        setLocation(locationData);
        
        // Map API response to business info structure
        const updatedBusinessInfo = {
          name: locationData.businessName || "",
          tagline: locationData.tagline || "",
          logo: locationData.businessLogo || "",
          phone: locationData.businessPhone || "",
          email: locationData.businessEmailAddress || "",
          address: locationData.locationAddress || "",
          hours: `${locationData.locationOpeningHours || ""} - ${locationData.locationClosingHours || ""}`.trim(),
         
          socials: {
            instagram: locationData.locationSocials?.instagram || "#",
            facebook: locationData.locationSocials?.facebook || "#",
            twitter: locationData.locationSocials?.twitter || "#"
          },
          businessType: locationData.businessType || "default"
        };
        
        setBusinessInfo(updatedBusinessInfo);
        
        // Set business type if it exists in your enum
        if (locationData.businessType && businessTypes[locationData.businessType as unknown as keyof typeof businessTypes]) {
          setBusinessType(businessTypes[locationData.businessType as unknown as keyof typeof businessTypes]);
        }
        
        setIsBusinessDataReady(true);
        
      } catch (err) {
        console.error("Error fetching location data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch location details";
        setLocationError(errorMessage);
        setIsBusinessDataReady(false);
      } finally {
        setLocationLoading(false);
      }
    };

    fetchLocationData();
  }, [locationId]);

  // Only start loading products after business data is ready
  useEffect(() => {
    if (isBusinessDataReady && productsInitialLoad && locationId) {
      fetchProducts(true);
      setProductsInitialLoad(false);
    }
  }, [isBusinessDataReady, productsInitialLoad, locationId]);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !productsLoading && isBusinessDataReady) {
          setCurrentPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, productsLoading, isBusinessDataReady]);

  // Fetch products when page changes
  useEffect(() => {
    if (!productsInitialLoad && currentPage > 1 && isBusinessDataReady) {
      fetchProducts(false);
    }
  }, [currentPage, isBusinessDataReady]);

  // Handle search changes - only after business data is ready
  useEffect(() => {
    if (!productsInitialLoad && locationId && isBusinessDataReady) {
      handleSearch();
    }
  }, [searchQuery, locationId, isBusinessDataReady]);

  const fetchProducts = async (isReset: boolean) => {
    if (!isBusinessDataReady) return; // Don't fetch products until business info is loaded
    
    try {
      setProductsLoading(true);
      setProductsError(null);
      const pageToFetch = isReset ? 1 : currentPage;
      
      const response = await menuProducts(searchQuery, pageToFetch, pageLimit, locationId ?? '');
      
      if (response && response.content) {
        const typedContent = response.content.map((product: Product) => product as ExtendedProduct);
        
        let hasMoreItems = false;
        if (response.pageable) {
          hasMoreItems = response.pageable.pageNumber < response.totalPages - 1;
        } else if (response.totalPages) {
          hasMoreItems = pageToFetch < response.totalPages;
        } else {
          hasMoreItems = typedContent.length === pageLimit;
        }
        setHasMore(hasMoreItems);
        
        if (isReset) {
          setProducts(typedContent);
        } else {
          setProducts(prev => [...prev, ...typedContent]);
        }
        
        updateProductCategories(isReset ? typedContent : [...products, ...typedContent]);
      } else if (response && response.data) {
        if (isReset) {
          setProducts(response.data);
        } else {
          setProducts(prev => [...prev, ...response.data]);
        }
        
        const hasMoreItems = response.totalPages ? pageToFetch < response.totalPages : response.data.length === pageLimit;
        setHasMore(hasMoreItems);
        
        updateProductCategories(isReset ? response.data : [...products, ...response.data]);
      }
      
      setProductsLoading(false);
    } catch (err) {
      setProductsError('Failed to fetch products');
      setProductsLoading(false);
      console.error('Error fetching products:', err);
    }
  };

  const updateProductCategories = (productsList: ExtendedProduct[]) => {
    const grouped: { [key: string]: Product[] } = {};
    productsList.forEach(product => {
      const categoryName = product.categoryName || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(product as Product);
    });
    
    setCategorizedProducts(grouped);
    if (!selectedCategory && Object.keys(grouped).length > 0) {
      setSelectedCategory(Object.keys(grouped)[0]);
    }
  };

  const handleSearch = () => {
    if (!isBusinessDataReady) return;
    setCurrentPage(1);
    fetchProducts(true);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setIsMenuOpen(false);
    const element = document.getElementById(category.toLowerCase().replace(/\s+/g, '-'));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: ExtendedProduct) => {
    setCartCount(prev => prev + 1);
    alert(`Added ${product.name} to cart`);
  };

  const handleAddToWishlist = (product: ExtendedProduct) => {
    setWishlistCount(prev => prev + 1);
    alert(`Added ${product.name} to wishlist`);
  };

  // Show loading screen while fetching critical business data
  if (locationLoading || !businessInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Business Information</h2>
          <p className="text-gray-600">Please wait while we fetch the business details...</p>
        </div>
      </div>
    );
  }

  // Show error if business data failed to load
  if (locationError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Business</h2>
          <p className="text-gray-600 mb-4">{locationError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        businessInfo={businessInfo}
        businessType={businessType}
        isMobile={isMobile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        setIsMenuOpen={setIsMenuOpen}
        isMenuOpen={isMenuOpen}
      />

      <main className="flex-grow">
        <CategoryMenu
          categorizedProducts={categorizedProducts}
          selectedCategory={selectedCategory}
          handleCategoryClick={handleCategoryClick}
          businessType={businessType}
        />

        <div className="max-w-6xl mx-auto p-4 pt-6">
          {/* Show products loading state while business info is already displayed */}
          <LoadingStates
            initialLoad={productsInitialLoad}
            loading={productsLoading}
            error={productsError}
            categorizedProducts={categorizedProducts}
            businessType={businessType}
            onRetry={() => fetchProducts(true)}
          />

          {!productsInitialLoad && !productsError && (
            <ProductGrid
              categorizedProducts={categorizedProducts}
              selectedCategory={selectedCategory}
              businessType={businessType}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
            />
          )}

          <div ref={loaderRef} className="w-full py-8 flex justify-center">
            {!productsInitialLoad && productsLoading && (
              <div className="flex flex-col items-center">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${businessType.accent} mb-2`}></div>
                <p className="text-gray-500 text-sm">Loading more products...</p>
              </div>
            )}
            
            {!productsLoading && !hasMore && products.length > 0 && (
              <div className="text-gray-500 text-sm py-2">You&apos;ve reached the end</div>
            )}
          </div>
        </div>
      </main>

      <Footer businessInfo={businessInfo} businessType={businessType} />

      <MobileMenu
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        businessInfo={businessInfo}
        businessType={businessType}
        categorizedProducts={categorizedProducts}
        selectedCategory={selectedCategory}
        handleCategoryClick={handleCategoryClick}
      />

      <ScrollToTop
        showScrollToTop={showScrollToTop}
        handleScrollToTop={handleScrollToTop}
        businessType={businessType}
      />
    </div>
  );
};

export default ProductMenu;