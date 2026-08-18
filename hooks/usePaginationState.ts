'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaginationState {
  pageIndex: number;
  pageSize: number;
  timestamp: number;
}

// Saved pagination is only restored if it was written within this window, so a
// day-old tab can't snap a fresh visit back to page 47. The `timestamp` field
// was always persisted for exactly this — it just wasn't being read.
const STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

// Internal params Next.js appends to its RSC requests. Never persist them and
// never echo them back into the visible URL.
const INTERNAL_PARAMS = ['_rsc'];

const isValidPageIndex = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0;
const isValidPageSize = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n > 0;

export const usePaginationState = ({ key }: { key: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const storageKey = `pagination-${key}`;

  const savePaginationState = (page: string, limit: string) => {
    if (typeof window === 'undefined') return;

    const pageIndex = Number(page) - 1;
    const pageSize = Number(limit);
    // Never persist garbage (?page=abc, ?limit=NaN). Restoring it later would
    // push ?page=NaN&limit=NaN and wedge the list.
    if (!isValidPageIndex(pageIndex) || !isValidPageSize(pageSize)) return;

    try {
      const state: PaginationState = { pageIndex, pageSize, timestamp: Date.now() };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // localStorage can throw (private mode, quota, disabled). Persistence is
      // a nicety, not a requirement — swallow.
    }
  };

  const getSavedPaginationState = (): PaginationState | null => {
    if (typeof window === 'undefined') return null;

    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      return null;
    }
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved) as Partial<PaginationState>;
      if (!isValidPageIndex(parsed?.pageIndex) || !isValidPageSize(parsed?.pageSize)) {
        return null;
      }
      return {
        pageIndex: parsed.pageIndex,
        pageSize: parsed.pageSize,
        timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
      };
    } catch {
      // Corrupt entry — remove it so it can't keep throwing on every init.
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      return null;
    }
  };

  const initializePaginationState = () => {
    if (typeof window === 'undefined' || !searchParams) return;

    const isRevalidating = searchParams.has('_rsc');

    if (isRevalidating) {
      const savedState = getSavedPaginationState();
      if (!savedState) return;
      // Ignore stale saves so an old tab doesn't yank a fresh visit backwards.
      if (!savedState.timestamp || Date.now() - savedState.timestamp > STALE_AFTER_MS) {
        return;
      }

      const page = String(savedState.pageIndex + 1);
      const limit = String(savedState.pageSize);

      // No-op guard: if the URL already carries this page/limit there is nothing
      // to restore — bail before navigating to avoid a redundant replace (and
      // any chance of a navigation loop).
      if (searchParams.get('page') === page && searchParams.get('limit') === limit) {
        return;
      }

      // Merge onto the CURRENT params instead of rebuilding the query from just
      // page+limit. The previous version dropped every other param — search,
      // sort, and the onboarding/status/date filters — on each revalidation.
      const next = new URLSearchParams(searchParams.toString());
      for (const p of INTERNAL_PARAMS) next.delete(p);
      next.set('page', page);
      next.set('limit', limit);

      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    } else {
      const currentPage = searchParams.get('page');
      const currentLimit = searchParams.get('limit');
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
