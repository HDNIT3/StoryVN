export interface ReadingHistoryItem {
  _id: string;
  slug: string;
  title: string;
  coverUrl?: string | null;
  authorName?: string;
  progressState?: string;
  chapterCount?: number;
  lastReadAt: string;
}

const STORAGE_KEY = "storyvn_reading_history";
const MAX_HISTORY_ITEMS = 30;

export const historyService = {
  getHistory(): ReadingHistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  recordHistory(item: Omit<ReadingHistoryItem, "lastReadAt">): void {
    if (typeof window === "undefined" || !item._id) return;
    try {
      const current = this.getHistory();
      const filtered = current.filter((h) => h._id !== item._id && h.slug !== item.slug);
      const updated: ReadingHistoryItem = {
        ...item,
        lastReadAt: new Date().toISOString(),
      };
      const result = [updated, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      // Dispatch custom event to notify listeners
      window.dispatchEvent(new Event("storyvn_history_updated"));
    } catch {
      // ignore
    }
  },

  removeFromHistory(id: string): void {
    if (typeof window === "undefined") return;
    try {
      const current = this.getHistory();
      const updated = current.filter((h) => h._id !== id && h.slug !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("storyvn_history_updated"));
    } catch {
      // ignore
    }
  },

  clearHistory(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("storyvn_history_updated"));
    } catch {
      // ignore
    }
  },
};
