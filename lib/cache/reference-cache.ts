"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tiny client-side cache for reference data (currencies, countries, units).
 *
 * Two storage tiers:
 *   - "memory": module-level Map, lost on full page reload. Use for
 *      business/location-scoped data where leaking across sessions in the
 *      same tab would be wrong.
 *   - "localStorage": survives reloads, scoped by `key`. Use for system-wide
 *      reference data with effectively static content.
 *
 * Promise dedup: concurrent `get()` calls share a single in-flight fetch.
 *
 * Pub/sub: mutators (or any caller of `invalidate`/`prime`) notify all
 * subscribed consumers, which re-read or re-fetch as needed.
 */

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export type CacheStore = "memory" | "localStorage";

export interface CacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttlMs?: number;
  store?: CacheStore;
  isValid?: (value: unknown) => value is T;
}

export interface ReferenceCache<T> {
  get(): Promise<T>;
  peek(): T | null;
  invalidate(): void;
  prime(value: T): void;
  subscribe(listener: () => void): () => void;
}

const STORAGE_PREFIX = "settlo:refcache:";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const memoryStore = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const subscribers = new Map<string, Set<() => void>>();

const isBrowser = () => typeof window !== "undefined";

function readStorage<T>(
  key: string,
  isValid?: (v: unknown) => v is T,
): CacheEntry<T> | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<unknown>;
    if (
      !parsed ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    if (isValid && !isValid(parsed.data)) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return parsed as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, entry: CacheEntry<T>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota or serialization */
  }
}

function clearStorage(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

function notify(key: string): void {
  const set = subscribers.get(key);
  if (!set) return;
  for (const listener of set) {
    try {
      listener();
    } catch {
      /* swallow */
    }
  }
}

export function createReferenceCache<T>(opts: CacheOptions<T>): ReferenceCache<T> {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const store = opts.store ?? "memory";

  function peek(): T | null {
    const mem = memoryStore.get(opts.key) as CacheEntry<T> | undefined;
    if (mem) {
      if (mem.expiresAt > Date.now()) return mem.data;
      memoryStore.delete(opts.key);
    }
    if (store !== "localStorage") return null;
    const stored = readStorage<T>(opts.key, opts.isValid);
    if (!stored) return null;
    memoryStore.set(opts.key, stored);
    return stored.data;
  }

  async function get(): Promise<T> {
    const cached = peek();
    if (cached !== null) return cached;
    const existing = inflight.get(opts.key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = (async () => {
      try {
        const data = await opts.fetcher();
        const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
        memoryStore.set(opts.key, entry);
        if (store === "localStorage") writeStorage(opts.key, entry);
        notify(opts.key);
        return data;
      } finally {
        inflight.delete(opts.key);
      }
    })();
    inflight.set(opts.key, promise);
    return promise;
  }

  function invalidate(): void {
    memoryStore.delete(opts.key);
    inflight.delete(opts.key);
    if (store === "localStorage") clearStorage(opts.key);
    notify(opts.key);
  }

  function prime(value: T): void {
    const entry: CacheEntry<T> = { data: value, expiresAt: Date.now() + ttlMs };
    memoryStore.set(opts.key, entry);
    if (store === "localStorage") writeStorage(opts.key, entry);
    notify(opts.key);
  }

  function subscribe(listener: () => void): () => void {
    let set = subscribers.get(opts.key);
    if (!set) {
      set = new Set();
      subscribers.set(opts.key, set);
    }
    set.add(listener);
    return () => {
      const current = subscribers.get(opts.key);
      current?.delete(listener);
      if (current && current.size === 0) subscribers.delete(opts.key);
    };
  }

  return { get, peek, invalidate, prime, subscribe };
}

export interface ReferenceCacheState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Subscribes a component to a cache. Initial state is always
 * `{ data: null, loading: true }` to avoid SSR/hydration mismatch — the
 * effect fills in cached data synchronously on mount, so the loading
 * flash is only visible when there's truly nothing cached yet.
 */
export function useReferenceCache<T>(
  cache: ReferenceCache<T>,
): ReferenceCacheState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      const fresh = cache.peek();
      if (fresh !== null) {
        if (cancelled) return;
        setData(fresh);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      cache
        .get()
        .then((value) => {
          if (cancelled) return;
          setData(value);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err);
          setLoading(false);
        });
    };

    sync();
    const unsub = cache.subscribe(sync);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [cache]);

  const refetch = useCallback(() => {
    cache.invalidate();
  }, [cache]);

  return { data, loading, error, refetch };
}
