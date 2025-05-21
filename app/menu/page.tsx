// 'use client';
// import { menuProducts} from '@/lib/actions/product-actions';
// import React, { useState, useEffect, useRef } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';

// import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import { Search, ShoppingCartIcon, Tag, X } from 'lucide-react';
// import { Product } from '@/types/product/type';

// type CategorizedProducts = {
//   [key: string]: Product[];
// };

// // Enhanced color palette for categories
// const categoryColors = {
//   backgrounds: [
//     'bg-[#0088FE]',
//     'bg-[#00C49F]',
//     'bg-[#FFBB28]',
//     'bg-[#FF8042]',
//     'bg-[#8884D8]',
    
//   ],
//   text: [
//     'text-[#FFF]',
//   ],
//   accent: [
//     'bg-[#0088FE]',
//     'bg-[#00C49F]',
//     'bg-[#FFBB28]',
//     'bg-[#FF8042]',
//     'bg-[#8884D8]',
//   ]
// };

// interface ExtendedProduct extends Omit<Product, 'categoryName'> {
//   isNew?: boolean;
//   isPopular?: boolean;
//   isFeatured?: boolean;
//   price?: string | number;
//   categoryName: string;
// }

// const ProductMenu = () => {
//     const [products, setProducts] = useState<ExtendedProduct[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [hasMore, setHasMore] = useState(true);
//     const [pageLimit] = useState(50); 
//     const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProducts>({});
//     const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
//     const [isMobile, setIsMobile] = useState(false);
//     const [isMenuOpen, setIsMenuOpen] = useState(false);
//     const [initialLoad, setInitialLoad] = useState(true);
//     const [locationId, setLocationId] = useState<string | null>(null);
//     const loaderRef = useRef<HTMLDivElement>(null);
    

//     // Get locationId from URL parameters on component mount
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const urlParams = new URLSearchParams(window.location.search);
//       const locationParam = urlParams.get('locationId');
      
//       if (locationParam) {
//         setLocationId(locationParam);
//         // console.log('Location ID from QR code:', locationParam);
//       }
//     }
//   }, []);

//     // Check if device is mobile
//     useEffect(() => {
//       const checkIfMobile = () => {
//         setIsMobile(window.innerWidth < 768);
//       };
      
//       checkIfMobile();
//       window.addEventListener('resize', checkIfMobile);
      
//       return () => {
//         window.removeEventListener('resize', checkIfMobile);
//       };
//     }, []);
  
//     // Initial data load - now depends on locationId
//   useEffect(() => {
//     if (initialLoad && locationId !== null) { 
//       fetchProducts(true);
//       setInitialLoad(false);
//     }
//   }, [initialLoad, locationId]);
  
//     // Set up intersection observer for infinite scroll
//     useEffect(() => {
//       const observer = new IntersectionObserver(
//         entries => {
//           const [entry] = entries;
//           if (entry.isIntersecting && hasMore && !loading) {
//             setCurrentPage(prevPage => prevPage + 1);
//           }
//         },
//         { threshold: 0.1 }
//       );
  
//       if (loaderRef.current) {
//         observer.observe(loaderRef.current);
//       }
  
//       return () => {
//         if (loaderRef.current) {
//           observer.unobserve(loaderRef.current);
//         }
//       };
//     }, [hasMore, loading]);
  
//     // Fetch products when page changes or search is performed
//     useEffect(() => {
//       if (!initialLoad && currentPage > 1) {
//         fetchProducts(false);
//       }
//     }, [currentPage]);
  
//      // Handle search changes
//   useEffect(() => {
//     if (!initialLoad && locationId !== null) {
//       handleSearch();
//     }
//   }, [searchQuery, locationId]);
  
//     const fetchProducts = async (isReset: boolean) => {
//       try {
//         setLoading(true);
//         const pageToFetch = isReset ? 1 : currentPage;
        
//         const response = await menuProducts(searchQuery, pageToFetch, pageLimit, locationId ?? '');
        
//         if (response && response.content) {
//           // Add some demo flags for featured/popular products to enhance UI
//           const typedContent = response.content.map((product: Product) => {
//             const extendedProduct = product as ExtendedProduct;
//             return extendedProduct;
//           });
          
//           // Determine if there are more pages
//           let hasMoreItems = false;
//           if (response.pageable) {
//             hasMoreItems = response.pageable.pageNumber < response.totalPages - 1;
//           } else if (response.totalPages) {
//             hasMoreItems = pageToFetch < response.totalPages;
//           } else {
//             hasMoreItems = typedContent.length === pageLimit;
//           }
//           setHasMore(hasMoreItems);
          
//           // Update products - either reset or append
//           if (isReset) {
//             setProducts(typedContent);
//           } else {
//             setProducts(prev => [...prev, ...typedContent]);
//           }
          
//           // Process products into categories
//           updateProductCategories(isReset ? typedContent : [...products, ...typedContent]);
//         } else if (response && response.data) {
//           // Alternative API response format
//           if (isReset) {
//             setProducts(response.data);
//           } else {
//             setProducts(prev => [...prev, ...response.data]);
//           }
          
//           // Determine if there are more pages
//           const hasMoreItems = response.totalPages ? pageToFetch < response.totalPages : response.data.length === pageLimit;
//           setHasMore(hasMoreItems);
          
//           // Process products into categories
//           updateProductCategories(isReset ? response.data : [...products, ...response.data]);
//         }
        
//         setLoading(false);
//       } catch (err) {
//         setError('Failed to fetch products');
//         setLoading(false);
//         console.error('Error fetching products:', err);
//       }
//     };
  
//     const updateProductCategories = (productsList: ExtendedProduct[]) => {
//       const grouped: { [key: string]: Product[] } = {};
//       productsList.forEach(product => {
//         const categoryName = product.categoryName || 'Uncategorized';
//         if (!grouped[categoryName]) {
//           grouped[categoryName] = [];
//         }
//         grouped[categoryName].push(product as Product);
//       });
      
//       setCategorizedProducts(grouped);
//       if (!selectedCategory && Object.keys(grouped).length > 0) {
//         setSelectedCategory(Object.keys(grouped)[0]);
//       }
//     };
  
//     const handleSearch = () => {
//       setCurrentPage(1);
//       fetchProducts(true);
//     };
    
//     const handleCategoryClick = (category: string) => {
//       setSelectedCategory(category);
//       setIsMenuOpen(false);
//       const element = document.getElementById(category.toLowerCase().replace(/\s+/g, '-'));
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//       }
//     };
  
  
//     const getCategoryColorIndex = (category: string) => {
//       // Generate a consistent index based on the category name
//       const hash = category.split('').reduce((acc, char) => {
//         return char.charCodeAt(0) + ((acc << 5) - acc);
//       }, 0);
//       return Math.abs(hash) % categoryColors.backgrounds.length;
//     };
  
//     const getBgColorForCategory = (category: string) => {
//       const index = getCategoryColorIndex(category);
//       return categoryColors.backgrounds[index];
//     };
  
//     const getTextColorForCategory = (category: string) => {
//       const index = getCategoryColorIndex(category);
//       return categoryColors.text[index];
//     };
    
 
    
//     const getProductPrice = (product: ExtendedProduct) => {
//       // First try to get price from the first variant if available
//       if (product.variants && product.variants.length > 0) {
//         return parseFloat(product.variants[0].price as unknown as string) || 0;
//       }
//       // Fall back to product's price property
//       return parseFloat(product.price as string) || 0;
//     };
    
  
//     return (
//       <div className="max-w-6xl mx-auto p-4">

//          {/* header section with details of location such as name, address, logo, etc */}
//        <div className="bg-white shadow-md rounded-lg p-4 mb-6 sticky top-0 z-30">
//         <h2>Big Genge</h2>
//        </div>
        
//         <div className="bg-white shadow-md rounded-lg p-4 mb-6 sticky top-0 z-20">
//           <div className="flex flex-wrap items-center gap-2">
//             <div className="relative flex-grow">
//               <Input
//                 type="text"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 placeholder="Search products..."
//                 className="pr-10"
//               />
//               <div className="absolute inset-y-0 right-0 flex items-center pr-3">
//                 <Search className="h-4 w-4 text-gray-400" />
//               </div>
//             </div>
            
//             <div className="flex gap-2">
//               <Button onClick={handleSearch} variant="default" className="bg-emerald-600 hover:bg-emerald-700 w-full">
//                 Search
//               </Button>
//             </div>
//           </div>
//         </div>
  
//         {/* Categories Horizontal Scrollable Menu */}
//         <div className="bg-white shadow-md rounded-lg p-2 mb-6 sticky top-20 z-10">
//           <ScrollArea className="w-full whitespace-nowrap">
//             <div className="flex space-x-2 py-1">
//               {Object.keys(categorizedProducts).map(category => (
//                 <Button
//                   key={category}
//                   onClick={() => handleCategoryClick(category)}
//                   variant={selectedCategory === category ? "default" : "outline"}
//                   className={`px-6 py-4 min-w-24 h-14 flex items-center justify-center ${
//                     selectedCategory === category 
//                       ? `${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`
//                       : "hover:bg-gray-100"
//                   }`}
//                 >
//                   {category}
//                 </Button>
//               ))}
//             </div>
//             <ScrollBar orientation="horizontal" />
//           </ScrollArea>
//         </div>
        
//         {/* Initial Loading State */}
//         {initialLoad && loading && (
//           <div className="text-center py-16">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading products...</p>
//           </div>
//         )}
        
//         {/* Error State */}
//         {error && (
//           <div className="text-center py-16 bg-red-50 rounded-lg">
//             <div className="text-red-500 text-xl mb-2">😕</div>
//             <p className="text-red-500">{error}</p>
//             <Button onClick={() => fetchProducts(true)} variant="outline" className="mt-4">
//               Try Again
//             </Button>
//           </div>
//         )}
        
//         {/* No Products State */}
//         {!initialLoad && !loading && !error && Object.keys(categorizedProducts).length === 0 && (
//           <div className="text-center py-16 bg-gray-50 rounded-lg">
//             <div className="text-gray-400 text-4xl mb-2">🔍</div>
//             <p className="text-gray-600 mb-2">No products found</p>
//             <p className="text-gray-500 text-sm">Try a different search term or browse our categories</p>
//           </div>
//         )}
        
//         {/* Pull to Refresh Indicator (for mobile) */}
//         {isMobile && (
//           <div className="w-full flex justify-center mb-4">
//             <div className="text-gray-500 text-sm">Pull down to refresh</div>
//           </div>
//         )}
        
//         {/* Products Display */}
//         {!initialLoad && !error && (
//           <div>
//             {Object.keys(categorizedProducts).map(category => (
//               <div 
//                 key={category} 
//                 id={category.toLowerCase().replace(/\s+/g, '-')}
//                 className={`mb-12 ${selectedCategory === category ? 'scroll-mt-32' : ''}`}
//               >
//                 {/* Category Header */}
//                 <div className={`rounded-lg p-4 mb-4 flex items-center gap-2 ${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`}>
//                   <div className="flex-1">
//                     <h2 className="text-xl font-normal">{category}</h2>
//                   </div>
//                 </div>
                
//                 {/* Products Grid */}
//                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//                   {categorizedProducts[category].map(product => {
//                     const extendedProduct = product as ExtendedProduct;
//                     return (
//                       <Card 
//                         key={`${product.id}-${product.name}`} 
//                         className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
//                       >
//                         <div className="relative">
//                           {product.image ? (
//                             <img 
//                               src={product.image} 
//                               alt={product.name} 
//                               className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
//                             />
//                           ) : (
//                             // <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
//                             //   <span className="text-gray-500">No image</span>
//                             // </div>
//                             <div className="w-full h-48 rounded-lg bg-gray-200 flex items-center justify-center">
//                             <ShoppingCartIcon  className="w-12 h-12 text-gray-400" />
//                         </div>
//                           )}
//                         </div>
                        
//                         <CardHeader className="p-4 pb-0">
//                           <h3 className="font-medium text-center truncate">{product.name}</h3>
//                         </CardHeader>
                        
//                         <CardContent className="p-4 pt-2 text-center">
//                           <div className="flex items-center justify-center gap-2">
//                             <p className="text-xl font-bold">
//                               {getProductPrice(extendedProduct).toLocaleString()} <span className="text-sm font-normal text-gray-500">TZS</span>
//                             </p>
//                           </div>
//                         </CardContent>
                        
//                         <CardFooter className="hidden lg:flex p-3 pt-0 justify-center">
//                           <Badge variant="outline" className="px-2 py-1 text-xs">
//                             <Tag className="h-3 w-3 mr-1" />
//                             {extendedProduct.categoryName}
//                           </Badge>
//                         </CardFooter>
//                       </Card>
//                     );
//                   })}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
        
//         {/* Loading More Indicator (bottom of page) */}
//         <div ref={loaderRef} className="w-full py-8 flex justify-center">
//           {!initialLoad && loading && (
//             <div className="flex flex-col items-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
//               <p className="text-gray-500 text-sm">Loading more products...</p>
//             </div>
//           )}
          
//           {!loading && !hasMore && products.length > 0 && (
//             <div className="text-gray-500 text-sm py-2">You&apos;ve reached the end</div>
//           )}
//         </div>
        
//         {/* Mobile Category Menu */}
//         {isMobile && isMenuOpen && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end">
//             <div className="bg-white w-2/3 h-full overflow-auto p-4 animate-slide-in-right">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="font-bold text-lg">Categories</h3>
//                 <Button 
//                   variant="ghost" 
//                   size="icon" 
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <X className="h-5 w-5" />
//                 </Button>
//               </div>
              
//               <div className="space-y-2">
//                 {Object.keys(categorizedProducts).map(category => (
//                   <Button
//                     key={`mobile-${category}`}
//                     onClick={() => handleCategoryClick(category)}
//                     variant={selectedCategory === category ? "default" : "outline"}
//                     className={`w-full justify-start ${
//                       selectedCategory === category 
//                         ? `${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`
//                         : ""
//                     }`}
//                   >
//                     {category}
//                   </Button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* Pull-to-refresh component (optional, for mobile devices) */}
//         {isMobile && (
//           <div className="fixed top-0 left-0 w-full z-50 flex justify-center">
           
//           </div>
//         )}
//       </div>
//     );
//   };

// export default ProductMenu;  

'use client';
import { menuProducts} from '@/lib/actions/product-actions';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Search, 
  ShoppingCartIcon, 
  Tag, 
  X, 
  Menu, 
  Phone, 
  MapPin, 
  Clock, 
  Heart, 
  ShoppingCart, 
  User,
  ChevronUp,
  Instagram,
  Facebook,
  Twitter,
  Mail,
} from 'lucide-react';
import { Product } from '@/types/product/type';

type CategorizedProducts = {
  [key: string]: Product[];
};

// Enhanced color palette for categories
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
    'bg-[#0088FE]',
    'bg-[#00C49F]',
    'bg-[#FFBB28]',
    'bg-[#FF8042]',
    'bg-[#8884D8]',
  ]
};

// Business type presets for styling adjustments
const businessTypes = {
  salon: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    accent: 'text-purple-600',
    icon: 'scissors'
  },
  spa: {
    primary: 'bg-teal-600',
    secondary: 'bg-teal-100',
    accent: 'text-teal-600',
    icon: 'heart'
  },
  retail: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    accent: 'text-blue-600',
    icon: 'shopping-bag'
  },
  butchery: {
    primary: 'bg-red-600',
    secondary: 'bg-red-100',
    accent: 'text-red-600',
    icon: 'scissors'
  },
  supermarket: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    accent: 'text-green-600',
    icon: 'shopping-cart'
  },
  restaurant: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-100',
    accent: 'text-orange-600',
    icon: 'utensils'
  },
  hotel: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-100',
    accent: 'text-indigo-600',
    icon: 'bed'
  },
  bar: {
    primary: 'bg-amber-600',
    secondary: 'bg-amber-100',
    accent: 'text-amber-600',
    icon: 'wine'
  },
  default: {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-100',
    accent: 'text-emerald-600',
    icon: 'store'
  }
};

interface ExtendedProduct extends Omit<Product, 'categoryName'> {
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  price?: string | number;
  categoryName: string;
}

// Mock business data that would come from an API
const businessInfo = {
  name: "Big Genge",
  tagline: "Quality Products, Exceptional Service",
  logo: "/logo.png", // This would be a real path to the logo
  phone: "+255 123 456 789",
  email: "info@biggenge.com",
  address: "123 Market Street, Dar es Salaam, Tanzania",
  hours: "Mon-Sat: 8am - 8pm, Sun: 10am - 6pm",
  socials: {
    instagram: "https://instagram.com/biggenge",
    facebook: "https://facebook.com/biggenge",
    twitter: "https://twitter.com/biggenge"
  },
  businessType: "spa" // This would determine styling
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
    const [locationId, setLocationId] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [businessType, setBusinessType] = useState(businessTypes.default);
    const loaderRef = useRef<HTMLDivElement>(null);
    
    // Set business type based on the business info
    useEffect(() => {
      if (businessInfo.businessType && businessTypes[businessInfo.businessType as keyof typeof businessTypes]) {
        setBusinessType(businessTypes[businessInfo.businessType as keyof typeof businessTypes]);
      }
    }, []);

    // Get locationId from URL parameters on component mount
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const locationParam = urlParams.get('locationId');
        
        if (locationParam) {
          setLocationId(locationParam);
        }
      }
    }, []);

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
  
    // Handle scroll to show/hide scroll-to-top button
    useEffect(() => {
      const handleScroll = () => {
        setShowScrollToTop(window.scrollY > 300);
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    // Initial data load - now depends on locationId
    useEffect(() => {
      if (initialLoad && locationId !== null) { 
        fetchProducts(true);
        setInitialLoad(false);
      }
    }, [initialLoad, locationId]);
  
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
      if (!initialLoad && locationId !== null) {
        handleSearch();
      }
    }, [searchQuery, locationId]);
  
    const fetchProducts = async (isReset: boolean) => {
      try {
        setLoading(true);
        const pageToFetch = isReset ? 1 : currentPage;
        
        const response = await menuProducts(searchQuery, pageToFetch, pageLimit, locationId ?? '');
        
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
  
    const handleScrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };
    
    const getCategoryColorIndex = (category: string) => {
      // Generate a consistent index based on the category name
      const hash = category.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      return Math.abs(hash) % categoryColors.backgrounds.length;
    };
  
    // const getBgColorForCategory = (category: string) => {
    //   const index = getCategoryColorIndex(category);
    //   return categoryColors.backgrounds[index];
    // };
  
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
    
    const handleAddToCart = (product: ExtendedProduct) => {
      // This would be replaced with actual cart functionality
      setCartCount(prev => prev + 1);
      // Show toast notification
      alert(`Added ${product.name} to cart`);
    };
    
    const handleAddToWishlist = (product: ExtendedProduct) => {
      // This would be replaced with actual wishlist functionality
      setWishlistCount(prev => prev + 1);
      // Show toast notification
      alert(`Added ${product.name} to wishlist`);
    };

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Top Bar - Business Info */}
        <div className={`w-full py-2 px-4 ${businessType.primary} text-white hidden md:block`}>
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex space-x-4 text-sm">
              <span className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {businessInfo.phone}
              </span>
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {businessInfo.address}
              </span>
            </div>
            <div className="flex space-x-4 text-sm">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {businessInfo.hours}
              </span>
              <div className="flex space-x-2">
                <a href={businessInfo.socials.facebook} className="hover:text-gray-200">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href={businessInfo.socials.instagram} className="hover:text-gray-200">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href={businessInfo.socials.twitter} className="hover:text-gray-200">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Header */}
        <header className="bg-white shadow-md sticky top-0 z-30">
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center">
              {/* Logo and Business Name */}
              <div className="flex items-center space-x-2">
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="md:hidden"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                )}
                
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full ${businessType.primary} flex items-center justify-center mr-2`}>
                    <ShoppingCartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-xl">{businessInfo.name}</h1>
                    <p className="text-xs text-gray-500 hidden md:block">
                      {businessInfo.tagline}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Search on Desktop */}
              <div className="hidden md:flex flex-1 mx-8">
                <div className="relative flex-grow max-w-md mx-auto">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="pr-10"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => alert('Account')}>
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="relative" onClick={() => alert('Wishlist')}>
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className={`absolute -top-1 -right-1 ${businessType.primary} text-white rounded-full text-xs w-4 h-4 flex items-center justify-center`}>
                      {wishlistCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="relative" onClick={() => alert('Cart')}>
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className={`absolute -top-1 -right-1 ${businessType.primary} text-white rounded-full text-xs w-4 h-4 flex items-center justify-center`}>
                      {cartCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Mobile Search */}
            <div className="mt-4 md:hidden">
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pr-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <button 
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <Search className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-grow">
          {/* Categories Horizontal Scrollable Menu */}
          <div className="bg-white shadow-md sticky top-20 z-20">
            <div className="max-w-6xl mx-auto">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-2 py-2 px-4">
                  {Object.keys(categorizedProducts).map(category => (
                    <Button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`px-5 py-2 min-w-24 flex items-center justify-center ${
                        selectedCategory === category 
                          ? `${businessType.primary} ${getTextColorForCategory(category)}`
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
          </div>
          
          <div className="max-w-6xl mx-auto p-4 pt-6">
            {/* Initial Loading State */}
            {initialLoad && loading && (
              <div className="text-center py-16">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${businessType.accent} mx-auto mb-4`}></div>
                <p className="text-gray-600">Loading products...</p>
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
                <p className="text-gray-600 mb-2">No products found</p>
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
                    <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 ${businessType.primary} text-white`}>
                      <div className="flex-1">
                        <h2 className="text-lg font-medium">{category}</h2>
                      </div>
                    </div>
                    
                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categorizedProducts[category].map(product => {
                        const extendedProduct = product as ExtendedProduct;
                        return (
                          <Card 
                            key={`${product.id}-${product.name}`} 
                            className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative"
                          >
                            {/* Wishlist Button */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 bg-white rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleAddToWishlist(extendedProduct)}
                            >
                              <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
                            </Button>
                            
                            <div className="relative">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <ShoppingCartIcon className="w-12 h-12 text-gray-300" />
                                </div>
                              )}
                            </div>
                            
                            <CardHeader className="p-3 pb-0">
                              <h3 className="font-medium text-center truncate text-sm sm:text-base">{product.name}</h3>
                            </CardHeader>
                            
                            <CardContent className="p-3 pt-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <p className="text-lg font-bold">
                                  {getProductPrice(extendedProduct).toLocaleString()} <span className="text-xs font-normal text-gray-500">TZS</span>
                                </p>
                              </div>
                            </CardContent>
                            
                            <CardFooter className="p-3 pt-0 justify-center flex flex-col gap-2">
                              <Badge variant="outline" className="px-2 py-1 text-xs w-full justify-center">
                                <Tag className="h-3 w-3 mr-1" />
                                {extendedProduct.categoryName}
                              </Badge>
                              
                              <Button 
                                className={`w-full mt-1 ${businessType.primary} hover:opacity-90`}
                                size="sm"
                                onClick={() => handleAddToCart(extendedProduct)}
                              >
                                Add to Cart
                              </Button>
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
                  <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${businessType.accent} mb-2`}></div>
                  <p className="text-gray-500 text-sm">Loading more products...</p>
                </div>
              )}
              
              {!loading && !hasMore && products.length > 0 && (
                <div className="text-gray-500 text-sm py-2">You&apos;ve reached the end</div>
              )}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-8">
          {/* Main Footer Content */}
          <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Section */}
            <div>
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 rounded-full ${businessType.primary} flex items-center justify-center mr-2`}>
                  <ShoppingCartIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-bold text-xl">{businessInfo.name}</h2>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                {businessInfo.tagline}
              </p>
              <div className="flex space-x-3 mb-4">
                <a href={businessInfo.socials.facebook} className="hover:text-gray-300">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href={businessInfo.socials.instagram} className="hover:text-gray-300">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href={businessInfo.socials.twitter} className="hover:text-gray-300">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Home</a></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Products</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{businessInfo.address}</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  <span>{businessInfo.phone}</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>{businessInfo.email}</span>
                </li>
                <li className="flex items-start">
                  <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{businessInfo.hours}</span>
                </li>
              </ul>
            </div>
            
            {/* Newsletter Subscription */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Newsletter</h3>
              <p className="text-gray-300 text-sm mb-3">
                Subscribe to receive updates on new products and special promotions
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button className={businessType.primary}>
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Copyright Notice */}
          <div className="border-t border-gray-700">
            <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} {businessInfo.name}. All rights reserved.
              </p>
              <div className="flex space-x-4 mt-2 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm">Refund Policy</a>
              </div>
            </div>
          </div>
        </footer>
        
        {/* Mobile Category Menu */}
        {isMobile && isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-start">
            <div className="bg-white w-4/5 h-full overflow-auto p-4 animate-slide-in-right">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${businessType.primary} flex items-center justify-center mr-2`}>
                    <ShoppingCartIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">{businessInfo.name}</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="py-4 border-t border-b border-gray-200 mb-4">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">CONTACT INFORMATION</h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    {businessInfo.phone}
                  </li>
                  <li className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {businessInfo.email}
                  </li>
                  <li className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <span>{businessInfo.address}</span>
                  </li>
                </ul>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">CATEGORIES</h4>
                <div className="space-y-2">
                  {Object.keys(categorizedProducts).map(category => (
                    <Button
                      key={`mobile-${category}`}
                      onClick={() => handleCategoryClick(category)}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`w-full justify-start ${
                        selectedCategory === category 
                          ? `${businessType.primary} text-white`
                          : ""
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">QUICK LINKS</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Home</a></li>
                  <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">About Us</a></li>
                  <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Contact</a></li>
                  <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">FAQ</a></li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-center space-x-4">
                  <a href={businessInfo.socials.facebook} className={`${businessType.accent} hover:opacity-80`}>
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href={businessInfo.socials.instagram} className={`${businessType.accent} hover:opacity-80`}>
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href={businessInfo.socials.twitter} className={`${businessType.accent} hover:opacity-80`}>
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <button 
            onClick={handleScrollToTop}
            className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg ${businessType.primary} text-white z-30`}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  };
export default ProductMenu