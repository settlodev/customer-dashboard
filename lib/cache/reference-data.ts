"use client";

import { useMemo } from "react";
import {
  createReferenceCache,
  useReferenceCache,
  type ReferenceCacheState,
} from "./reference-cache";
import { fetchAllBrands } from "@/lib/actions/brand-actions";
import { fetchAllCategories } from "@/lib/actions/category-actions";
import { fetchCountries } from "@/lib/actions/countries-actions";
import { fetchAllCustomers } from "@/lib/actions/customer-actions";
import {
  fetchAllDepartments,
} from "@/lib/actions/department-actions";
import { fetchSupportedCurrencies } from "@/lib/actions/exchange-rate-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchProductCatalogue } from "@/lib/actions/product-actions";
import { getStocks } from "@/lib/actions/stock-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { fetchAllTaxTypes } from "@/lib/actions/tax-type-actions";
import { getUnits } from "@/lib/actions/unit-actions";
import type { Brand } from "@/types/brand/type";
import type { Category } from "@/types/category/type";
import type { Country } from "@/types/country/type";
import type { Customer } from "@/types/customer/type";
import type { Department } from "@/types/department/type";
import type { SupportedCurrency } from "@/types/exchange-rate/type";
import type { Staff } from "@/types/staff";
import type { Stock } from "@/types/stock/type";
import type { Product } from "@/types/product/type";
import type { Supplier } from "@/types/supplier/type";
import type { TaxType } from "@/types/tax-type/type";
import type { UnitOfMeasure } from "@/types/unit/type";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * ONE_DAY;

/**
 * Countries and currencies are system-wide reference data — same for every
 * business — so we persist them across page reloads via localStorage with a
 * long TTL.
 *
 * Units, departments, suppliers, and tax types are all per-business and
 * resolved via the X-Business-Id header the API client injects. They stay
 * in memory only so a business switch (always a hard navigation) wipes the
 * cache rather than serving the previous business's data. Each one
 * invalidates on its mutation paths via the corresponding
 * `invalidateXCache` helper.
 */

export const countriesCache = createReferenceCache<Country[]>({
  key: "countries",
  fetcher: fetchCountries,
  ttlMs: SEVEN_DAYS,
  store: "localStorage",
  isValid: (v): v is Country[] => Array.isArray(v),
});

export const currenciesCache = createReferenceCache<SupportedCurrency[]>({
  key: "currencies",
  fetcher: fetchSupportedCurrencies,
  ttlMs: SEVEN_DAYS,
  store: "localStorage",
  isValid: (v): v is SupportedCurrency[] => Array.isArray(v),
});

export const unitsCache = createReferenceCache<UnitOfMeasure[]>({
  key: "units",
  fetcher: getUnits,
  ttlMs: ONE_DAY,
  store: "memory",
});

export const departmentsCache = createReferenceCache<Department[]>({
  key: "departments",
  fetcher: async () => {
    try {
      return (await fetchAllDepartments()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: ONE_DAY,
  store: "memory",
});

export const suppliersCache = createReferenceCache<Supplier[]>({
  key: "suppliers",
  fetcher: fetchAllSuppliers,
  ttlMs: ONE_DAY,
  store: "memory",
});

export const taxTypesCache = createReferenceCache<TaxType[]>({
  key: "tax-types",
  fetcher: fetchAllTaxTypes,
  ttlMs: SEVEN_DAYS,
  store: "memory",
});

export const brandsCache = createReferenceCache<Brand[]>({
  key: "brands",
  fetcher: async () => {
    try {
      return (await fetchAllBrands()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: ONE_DAY,
  store: "memory",
});

export const categoriesCache = createReferenceCache<Category[]>({
  key: "categories",
  fetcher: async () => {
    try {
      return (await fetchAllCategories()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: ONE_DAY,
  store: "memory",
});

export const staffCache = createReferenceCache<Staff[]>({
  key: "staff",
  fetcher: async () => {
    try {
      return (await fetchAllStaff()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: ONE_DAY,
  store: "memory",
});

/**
 * Stocks (with embedded variants) — the big one. A typical business
 * catalogue is 1–5 MB JSON, which makes localStorage a non-starter
 * (5–10 MB quota, sync parse blocks the main thread) and makes a long
 * TTL risky against mutation churn from sales, intake, and transfers.
 *
 * Short 5-minute TTL bounds cross-session staleness without thrashing
 * the cache. Local CRUD mutations call `invalidateStocksCache()`
 * directly. Cross-session structural changes (another operator adds a
 * variant) ride the realtime gateway via the `StockCacheRealtimeBinder`
 * mounted at the protected layout — that binder debounces to avoid
 * thrashing on POS-driven balance event firehoses.
 */
export const stocksCache = createReferenceCache<Stock[]>({
  key: "stocks",
  fetcher: async () => {
    try {
      return (await getStocks()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: FIVE_MINUTES,
  store: "memory",
});

/**
 * Products (with embedded variants) — the sellable catalogue behind the
 * quoting/invoicing line pickers. Same scaling trade-off as stocks, so the
 * same shape: memory store, short TTL, explicit invalidation from the
 * product mutation paths.
 */
export const productsCache = createReferenceCache<Product[]>({
  key: "products",
  fetcher: async () => {
    try {
      return (await fetchProductCatalogue()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: FIVE_MINUTES,
  store: "memory",
});

/**
 * Customers — same scaling trade-off as stocks. A typical B2C catalogue
 * can run into the tens of thousands, so localStorage is off the table
 * (quota + sync parse cost). Memory cache with a 5-minute TTL bounds
 * cross-session staleness; local mutations call `invalidateCustomersCache`
 * directly, and cross-session changes ride the
 * `business:{id}:customers` channel via {@link CustomerCacheRealtimeBinder}
 * with the same 30s cooldown the stocks binder uses.
 *
 * `fetchAllCustomers()` is location-scoped server-side, so a location
 * switch (always a hard nav) wipes this cache automatically — no
 * cross-location leakage to worry about.
 */
export const customersCache = createReferenceCache<Customer[]>({
  key: "customers",
  fetcher: async () => {
    try {
      return (await fetchAllCustomers()) ?? [];
    } catch {
      return [];
    }
  },
  ttlMs: FIVE_MINUTES,
  store: "memory",
});

export const getCachedCountries = () => countriesCache.get();
export const getCachedCurrencies = () => currenciesCache.get();
export const getCachedUnits = () => unitsCache.get();
export const getCachedDepartments = () => departmentsCache.get();
export const getCachedSuppliers = () => suppliersCache.get();
export const getCachedTaxTypes = () => taxTypesCache.get();
export const getCachedBrands = () => brandsCache.get();
export const getCachedCategories = () => categoriesCache.get();
export const getCachedStaff = () => staffCache.get();
export const getCachedStocks = () => stocksCache.get();
export const getCachedProducts = () => productsCache.get();
export const getCachedCustomers = () => customersCache.get();

export const invalidateCountriesCache = () => countriesCache.invalidate();
export const invalidateCurrenciesCache = () => currenciesCache.invalidate();
export const invalidateUnitsCache = () => unitsCache.invalidate();
export const invalidateDepartmentsCache = () => departmentsCache.invalidate();
export const invalidateSuppliersCache = () => suppliersCache.invalidate();
export const invalidateTaxTypesCache = () => taxTypesCache.invalidate();
export const invalidateBrandsCache = () => brandsCache.invalidate();
export const invalidateCategoriesCache = () => categoriesCache.invalidate();
export const invalidateStaffCache = () => staffCache.invalidate();
export const invalidateStocksCache = () => stocksCache.invalidate();
export const invalidateProductsCache = () => productsCache.invalidate();
export const invalidateCustomersCache = () => customersCache.invalidate();

export function useCachedCountries(): ReferenceCacheState<Country[]> {
  return useReferenceCache(countriesCache);
}

export function useCachedCurrencies(): ReferenceCacheState<SupportedCurrency[]> {
  return useReferenceCache(currenciesCache);
}

export function useCachedUnits(): ReferenceCacheState<UnitOfMeasure[]> {
  return useReferenceCache(unitsCache);
}

export function useCachedDepartments(): ReferenceCacheState<Department[]> {
  return useReferenceCache(departmentsCache);
}

export function useCachedSuppliers(): ReferenceCacheState<Supplier[]> {
  return useReferenceCache(suppliersCache);
}

export function useCachedTaxTypes(): ReferenceCacheState<TaxType[]> {
  return useReferenceCache(taxTypesCache);
}

export function useCachedBrands(): ReferenceCacheState<Brand[]> {
  return useReferenceCache(brandsCache);
}

export function useCachedCategories(): ReferenceCacheState<Category[]> {
  return useReferenceCache(categoriesCache);
}

/**
 * Mirror of the server-side {@code fetchCategoriesHierarchical} DFS but
 * built from the cached flat list. The backend's flat endpoint orders by
 * sortOrder only, so children land wherever sortOrder places them in the
 * global list rather than nested under their parents — we walk the
 * parent/child links here to produce a hierarchy-friendly ordering.
 *
 * Pure transform: same flat-list reference → same output reference is not
 * guaranteed, but downstream consumers can memoise on the flat list if
 * they care about referential stability.
 */
function buildCategoryTree(flat: Category[] | null | undefined): Category[] {
  if (!flat || flat.length === 0) return [];

  const byId = new Map<string, Category>();
  for (const c of flat) byId.set(c.id, c);

  const ROOT = "__root__";
  const childrenByParent = new Map<string, Category[]>();
  for (const c of flat) {
    const key = c.parentId && byId.has(c.parentId) ? c.parentId : ROOT;
    const arr = childrenByParent.get(key) ?? [];
    arr.push(c);
    childrenByParent.set(key, arr);
  }

  for (const arr of childrenByParent.values()) {
    arr.sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      return so !== 0 ? so : a.name.localeCompare(b.name);
    });
  }

  const result: Category[] = [];
  const visited = new Set<string>();
  const visit = (parentKey: string) => {
    for (const item of childrenByParent.get(parentKey) ?? []) {
      if (visited.has(item.id)) continue;
      visited.add(item.id);
      result.push(item);
      visit(item.id);
    }
  };
  visit(ROOT);

  return result;
}

export async function getCachedCategoryTree(): Promise<Category[]> {
  return buildCategoryTree(await getCachedCategories());
}

export function useCachedCategoryTree(): ReferenceCacheState<Category[]> {
  const { data, loading, error, refetch } = useCachedCategories();
  const tree = useMemo(() => buildCategoryTree(data), [data]);
  return { data: tree, loading, error, refetch };
}

export function useCachedStaff(): ReferenceCacheState<Staff[]> {
  return useReferenceCache(staffCache);
}

export function useCachedStocks(): ReferenceCacheState<Stock[]> {
  return useReferenceCache(stocksCache);
}

export function useCachedCustomers(): ReferenceCacheState<Customer[]> {
  return useReferenceCache(customersCache);
}
