import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Shared fetch state machine for screens that load data on focus. Owns the
// data/isLoading/isRefreshing/error states, the focus refetch, and the guard
// against setState after the screen unmounts mid-fetch — previously each
// screen re-implemented this (and most copies lacked the unmount guard).
//
// `fetchFn` MUST be referentially stable (wrap it in useCallback) — it is a
// dependency of the focus effect, so an inline arrow would refetch on every
// render. Its useCallback deps double as refetch triggers: a new fetchFn
// (e.g. a changed route param) re-runs the fetch on the next render.
//
// Returned pieces beyond the states:
// - reload: silent refetch (after a mutation, keeps current data on screen)
// - refresh: pull-to-refresh (sets isRefreshing, then reloads)
// - setData: replace data locally from a mutation's server response
export function useFocusedFetch<T>(
  token: string | null,
  fetchFn: (token: string) => Promise<T>,
  fallbackErrorMessage: string,
  initialData: T,
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Bumped on every reload. A resolving fetch compares its captured value and
  // discards its result if a newer reload started meanwhile — otherwise a slow
  // stale response (e.g. after a route param changed fetchFn, or overlapping
  // focus refetches) would overwrite the newer data. The newer fetch's own
  // finally clears the loading flags.
  const versionRef = useRef(0);

  const reload = useCallback(async () => {
    if (!token) return;
    const version = ++versionRef.current;
    const isCurrent = () =>
      mountedRef.current && version === versionRef.current;
    try {
      const result = await fetchFn(token);
      if (isCurrent()) {
        setData(result);
        setError(null);
      }
    } catch (err: any) {
      if (isCurrent()) setError(err.message || fallbackErrorMessage);
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [token, fetchFn, fallbackErrorMessage]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    reload();
  }, [reload]);

  return { data, setData, isLoading, isRefreshing, error, reload, refresh };
}
