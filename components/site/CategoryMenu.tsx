'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BusinessType, CategorizedProducts, categoryColors } from '@/types/site/type';

interface CategoryMenuProps {
  categorizedProducts: CategorizedProducts;
  selectedCategory: string | null;
  handleCategoryClick: (category: string) => void;
  businessType: BusinessType;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({
  categorizedProducts,
  selectedCategory,
  handleCategoryClick,
  businessType
}) => {
  const getCategoryColorIndex = (category: string) => {
    const hash = category.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return Math.abs(hash) % categoryColors.backgrounds.length;
  };

  const getTextColorForCategory = (category: string) => {
    const index = getCategoryColorIndex(category);
    return categoryColors.text[index];
  };

  return (
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
  );
};

export default CategoryMenu;