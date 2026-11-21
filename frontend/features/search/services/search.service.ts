import { API_BASE_URL } from "@/lib/api";

export interface SearchSuggestion {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string;
}

export async function getSearchSuggestions(query: string, signal: AbortSignal): Promise<SearchSuggestion[]> {
  const response = await fetch(`${API_BASE_URL}/search/suggest?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) throw new Error("Search unavailable");
  const body = await response.json();
  return body.data.items;
}
