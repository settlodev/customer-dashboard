

'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
  timestamp: number;
}

export const usePaginationState = ({ key }: { key: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const savePaginationState = (page: string, limit: string) => {
    if (typeof window === 'undefined') return;
    
    const paginationState: PaginationState = {
      pageIndex: Number(page) - 1,
      pageSize: Number(limit),
      timestamp: Date.now(),
    };
    // console.log(`[${key}] Saving pagination state:`, paginationState);
    localStorage.setItem(`pagination-${key}`, JSON.stringify(paginationState));
  };

  const getSavedPaginationState = (): PaginationState | null => {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem(`pagination-${key}`);
    if (!saved) return null;
    return JSON.parse(saved);
  };

  const initializePaginationState = () => {
    if (typeof window === 'undefined') return;

    // Check if we're handling a revalidation
    const isRevalidating = searchParams?.has("_rsc");
    
    if (isRevalidating) {
      const savedState = getSavedPaginationState();
      if (savedState) {
        const queryString = new URLSearchParams({
          page: String(savedState.pageIndex + 1),
          limit: String(savedState.pageSize),
        }).toString();
        
        // Immediately restore the correct pagination
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      }
    } else {
      // Normal navigation - save current state
      const currentPage = searchParams?.get("page");
      const currentLimit = searchParams?.get("limit");
      
      if (currentPage && currentLimit) {
        savePaginationState(currentPage, currentLimit);
      }
    }
  };

  return {
    savePaginationState,
    getSavedPaginationState,
    initializePaginationState,
  };
};