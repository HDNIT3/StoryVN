import { API_BASE_URL } from "@/lib/api";
import type { AuthorListItem } from "@/features/author/types";

export interface SearchSuggestion {
  _id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string;
  kind?: "author";
}

export async function getSearchSuggestions(query: string, signal: AbortSignal): Promise<SearchSuggestion[]> {
  const encoded = encodeURIComponent(query);
  const [stories, authors] = await Promise.allSettled([
    getItems<SearchSuggestion>(`/search/suggest?q=${encoded}`, signal),
    getItems<AuthorListItem>(`/authors?search=${encoded}&limit=5`, signal),
  ]);
  if (stories.status === "rejected" && authors.status === "rejected") {
    throw new Error("Search unavailable");
  }

  return [
    ...(authors.status === "fulfilled" ? authors.value.map((author): SearchSuggestion => ({
      _id: author._id,
      kind: "author",
      slug: author.slug,
      title: author.penName,
      coverUrl: author.avatarUrl ?? null,
      description: author.slug,
    })) : []),
    ...(stories.status === "fulfilled" ? stories.value : []),
  ];
}

async function getItems<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) throw new Error("Search unavailable");
  const body: { data: { items: T[] } } = await response.json();
  return body.data.items;
}
