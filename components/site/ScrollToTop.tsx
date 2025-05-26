// components/ScrollToTop.tsx
'use client';
import React from 'react';
import { ChevronUp } from 'lucide-react';
import { BusinessType } from '@/types/site/type';

interface ScrollToTopProps {
  showScrollToTop: boolean;
  handleScrollToTop: () => void;
  businessType: BusinessType;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  showScrollToTop,
  handleScrollToTop,
  businessType
}) => {
  if (!showScrollToTop) return null;

  return (
    <button 
      onClick={handleScrollToTop}
      className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg ${businessType.primary} text-white z-30 transition-all duration-300 hover:opacity-90`}
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTop;