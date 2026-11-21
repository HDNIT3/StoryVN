"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSearchSuggestions, type SearchSuggestion } from "../services/search.service";

const EMPTY = { items: [] as SearchSuggestion[], loading: false, error: false, searchedQuery: "" };

export function useSearchSuggestions() {
  const [state, setState] = useState(EMPTY);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(EMPTY);
  }, []);

  const search = useCallback(async (query: string) => {
    const q = query.normalize("NFC").replace(/\s+/g, " ").trim();
    if (q.length < 2 || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ items: [], loading: true, error: false, searchedQuery: q });
    try {
      const items = await getSearchSuggestions(q, controller.signal);
      if (!controller.signal.aborted && controllerRef.current === controller) {
        setState({ items, loading: false, error: false, searchedQuery: q });
      }
    } catch {
      if (!controller.signal.aborted && controllerRef.current === controller) {
        setState({ items: [], loading: false, error: true, searchedQuery: q });
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  return { ...state, search, reset };
}
