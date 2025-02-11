import { useEffect } from 'react';
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
    const paginationState: PaginationState = {
      pageIndex: Number(page) - 1,
      pageSize: Number(limit),
      timestamp: Date.now(),
    };
    // console.log(`[${key}] Saving pagination state:`, paginationState);
    localStorage.setItem(`pagination-${key}`, JSON.stringify(paginationState));
  };

  const getSavedPaginationState = (): PaginationState | null => {
    const saved = localStorage.getItem(`pagination-${key}`);
    if (!saved) return null;
    const state = JSON.parse(saved);
    // console.log(`[${key}] Retrieved saved pagination state:`, state);
    return state;
  };

  const initializePaginationState = () => {
    // console.log(`[${key}] Initializing pagination state`);
    
    // Get current URL parameters
    const currentPage = searchParams?.get("page");
    const currentLimit = searchParams?.get("limit");
    
    // Check if we're coming from a redirect (indicated by _rsc parameter)
    const isRevalidating = searchParams?.has("_rsc");
    
    if (isRevalidating) {
      console.log(`[${key}] Revalidation detected, checking saved state`);
      const savedState = getSavedPaginationState();
      if (savedState) {
        const queryString = new URLSearchParams({
          page: String(savedState.pageIndex + 1),
          limit: String(savedState.pageSize),
        }).toString();
        
        console.log(`[${key}] Restoring saved state:`, queryString);
        router.replace(`${pathname}?${queryString}`, { scroll: false });
        return;
      }
    }

    if (currentPage && currentLimit) {
      // console.log(`[${key}] Saving current URL state`);
      savePaginationState(currentPage, currentLimit);
    } else {
      const savedState = getSavedPaginationState();
      if (savedState) {
        const queryString = new URLSearchParams({
          page: String(savedState.pageIndex + 1),
          limit: String(savedState.pageSize),
        }).toString();
        
        // console.log(`[${key}] Restoring saved state:`, queryString);
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      }
    }
  };

  return {
    savePaginationState,
    getSavedPaginationState,
    initializePaginationState,
  };
};