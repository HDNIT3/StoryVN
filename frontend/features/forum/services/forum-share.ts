import { toast } from "@/lib/toast";

export async function triggerForumShare({
  id,
  title,
  isAuthenticated,
  shareMutation,
  onSuccess,
}: {
  id: string;
  title: string;
  isAuthenticated: boolean;
  shareMutation: { mutate: (id: string, options?: { onSuccess?: (data: any) => void }) => void };
  onSuccess?: (shareCount?: number) => void;
}) {
  if (!isAuthenticated) {
    toast.error("Vui lòng đăng nhập để chia sẻ bài viết.");
    return;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const postUrl = `${origin}/dien-dan/${id}`;

  // Kiểm tra hỗ trợ Web Share API (Hộp thoại chia sẻ gốc của Microsoft / Windows / Trình duyệt)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text: title,
        url: postUrl,
      });

      shareMutation.mutate(id, {
        onSuccess: (data) => {
          if (onSuccess) onSuccess(data?.shareCount);
        },
      });
      toast.success("Chia sẻ bài viết thành công!");
      return;
    } catch (error: any) {
      // Người dùng bấm hủy hộp thoại (AbortError) thì không làm gì thêm
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  // Fallback: Tự động sao chép liên kết vào clipboard
  try {
    await navigator.clipboard.writeText(postUrl);
    shareMutation.mutate(id, {
      onSuccess: (data) => {
        if (onSuccess) onSuccess(data?.shareCount);
      },
    });
    toast.success("Đã sao chép liên kết bài viết vào bộ nhớ tạm!");
  } catch {
    toast.error("Không thể sao chép liên kết bài viết.");
  }
}
