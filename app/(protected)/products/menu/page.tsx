'use client';
import { searchProducts } from '@/lib/actions/product-actions';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {Info } from 'lucide-react';
import { Product } from '@/types/product/type';
import { Variant } from '@/types/variant/type';

type CategorizedProducts = {
  [key: string]: Product[];
};

// Color palette for categories
const categoryColors = {
  backgrounds: [
    'bg-blue-100',
    'bg-green-100',
    'bg-yellow-100',
    'bg-red-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-indigo-100',
    'bg-teal-100',
    'bg-orange-100',
    'bg-cyan-100',
  ],
  text: [
    'text-blue-800',
    'text-green-800',
    'text-yellow-800',
    'text-red-800',
    'text-purple-800',
    'text-pink-800',
    'text-indigo-800',
    'text-teal-800',
    'text-orange-800',
    'text-cyan-800',
  ]
};

// Extend the Product type to include additional properties
interface ExtendedProduct extends Omit<Product, 'categoryName' | 'variants'> {
  isNew?: boolean;
  price?: string | number;
  categoryName: string;
  variants?: Variant[];
}

const ProductMenu = () => {
  const [, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [categorizedProducts, setCategorizedProducts] = useState<CategorizedProducts>({});
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageLimit, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await searchProducts(searchQuery, currentPage, pageLimit);
      
      if (response && response.content) {
        const typedContent = response.content as ExtendedProduct[];
        setProducts(typedContent);
        
        if (response.pageable) {
          setTotalPages(Math.ceil(response.pageable.totalElements / pageLimit));
        } else if (response.totalPages) {
          setTotalPages(response.totalPages);
        } else {
          setTotalPages(Math.ceil(typedContent.length / pageLimit));
        }
        
        const grouped: { [key: string]: Product[] } = {};
        typedContent.forEach(product => {
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
      } else if (response && response.content) {
        setProducts(response.content);
        if (response.pageable) {
          setTotalPages(Math.ceil(response.pageable.totalElements / pageLimit));
        }
        
        const grouped: { [key: string]: Product[] } = {};
        response.data.forEach((product: { categoryName: string; }) => {
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
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
      console.error('Error fetching products:', err);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts();
  };
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    const element = document.getElementById(category.toLowerCase().replace(/\s+/g, '-'));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageChange = (page: React.SetStateAction<number>) => {
    setCurrentPage(page);
  };

  const changePage = (direction: string) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-grow"
          />
          <Button onClick={handleSearch} variant="default">
            Search
          </Button>
        </div>
      </div>

      {/* Categories Horizontal Scrollable Menu */}
      <div className="sticky top-0 bg-white z-10 pb-2 pt-2 shadow-sm">
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
      
      {/* Selected Category Info - Removed since we're showing all categories */}
      
      {/* Loading State */}
      {loading && <div className="text-center py-4">Loading products...</div>}
      
      {/* Error State */}
      {error && <div className="text-red-500 py-4">{error}</div>}
      
      {/* Display Products for All Categories */}
      {!loading && !error && Object.keys(categorizedProducts).length === 0 && (
        <div className="text-center py-4">No products found</div>
      )}
      
      {!loading && !error && (
        <div>
          {Object.keys(categorizedProducts).map(category => (
            <div 
              key={category} 
              id={category.toLowerCase().replace(/\s+/g, '-')}
              className={`mb-12 ${selectedCategory === category ? 'scroll-mt-32' : ''}`}
            >
              {/* Category Header */}
              <div className={`rounded-md p-4 mb-4 flex items-center gap-2 ${getBgColorForCategory(category)} ${getTextColorForCategory(category)}`}>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{category}</h2>
                </div>
              </div>
              
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categorizedProducts[category].map(product => {
                  const extendedProduct = product as ExtendedProduct;
                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">No image</span>
                          </div>
                        )}
                        {extendedProduct.isNew && (
                          <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                        )}
                      </div>
                      
                      <CardHeader className="p-4 pb-0">
                        <h3 className="font-medium text-center">{product.name}</h3>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-2 text-center">
                        {product.variants && product.variants.length > 0 && product.variants[0].price ? (
                          <p className="text-xl font-bold text-center">
                            {product.variants[0].price.toLocaleString()} <span className="text-sm font-normal text-gray-500">TZS</span>
                          </p>
                        ) : (
                          <p className="text-xl font-bold text-center">
                            {(parseFloat(extendedProduct.price as string) || 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">TZS</span>
                          </p>
                        )}
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0 flex justify-center">
                        {product.description && (
                          <Button
                            onClick={() => {
                              setSelectedProduct(extendedProduct);
                              setShowModal(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => changePage('prev')} 
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="w-8 h-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button 
              onClick={() => changePage('next')} 
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
          
          <div>
            <Select
              value={pageLimit.toString()}
              onValueChange={(value) => {
                setPageLimit(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {selectedProduct?.description}
          </DialogDescription>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductMenu;