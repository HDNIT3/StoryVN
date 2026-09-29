export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  duration?: number; // mặc định 4000ms (4 giây)
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  show(message: string, type: ToastType = "info", options?: ToastOptions): string {
    if (!message) return "";

    // Tránh spam thông báo trùng lặp đang hiển thị
    const existing = this.toasts.find((t) => t.message === message && t.type === type);
    if (existing) {
      return existing.id;
    }

    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const duration = options?.duration ?? 4000;

    const newToast: ToastItem = {
      id,
      type,
      title: options?.title,
      message,
      duration,
    };

    // Giữ tối đa 4 thông báo mới nhất trên màn hình
    this.toasts = [...this.toasts.slice(-3), newToast];
    this.notify();

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  success(message: string, options?: ToastOptions) {
    return this.show(message, "success", options);
  }

  error(message: string, options?: ToastOptions) {
    return this.show(message, "error", options);
  }

  warning(message: string, options?: ToastOptions) {
    return this.show(message, "warning", options);
  }

  info(message: string, options?: ToastOptions) {
    return this.show(message, "info", options);
  }
}

export const toast = new ToastManager();
export default toast;
