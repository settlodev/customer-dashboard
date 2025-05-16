
'use client';
import { searchProducts } from '@/lib/actions/product-actions';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Search, 
  Tag, 
  X, 
  QrCode, 
  Share2, 
  Printer, 
  Download,
  Info
} from 'lucide-react';
import { Product } from '@/types/product/type';
import { QRCodeSVG } from 'qrcode.react';

type CategorizedProducts = {
  [key: string]: Product[];
};

const categoryColors = {
  backgrounds: [
    'bg-[#0088FE]',
    'bg-[#00C49F]',
    'bg-[#FFBB28]',
    'bg-[#FF8042]',
    'bg-[#8884D8]',
  ],
  text: [
    'text-[#FFF]',
  ],
  accent: [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ]
};

interface ExtendedProduct extends Omit<Product, 'categoryName'> {
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  price?: string | number;
  categoryName: string;
}

// QR Code Modal Component
const QRCodeModal = ({ isOpen, onClose, url, restaurantName }: { isOpen: boolean, onClose: () => void, url: string, restaurantName: string }) => {
  if (!isOpen) return null;
  
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${restaurantName.replace(/\s+/g, '-').toLowerCase()}-menu-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };
  
  const printQRCode = () => {
    const printWindow = window.open('', '', 'height=500,width=500');
    const canvas = document.getElementById('qr-code-canvas');
    
    if (printWindow && canvas) {
      printWindow.document.write('<html><head><title>Print QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div style="text-align: center; padding: 20px;">');
      printWindow.document.write(`<h2 style="margin-bottom: 10px;">${restaurantName} Menu</h2>`);
      printWindow.document.write(`<p style="margin-bottom: 20px;">Scan to view our menu</p>`);
      if (canvas instanceof HTMLCanvasElement) {
        printWindow.document.write(`<img src="${canvas.toDataURL()}" style="max-width: 300px;" />`);
      }
      printWindow.document.write('</div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      
      // Add slight delay to ensure content is fully loaded before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName} Menu`,
          text: `Check out the menu for ${restaurantName}`,
          url: url
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">{restaurantName} Menu</h3>
          <p className="text-sm text-gray-600 mb-4">Scan this QR code to view our menu</p>
          
          <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-4">
            <QRCodeSVG 
              id="qr-code-canvas"
              value={url} 
              size={200}
              level="H"
              includeMargin={true}
              
            />
          </div>
          
          <div className="flex justify-center space-x-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="flex items-center gap-1"
            >
              <Download size={16} />
              <span>Download</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={printQRCode}
              className="flex items-center gap-1"
            >
              <Printer size={16} />
              <span>Print</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={shareQRCode}
              className="flex items-center gap-1"
            >
              <Share2 size={16} />
              <span>Share</span>
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-center">
            <Info size={12} className="mr-1" />
            <span>This QR code links directly to your digital menu</span>
          </div>
        </div>
      </div>
    </div>
  );
};
// Professional Banner Component
const MenuBanner = ({ restaurantName, tagline, logo, openQRModal }: { restaurantName: string; tagline: string; logo: string | null; openQRModal: () => void }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          {logo ? (
            <img 
              src={logo} 
              alt={`${restaurantName} logo`} 
              className="w-16 h-16 rounded-full bg-white p-1 mr-4" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-emerald-700 font-bold text-xl mr-4">
              {restaurantName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{restaurantName}</h1>
            <p className="text-emerald-100">{tagline}</p>
          </div>
        </div>
        
        <Button 
          onClick={openQRModal}
          variant="secondary" 
          className="bg-white text-emerald-700 hover:bg-emerald-50"
        >
          <QrCode className="mr-2 h-5 w-5" />
          <span>Get Menu QR Code</span>
        </Button>
      </div>
    </div>
  );
};

const ProductMenu = () => {
    const [products, setProducts] = useState<ExtendedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [pageLimit] = useState(50); 
    const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProducts>({});
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [showQRModal, setShowQRModal] = useState(false);
    
    // Restaurant configuration - customize these values
    const restaurantConfig = {
      name: "Culinary Delights",
      tagline: "Authentic flavors, exceptional experience",
      logo: null, // Add your logo URL here
      currency: "TZS"
    };
    
    const loaderRef = useRef<HTMLDivElement>(null);
    
    // Check if device is mobile
    useEffect(() => {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }, []);
  
    // Initial data load
    useEffect(() => {
      if (initialLoad) {
        fetchProducts(true);
        setInitialLoad(false);
      }
    }, [initialLoad]);
  
    // Set up intersection observer for infinite scroll
    useEffect(() => {
      const observer = new IntersectionObserver(
        entries => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !loading) {
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
    }, [hasMore, loading]);
  
    // Fetch products when page changes or search is performed
    useEffect(() => {
      if (!initialLoad && currentPage > 1) {
        fetchProducts(false);
      }
    }, [currentPage]);
  
    // Handle search changes
    useEffect(() => {
      if (!initialLoad) {
        handleSearch();
      }
    }, [searchQuery]);
  
    const fetchProducts = async (isReset: boolean) => {
      try {
        setLoading(true);
        const pageToFetch = isReset ? 1 : currentPage;
        
        const response = await searchProducts(searchQuery, pageToFetch, pageLimit);
       
        
        if (response && response.content) {
          // Add some demo flags for featured/popular products to enhance UI
          const typedContent = response.content.map((product: Product) => {
            const extendedProduct = product as ExtendedProduct;
            return extendedProduct;
          });
          
          // Determine if there are more pages
          let hasMoreItems = false;
          if (response.pageable) {
            hasMoreItems = response.pageable.pageNumber < response.totalPages - 1;
          } else if (response.totalPages) {
            hasMoreItems = pageToFetch < response.totalPages;
          } else {
            hasMoreItems = typedContent.length === pageLimit;
          }
          setHasMore(hasMoreItems);
          
          // Update products - either reset or append
          if (isReset) {
            setProducts(typedContent);
          } else {
            setProducts(prev => [...prev, ...typedContent]);
          }
          
          // Process products into categories
          updateProductCategories(isReset ? typedContent : [...products, ...typedContent]);
        } else if (response && response.data) {
          // Alternative API response format
          if (isReset) {
            setProducts(response.data);
          } else {
            setProducts(prev => [...prev, ...response.data]);
          }
          
          // Determine if there are more pages
          const hasMoreItems = response.totalPages ? pageToFetch < response.totalPages : response.data.length === pageLimit;
          setHasMore(hasMoreItems);
          
          // Process products into categories
          updateProductCategories(isReset ? response.data : [...products, ...response.data]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products');
        setLoading(false);
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
  
    const getCategoryColorIndex = (category: string) => {
      // Generate a consistent index based on the category name
      const hash = category.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      return Math.abs(hash) % categoryColors.backgrounds.length;
    };
  
    const getBgColorForCategory = (category: string) => {
      const index = getCategoryColorIndex(category);
      return categoryColors.backgrounds[index];
    };
  
    const getTextColorForCategory = (category: string) => {
      const index = getCategoryColorIndex(category);
      return categoryColors.text[index];
    };
    
    const getProductPrice = (product: ExtendedProduct) => {
      // First try to get price from the first variant if available
      if (product.variants && product.variants.length > 0) {
        return parseFloat(product.variants[0].price as unknown as string) || 0;
      }
      // Fall back to product's price property
      return parseFloat(product.price as string) || 0;
    };
    
    // Generate the current page URL for QR code
    const getMenuUrl = () => {
      if (typeof window !== 'undefined') {
        return window.location.href;
      }
      return '';
    };
    
    // Open QR Code modal
    const openQRModal = () => {
      setShowQRModal(true);
    };
    
    // Close QR Code modal
    const closeQRModal = () => {
      setShowQRModal(false);
    };
  
    return (
      <div className="max-w-6xl mx-auto p-4 mt-8">
        {/* Restaurant Banner with QR Code Button */}
        <MenuBanner 
          restaurantName={restaurantConfig.name}
          tagline={restaurantConfig.tagline}
          logo={restaurantConfig.logo}
          openQRModal={openQRModal}
        />
        
        {/* QR Code Modal */}
        <QRCodeModal 
          isOpen={showQRModal} 
          onClose={closeQRModal} 
          url={getMenuUrl()}
          restaurantName={restaurantConfig.name}
        />
        
        {/* Search and Action Bar */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6 sticky top-0 z-20">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-grow">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="default" className="bg-emerald-600 hover:bg-emerald-700 w-full">
                Search
              </Button>
            </div>
          </div>
        </div>
  
        {/* Categories Horizontal Scrollable Menu */}
        <div className="bg-white shadow-md rounded-lg p-2 mb-6 sticky top-20 z-10">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 py-1">
              {Object.keys(categorizedProducts).map(category => (
                <Button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`px-6 py-4 min-w-24 h-14 flex items-center justify-center ${
                    selectedCategory === category 
                      ? `${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`
                      : "hover:bg-gray-100"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        
        {/* Initial Loading State */}
        {initialLoad && loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="text-center py-16 bg-red-50 rounded-lg">
            <div className="text-red-500 text-xl mb-2">😕</div>
            <p className="text-red-500">{error}</p>
            <Button onClick={() => fetchProducts(true)} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        )}
        
        {/* No Products State */}
        {!initialLoad && !loading && !error && Object.keys(categorizedProducts).length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-4xl mb-2">🔍</div>
            <p className="text-gray-600 mb-2">No menu items found</p>
            <p className="text-gray-500 text-sm">Try a different search term or browse our categories</p>
          </div>
        )}
        
        {/* Products Display */}
        {!initialLoad && !error && (
          <div>
            {Object.keys(categorizedProducts).map(category => (
              <div 
                key={category} 
                id={category.toLowerCase().replace(/\s+/g, '-')}
                className={`mb-12 ${selectedCategory === category ? 'scroll-mt-32' : ''}`}
              >
                {/* Category Header */}
                <div className={`rounded-lg p-4 mb-4 flex items-center gap-2 ${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`}>
                  <div className="flex-1">
                    <h2 className="text-xl font-normal">{category}</h2>
                  </div>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categorizedProducts[category].map(product => {
                    const extendedProduct = product as ExtendedProduct;
                    return (
                      <Card 
                        key={`${product.id}-${product.name}`} 
                        className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">No image</span>
                            </div>
                          )}
                          
                          {/* Optional badges for featured or new items */}
                          {extendedProduct.isNew && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>
                            </div>
                          )}
                          {extendedProduct.isFeatured && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
                            </div>
                          )}
                        </div>
                        
                        <CardHeader className="p-4 pb-0">
                          <h3 className="font-medium text-center truncate">{product.name}</h3>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-xl font-bold">
                              {getProductPrice(extendedProduct).toLocaleString()} <span className="text-sm font-normal text-gray-500">{restaurantConfig.currency}</span>
                            </p>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="hidden lg:flex p-3 pt-0 justify-center">
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {extendedProduct.categoryName}
                          </Badge>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Loading More Indicator (bottom of page) */}
        <div ref={loaderRef} className="w-full py-8 flex justify-center">
          {!initialLoad && loading && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
              <p className="text-gray-500 text-sm">Loading more items...</p>
            </div>
          )}
          
          {!loading && !hasMore && products.length > 0 && (
            <div className="text-gray-500 text-sm py-2">You&apos;ve reached the end</div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-white rounded-lg shadow-md p-4 text-center mt-8">
          <p className="text-gray-600">© {new Date().getFullYear()} {restaurantConfig.name}</p>
          <div className="text-sm text-gray-500 mt-1">
            <p>Scan the QR code to view our menu on your device</p>
          </div>
          <div className="flex justify-center mt-3">
            <Button 
              onClick={openQRModal}
              variant="outline" 
              size="sm"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
            >
              <QrCode className="mr-2 h-4 w-4" />
              <span>Get Menu QR Code</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Category Menu */}
        {isMobile && isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end">
            <div className="bg-white w-2/3 h-full overflow-auto p-4 animate-slide-in-right">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Categories</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {Object.keys(categorizedProducts).map(category => (
                  <Button
                    key={`mobile-${category}`}
                    onClick={() => handleCategoryClick(category)}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`w-full justify-start ${
                      selectedCategory === category 
                        ? `${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`
                        : ""
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export default ProductMenu;