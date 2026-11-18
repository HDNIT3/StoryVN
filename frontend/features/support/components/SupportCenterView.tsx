"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import { useSubmitReport, type ReportTargetType } from "@/features/reports";
import { storyService } from "@/features/stories/services/story.service";
import { chapterService } from "@/features/chapters/services/chapter.service";
import { forumService } from "@/features/forum/services/forum.service";
import { commentService } from "@/features/comments/services/comment.service";
import {
  SUPPORT_STATUS_CONFIG,
  SUPPORT_TOPIC_LABELS,
  supportService,
  type SupportTicketItem,
  type SupportTopic,
} from "../services/support.service";
import {
  useCreateSupportTicket,
  useMySupportTickets,
  useUserReplySupportTicket,
} from "../queries/useSupportQueries";

type SupportMainTab = "help" | "inbox" | "report";
type HelpCategory = "ALL" | "ACCOUNT" | "COINS" | "AUTHOR" | "READING" | "POLICY";
type ReportInputMode = "picker" | "url";
type CommentSourceScope = "STORY" | "FORUM";

interface FaqItem {
  id: string;
  category: Exclude<HelpCategory, "ALL">;
  question: string;
  answer: string;
}

const HELP_CATEGORIES: { id: HelpCategory; label: string; desc: string }[] = [
  { id: "ALL", label: "Tất cả chủ đề", desc: "Toàn bộ câu hỏi thường gặp" },
  { id: "ACCOUNT", label: "Tài khoản & Bảo mật", desc: "Đăng nhập, mật khẩu, OTP, hồ sơ" },
  { id: "COINS", label: "Nạp Xu & Mở khóa", desc: "Thanh toán VNPay, ví Xu, mua chương" },
  { id: "READING", label: "Đọc & Nghe truyện", desc: "Tủ truyện, lịch sử, phát thanh TTS" },
  { id: "AUTHOR", label: "Dành cho Tác giả", desc: "Đăng ký tác giả, đăng truyện, doanh thu" },
  { id: "POLICY", label: "Diễn đàn & Quy định", desc: "Kiểm duyệt bài viết, bình luận, bản quyền" },
];

const FAQ_LIST: FaqItem[] = [
  {
    id: "acc-1",
    category: "ACCOUNT",
    question: "Tôi quên mật khẩu hoặc không nhận được mã OTP qua email thì làm sao?",
    answer:
      "Bạn có thể truy cập trang Quên mật khẩu để yêu cầu gửi lại mã xác thực OTP 6 chữ số. Hãy kiểm tra thêm mục Thư rác (Spam / Promotions). Nếu vẫn chưa nhận được, hãy gửi phiếu hỗ trợ ngay bên cạnh để Ban quản trị kiểm tra và phản hồi qua email cho bạn.",
  },
  {
    id: "acc-2",
    category: "ACCOUNT",
    question: "Làm thế nào để thay đổi ảnh đại diện và tên hiển thị?",
    answer:
      "Sau khi đăng nhập, bạn bấm vào menu tài khoản góc phải trên cùng -> chọn 'Hồ sơ cá nhân' -> bấm 'Chỉnh sửa hồ sơ'. Tại đây bạn có thể cắt ảnh đại diện (crop) và cập nhật tên hiển thị của mình.",
  },
  {
    id: "coin-1",
    category: "COINS",
    question: "Nạp Xu qua cổng VNPay xong nhưng số dư Ví chưa cập nhật?",
    answer:
      "Thông thường Xu sẽ được cộng tự động ngay khi giao dịch VNPay báo thành công. Nếu mạng bị gián đoạn, bạn vui lòng kiểm tra mục 'Lịch sử thanh toán' trong phần Ví của tôi hoặc gửi phiếu hỗ trợ kèm thời gian giao dịch để Ban quản trị đối soát và phản hồi qua email.",
  },
  {
    id: "coin-2",
    category: "COINS",
    question: "Chương truyện đã mở khóa bằng Xu có bị mất khi đăng xuất không?",
    answer:
      "Không. Khi bạn mở khóa một chương trả phí bằng Xu, quyền sở hữu chương đó được gắn vĩnh viễn với tài khoản của bạn. Bạn có thể đọc lại bất kỳ lúc nào trên mọi thiết bị và xem lại trong mục 'Lịch sử mua chương'.",
  },
  {
    id: "read-1",
    category: "READING",
    question: "Làm sao để sử dụng tính năng Nghe truyện (Phát thanh TTS)?",
    answer:
      "Tại giao diện đọc chương truyện, bạn bấm vào nút 'Phát thanh' trên thanh công cụ bên trái (hoặc nút Công cụ trên điện thoại). Bạn có thể tùy chỉnh tốc độ đọc và chạm trực tiếp vào bất kỳ đoạn văn nào để nghe từ đoạn đó.",
  },
  {
    id: "read-2",
    category: "READING",
    question: "Làm thế nào để nhận thông báo khi truyện yêu thích ra chương mới?",
    answer:
      "Tại trang chi tiết tác phẩm, bạn nhấn nút 'Theo dõi truyện'. Mỗi khi tác giả xuất bản chương mới, hệ thống sẽ gửi thông báo trực tiếp tới biểu tượng Chuông thông báo của bạn.",
  },
  {
    id: "author-1",
    category: "AUTHOR",
    question: "Làm sao để trở thành Tác giả và đăng truyện trên StoryVN?",
    answer:
      "Bạn đăng nhập tài khoản độc giả, vào menu tài khoản chọn 'Đăng ký tác giả', điền bút danh và giới thiệu ngắn. Sau khi Quản trị viên phê duyệt, tài khoản của bạn sẽ mở khóa 'Quản lý tác giả' để đăng truyện, thêm chương và nhận doanh thu Xu.",
  },
  {
    id: "author-2",
    category: "AUTHOR",
    question: "Tác giả có quyền kiểm duyệt bình luận trong truyện của mình không?",
    answer:
      "Có. Tác giả chính của truyện có quyền 'Ẩn bình luận' hoặc 'Cho hiện lại' các bình luận trong tác phẩm và chương truyện của mình nếu phát hiện bình luận thiếu văn minh hoặc tiết lộ tình tiết (spoiler).",
  },
  {
    id: "policy-1",
    category: "POLICY",
    question: "Tại sao bài viết diễn đàn của tôi ở trạng thái 'Chờ duyệt'?",
    answer:
      "Để giữ môi trường thảo luận văn minh và không có spam/quảng cáo bẩn, mọi bài viết mới hoặc bài viết vừa chỉnh sửa trên Diễn đàn sẽ qua bước kiểm duyệt của Ban quản trị trước khi hiển thị công khai.",
  },
  {
    id: "policy-2",
    category: "POLICY",
    question: "Tôi phát hiện truyện đạo văn, chương lỗi hoặc bình luận xúc phạm thì tố cáo ở đâu?",
    answer:
      "Bạn có thể bấm trực tiếp nút 'Báo cáo' ngay tại bài viết diễn đàn, trang chi tiết truyện, cuối chương truyện hoặc dưới mỗi bình luận. Ngoài ra, bạn có thể chuyển sang tab 'Tố cáo vi phạm' ngay tại trang Hỗ trợ này để tìm chọn nội dung và gửi báo cáo.",
  },
];

const VIOLATION_OPTIONS_BY_TARGET: Record<
  ReportTargetType,
  { id: string; label: string; desc: string }[]
> = {
  STORY: [
    {
      id: "copyright",
      label: "Vi phạm bản quyền / Đăng lại trái phép (Reup)",
      desc: "Sao chép tác phẩm khi chưa được phép của tác giả hoặc dịch giả gốc",
    },
    {
      id: "nsfw",
      label: "Nội dung đồi trụy, bạo lực hoặc trái pháp luật",
      desc: "Nội dung cấm, vi phạm thuần phong mỹ tục hoặc gắn sai độ tuổi",
    },
    {
      id: "spam",
      label: "Truyện rác, quảng cáo hoặc giả mạo",
      desc: "Đăng nội dung trống, spam quảng cáo, đánh lừa độc giả",
    },
    {
      id: "other",
      label: "Lý do vi phạm khác",
      desc: "Mô tả cụ thể chi tiết vi phạm bên dưới",
    },
  ],
  CHAPTER: [
    {
      id: "error",
      label: "Chương bị lỗi hiển thị, mất đoạn hoặc nhầm nội dung",
      desc: "Chương lặp chữ, thiếu nội dung hoặc sai thứ tự chương",
    },
    {
      id: "scam",
      label: "Gian lận khóa chương trả phí (Xu)",
      desc: "Chương thu phí nhưng nội dung rỗng hoặc cố tình đánh lừa độc giả",
    },
    {
      id: "nsfw",
      label: "Nội dung vi phạm quy tắc cộng đồng / Bản quyền",
      desc: "Ngôn từ nhạy cảm vượt giới hạn hoặc sao chép bản dịch trái phép",
    },
    {
      id: "other",
      label: "Lý do vi phạm khác",
      desc: "Mô tả cụ thể chi tiết vi phạm bên dưới",
    },
  ],
  FORUM_POST: [
    {
      id: "spam",
      label: "Spam, quảng cáo hoặc phát tán liên kết lừa đảo",
      desc: "Đăng bài lặp lại, chèn link độc hại hoặc quảng cáo trái phép",
    },
    {
      id: "hate",
      label: "Ngôn từ công kích, xúc phạm, gây thù ghét",
      desc: "Chửi bới cá nhân, tác giả hoặc gây mất đoàn kết cộng đồng",
    },
    {
      id: "spoiler",
      label: "Tiết lộ tình tiết quan trọng (Spoiler) không cảnh báo",
      desc: "Cố ý lộ cốt truyện làm ảnh hưởng trải nghiệm độc giả khác",
    },
    {
      id: "other",
      label: "Lý do vi phạm khác",
      desc: "Mô tả cụ thể chi tiết vi phạm bên dưới",
    },
  ],
  COMMENT: [
    {
      id: "hate",
      label: "Ngôn từ thô tục, xúc phạm độc giả / tác giả",
      desc: "Bình luận miệt thị, quấy rối hoặc gây hấn trong thảo luận",
    },
    {
      id: "spam",
      label: "Spam bình luận rác hoặc rải link quảng cáo",
      desc: "Lặp lại bình luận vô nghĩa hoặc dẫn link độc hại",
    },
    {
      id: "spoiler",
      label: "Cố tình tiết lộ tình tiết (Spoiler)",
      desc: "Bình luận lộ kết cục hoặc tình tiết các chương sau",
    },
    {
      id: "other",
      label: "Lý do vi phạm khác",
      desc: "Mô tả cụ thể chi tiết vi phạm bên dưới",
    },
  ],
};

export function SupportCenterView() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const codeParam = searchParams.get("code") || "";
  const emailParam = searchParams.get("email") || "";

  const initialTab: SupportMainTab =
    tabParam === "report" ? "report" : tabParam === "inbox" ? "inbox" : "help";

  const { user, isAuthenticated } = useAuth();
  const submitReport = useSubmitReport();
  const createSupportMutation = useCreateSupportTicket();
  const userReplyMutation = useUserReplySupportTicket();

  const [activeTab, setActiveTab] = useState<SupportMainTab>(initialTab);
  const [helpCategory, setHelpCategory] = useState<HelpCategory>("ALL");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("acc-1");

  // ================= TAB 1: GỬI YÊU CẦU TRỢ GIÚP =================
  const [supportTopic, setSupportTopic] = useState<SupportTopic>("ACCOUNT");
  const [supportSenderName, setSupportSenderName] = useState(
    user?.displayName || ""
  );
  const [supportEmail, setSupportEmail] = useState(user?.email || "");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [createdTicket, setCreatedTicket] = useState<SupportTicketItem | null>(
    null
  );

  // ================= TAB 2: HỘP THƯ PHẢN HỒI & TRA CỨU =================
  const myTicketsQuery = useMySupportTickets(
    { page: 1, limit: 20 },
    isAuthenticated && activeTab === "inbox"
  );
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicketItem | null>(null);
  const [lookupCode, setLookupCode] = useState(codeParam);
  const [lookupEmail, setLookupEmail] = useState(emailParam || user?.email || "");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [followUpText, setFollowUpText] = useState("");

  // ================= TAB 3: TỐ CÁO VI PHẠM (KHÔNG CẦN NHẬP ID) =================
  const [reportTargetType, setReportTargetType] =
    useState<ReportTargetType>("STORY");
  const [reportInputMode, setReportInputMode] =
    useState<ReportInputMode>("picker");
  const [reportUrlInput, setReportUrlInput] = useState("");

  // Interactive Picker States
  const [storySearchQuery, setStorySearchQuery] = useState("");
  const [pickedStory, setPickedStory] = useState<{
    _id: string;
    title: string;
    slug: string;
    coverUrl?: string | null;
    authorName?: string;
  } | null>(null);
  const [pickedChapterId, setPickedChapterId] = useState("");

  const [forumSearchQuery, setForumSearchQuery] = useState("");
  const [pickedForumPost, setPickedForumPost] = useState<{
    _id: string;
    slug?: string;
    title: string;
    authorName?: string;
  } | null>(null);

  const [commentScope, setCommentScope] = useState<CommentSourceScope>("STORY");
  const [pickedComment, setPickedComment] = useState<{
    _id: string;
    content: string;
    authorName: string;
  } | null>(null);

  const [reportViolationId, setReportViolationId] = useState("copyright");
  const [reportReasonText, setReportReasonText] = useState("");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "report") setActiveTab("report");
    else if (t === "inbox") setActiveTab("inbox");
    else if (t === "help") setActiveTab("help");
  }, [searchParams]);

  useEffect(() => {
    if (user?.email && !supportEmail) {
      setSupportEmail(user.email);
    }
    if (user?.displayName && !supportSenderName) {
      setSupportSenderName(user.displayName);
    }
    if (user?.email && !lookupEmail) {
      setLookupEmail(user.email);
    }
  }, [user?.email, user?.displayName]);

  // Reset violation option when changing target type
  useEffect(() => {
    const opts = VIOLATION_OPTIONS_BY_TARGET[reportTargetType];
    if (opts && opts.length > 0) {
      setReportViolationId(opts[0].id);
    }
    setPickedChapterId("");
    setPickedComment(null);
  }, [reportTargetType]);

  // Auto-select ticket from user's list or auto-lookup when arriving from email link
  useEffect(() => {
    if (activeTab !== "inbox") return;
    const list = myTicketsQuery.data?.items ?? [];
    if (codeParam && list.length > 0) {
      const matched = list.find(
        (item) => item.ticketCode.toUpperCase() === codeParam.toUpperCase()
      );
      if (matched) {
        setSelectedTicket(matched);
        return;
      }
    }
    if (!selectedTicket && list.length > 0 && !codeParam) {
      setSelectedTicket(list[0]);
    }
  }, [activeTab, myTicketsQuery.data?.items, codeParam]);

  useEffect(() => {
    if (activeTab === "inbox" && codeParam && (emailParam || user?.email)) {
      const targetMail = emailParam || user?.email || "";
      if (!targetMail) return;
      setLookupLoading(true);
      supportService
        .lookupTicket(codeParam, targetMail)
        .then((res) => {
          if (res.data) setSelectedTicket(res.data);
        })
        .catch(() => undefined)
        .finally(() => setLookupLoading(false));
    }
  }, [activeTab, codeParam, emailParam, user?.email]);

  // Queries for interactive report picker
  const needStoryPicker =
    activeTab === "report" &&
    reportInputMode === "picker" &&
    (reportTargetType === "STORY" ||
      reportTargetType === "CHAPTER" ||
      (reportTargetType === "COMMENT" && commentScope === "STORY"));

  const storyPickerQuery = useQuery({
    queryKey: ["report-picker-stories", storySearchQuery.trim()],
    queryFn: async () => {
      const res = await storyService.getStories({
        search: storySearchQuery.trim() || undefined,
        limit: 6,
        page: 1,
      });
      return res.data?.items ?? [];
    },
    enabled: needStoryPicker && !pickedStory,
    staleTime: 30_000,
  });

  const chaptersPickerQuery = useQuery({
    queryKey: ["report-picker-chapters", pickedStory?.slug],
    queryFn: async () => {
      if (!pickedStory?.slug) return [];
      const res = await chapterService.getChaptersBySlug(pickedStory.slug, {
        page: 1,
        limit: 200,
        order: "asc",
      });
      return res.data?.items ?? [];
    },
    enabled:
      activeTab === "report" &&
      reportInputMode === "picker" &&
      reportTargetType === "CHAPTER" &&
      Boolean(pickedStory?.slug),
  });

  const needForumPicker =
    activeTab === "report" &&
    reportInputMode === "picker" &&
    (reportTargetType === "FORUM_POST" ||
      (reportTargetType === "COMMENT" && commentScope === "FORUM"));

  const forumPickerQuery = useQuery({
    queryKey: ["report-picker-forum"],
    queryFn: async () => {
      const res = await forumService.list("feed", 1, undefined, undefined, 25);
      return res.data?.items ?? [];
    },
    enabled: needForumPicker && !pickedForumPost,
    staleTime: 30_000,
  });

  const commentsPickerQuery = useQuery({
    queryKey: [
      "report-picker-comments",
      commentScope,
      pickedStory?._id,
      pickedForumPost?._id,
    ],
    queryFn: async () => {
      if (commentScope === "STORY" && pickedStory?._id) {
        const res = await commentService.getStoryComments(pickedStory._id, {
          page: 1,
          limit: 20,
        });
        return res.data?.items ?? [];
      }
      if (commentScope === "FORUM" && pickedForumPost?._id) {
        const res = await commentService.getForumPostComments(
          pickedForumPost._id,
          { page: 1, limit: 20 }
        );
        return res.data?.items ?? [];
      }
      return [];
    },
    enabled:
      activeTab === "report" &&
      reportInputMode === "picker" &&
      reportTargetType === "COMMENT" &&
      Boolean(
        (commentScope === "STORY" && pickedStory?._id) ||
          (commentScope === "FORUM" && pickedForumPost?._id)
      ),
  });

  const filteredFaqs = FAQ_LIST.filter((item) => {
    if (helpCategory !== "ALL" && item.category !== helpCategory) return false;
    if (!faqSearch.trim()) return true;
    const q = faqSearch.trim().toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
    );
  });

  const filteredForumOptions = (forumPickerQuery.data ?? []).filter((post) => {
    if (!forumSearchQuery.trim()) return true;
    const q = forumSearchQuery.trim().toLowerCase();
    const author =
      post.userId?.displayName || post.userId?.username || "";
    return (
      post.title.toLowerCase().includes(q) ||
      author.toLowerCase().includes(q)
    );
  });

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportEmail.trim() || !supportSubject.trim() || !supportMessage.trim())
      return;

    const created = await createSupportMutation.mutateAsync({
      senderName: supportSenderName.trim() || undefined,
      email: supportEmail.trim(),
      topic: supportTopic,
      subject: supportSubject.trim(),
      message: supportMessage.trim(),
    });

    setCreatedTicket(created);
    setSelectedTicket(created);
    setLookupCode(created.ticketCode);
    setLookupEmail(created.email);
    setSupportSubject("");
    setSupportMessage("");
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim() || !lookupEmail.trim()) return;
    setLookupLoading(true);
    try {
      const res = await supportService.lookupTicket(lookupCode, lookupEmail);
      if (!res.data) {
        throw new Error("Không tìm thấy phiếu hỗ trợ với thông tin đã nhập.");
      }
      setSelectedTicket(res.data);
      toast.success(`Đã tìm thấy phiếu hỗ trợ #${res.data.ticketCode}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không tìm thấy phiếu hỗ trợ với thông tin đã nhập."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !followUpText.trim()) return;
    const updated = await userReplyMutation.mutateAsync({
      ticketCode: selectedTicket.ticketCode,
      content: followUpText.trim(),
      email: selectedTicket.email,
    });
    setSelectedTicket(updated);
    setFollowUpText("");
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập tài khoản để gửi báo cáo vi phạm.");
      return;
    }

    const violationList = VIOLATION_OPTIONS_BY_TARGET[reportTargetType];
    const selectedViolation =
      violationList.find((v) => v.id === reportViolationId) || violationList[0];
    const fullReason = `[${selectedViolation.label}] ${reportReasonText.trim()}`.trim();

    if (reportInputMode === "url") {
      if (!reportUrlInput.trim()) {
        toast.error("Vui lòng dán đường dẫn trang nội dung cần báo cáo.");
        return;
      }
      submitReport.mutate(
        {
          targetType: reportTargetType,
          targetUrl: reportUrlInput.trim(),
          reason: fullReason.slice(0, 1000),
        },
        {
          onSuccess: () => {
            setReportUrlInput("");
            setReportReasonText("");
          },
        }
      );
      return;
    }

    // Picker mode
    let resolvedTargetId = "";
    if (reportTargetType === "STORY") {
      if (!pickedStory?._id) {
        toast.error("Vui lòng tìm và chọn tác phẩm truyện cần báo cáo.");
        return;
      }
      resolvedTargetId = pickedStory._id;
    } else if (reportTargetType === "CHAPTER") {
      if (!pickedStory?._id) {
        toast.error("Vui lòng chọn tác phẩm truyện trước.");
        return;
      }
      if (!pickedChapterId) {
        toast.error("Vui lòng chọn chương truyện cần báo cáo.");
        return;
      }
      resolvedTargetId = pickedChapterId;
    } else if (reportTargetType === "FORUM_POST") {
      if (!pickedForumPost?._id) {
        toast.error("Vui lòng tìm và chọn bài viết diễn đàn cần báo cáo.");
        return;
      }
      resolvedTargetId = pickedForumPost._id;
    } else if (reportTargetType === "COMMENT") {
      if (!pickedComment?._id) {
        toast.error("Vui lòng chọn bình luận cụ thể cần báo cáo.");
        return;
      }
      resolvedTargetId = pickedComment._id;
    }

    submitReport.mutate(
      {
        targetType: reportTargetType,
        targetId: resolvedTargetId,
        reason: fullReason.slice(0, 1000),
      },
      {
        onSuccess: () => {
          setPickedStory(null);
          setPickedChapterId("");
          setPickedForumPost(null);
          setPickedComment(null);
          setReportReasonText("");
        },
      }
    );
  };

  const myTickets = myTicketsQuery.data?.items ?? [];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Hero Banner */}
        <header className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-900 via-slate-900 to-indigo-950 px-6 py-9 sm:px-10 sm:py-12 text-white shadow-lg">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"
          />
          <div className="relative max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
              Trung tâm Hỗ trợ & An toàn StoryVN
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Chúng tôi có thể giúp gì cho bạn?
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Gửi phiếu hỗ trợ nhận giải đáp trực tiếp qua Email, theo dõi tiến độ xử lý hoặc báo cáo nhanh các nội dung vi phạm tiêu chuẩn cộng đồng.
            </p>
          </div>

          {/* Main Switch Tabs */}
          <div className="relative mt-7 inline-flex flex-wrap gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab("help")}
              className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "help"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Trợ giúp & Gửi yêu cầu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inbox")}
              className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "inbox"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Hộp thư phản hồi & Email</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "report"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Tố cáo vi phạm</span>
            </button>
          </div>
        </header>

        {/* ================= TAB 1: TRỢ GIÚP & GỬI YÊU CẦU ================= */}
        {activeTab === "help" && (
          <div className="grid items-start gap-8 lg:grid-cols-12">
            {/* Left 7 cols: Categories & FAQs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {HELP_CATEGORIES.map((cat) => {
                  const active = helpCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setHelpCategory(cat.id)}
                      className={`text-left rounded-2xl border p-4 transition cursor-pointer ${
                        active
                          ? "border-sky-500 bg-sky-50/80 ring-1 ring-sky-500 shadow-2xs"
                          : "border-slate-200/80 bg-white hover:border-sky-200 hover:bg-slate-50/60"
                      }`}
                    >
                      <div
                        className={`text-xs sm:text-sm font-bold ${
                          active ? "text-sky-900" : "text-slate-900"
                        }`}
                      >
                        {cat.label}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                        {cat.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Câu hỏi thường gặp (FAQ)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Giải đáp nhanh các thắc mắc phổ biến nhất của độc giả và tác giả
                    </p>
                  </div>

                  <div className="relative min-w-[210px]">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Tìm câu hỏi trợ giúp..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredFaqs.map((faq) => {
                      const isOpen = openFaqId === faq.id;
                      return (
                        <div key={faq.id} className="py-3.5 first:pt-0 last:pb-0">
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                            className="flex w-full items-center justify-between gap-4 text-left py-1.5 cursor-pointer group"
                          >
                            <span className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition">
                              {faq.question}
                            </span>
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-transform ${
                                isOpen
                                  ? "rotate-180 border-sky-200 bg-sky-50 text-sky-600"
                                  : "border-slate-200 text-slate-400"
                              }`}
                            >
                              ▼
                            </span>
                          </button>
                          {isOpen && (
                            <p className="mt-2.5 rounded-2xl bg-slate-50/80 p-4 text-xs sm:text-sm leading-relaxed text-slate-600 border border-slate-100">
                              {faq.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 cols: Real Support Ticket Submission Form */}
            <aside className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Gửi phiếu yêu cầu hỗ trợ
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ban quản trị tiếp nhận & gửi phản hồi trực tiếp qua Email của bạn
                    </p>
                  </div>
                </div>

                {createdTicket && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-900">
                        ✓ Đã tiếp nhận phiếu hỗ trợ!
                      </span>
                      <span className="rounded-lg bg-emerald-700 px-2 py-0.5 text-xs font-extrabold text-white">
                        #{createdTicket.ticketCode}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Phản hồi từ Ban quản trị sẽ được gửi trực tiếp tới hộp thư{" "}
                      <strong>{createdTicket.email}</strong> và đồng bộ tại Hộp thư phản hồi.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("inbox")}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 hover:underline cursor-pointer"
                    >
                      <span>Mở Hộp thư theo dõi phản hồi ngay</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chủ đề cần trợ giúp
                    </label>
                    <select
                      value={supportTopic}
                      onChange={(e) =>
                        setSupportTopic(e.target.value as SupportTopic)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                    >
                      <option value="ACCOUNT">Sự cố Tài khoản / Đăng nhập / OTP</option>
                      <option value="COINS">Giao dịch Nạp Xu / Mở khóa chương</option>
                      <option value="AUTHOR">Hỗ trợ Tác giả / Duyệt tác phẩm</option>
                      <option value="BUG">Báo lỗi kỹ thuật / Giao diện web</option>
                      <option value="OTHER">Góp ý & Câu hỏi khác</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tên của bạn
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        value={supportSenderName}
                        onChange={(e) => setSupportSenderName(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email nhận phản hồi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="email-cua-ban@gmail.com"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tiêu đề ngắn gọn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={180}
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="VD: Cần hỗ trợ kiểm tra giao dịch nạp Xu lúc 9h30..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nội dung chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      minLength={5}
                      maxLength={3000}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Mô tả rõ vấn đề bạn đang gặp phải để Ban quản trị kiểm tra và giải quyết nhanh nhất..."
                      className="w-full rounded-xl border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-800 focus:border-sky-500 focus:outline-none resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    isLoading={createSupportMutation.isPending}
                    disabled={createSupportMutation.isPending}
                    className="w-full py-2.5"
                  >
                    Gửi phiếu yêu cầu hỗ trợ
                  </Button>
                </form>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Tài liệu & Quy định pháp lý
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-700">
                  <li>
                    <Link
                      href="/dieu-khoan-dich-vu"
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 hover:text-sky-600 transition"
                    >
                      <span>Điều khoản dịch vụ</span>
                      <span>→</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/chinh-sach-bao-mat"
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 hover:text-sky-600 transition"
                    >
                      <span>Chính sách bảo mật</span>
                      <span>→</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/ban-quyen"
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 hover:text-sky-600 transition"
                    >
                      <span>Quy định bản quyền (DMCA)</span>
                      <span>→</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        )}

        {/* ================= TAB 2: HỘP THƯ PHẢN HỒI & EMAIL NGƯỜI DÙNG ================= */}
        {activeTab === "inbox" && (
          <div className="space-y-6">
            {/* Email Sync Info Banner */}
            <div className="rounded-3xl border border-sky-200/80 bg-sky-50/70 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-xs">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Kênh nhận phản hồi hỗ trợ qua Email & Trực tuyến
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                    Ngay khi Quản trị viên phản hồi phiếu hỗ trợ, nội dung giải đáp được{" "}
                    <strong className="text-sky-800">gửi trực tiếp tới hộp thư Email của bạn</strong>{" "}
                    và hiển thị đồng thời tại đây để bạn theo dõi hoặc phản hồi tiếp.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("help")}
                className="shrink-0 rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100/60 transition cursor-pointer self-start sm:self-center"
              >
                + Gửi phiếu hỗ trợ mới
              </button>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-12">
              {/* Left 5 cols: My Tickets List + Lookup by Ticket Code & Email */}
              <div className="lg:col-span-5 space-y-5">
                {isAuthenticated && (
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Phiếu hỗ trợ của tôi ({myTickets.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => void myTicketsQuery.refetch()}
                        className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                      >
                        Làm mới
                      </button>
                    </div>

                    {myTicketsQuery.isPending ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Đang tải danh sách phiếu hỗ trợ...
                      </div>
                    ) : myTickets.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                        <p className="text-xs font-semibold text-slate-600">
                          Bạn chưa gửi phiếu yêu cầu hỗ trợ nào.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("help")}
                          className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                        >
                          Gửi yêu cầu đầu tiên →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {myTickets.map((item) => {
                          const active =
                            selectedTicket?.ticketCode === item.ticketCode;
                          const st =
                            SUPPORT_STATUS_CONFIG[item.status] ||
                            SUPPORT_STATUS_CONFIG.OPEN;
                          return (
                            <button
                              key={item.ticketCode}
                              type="button"
                              onClick={() => setSelectedTicket(item)}
                              className={`w-full text-left rounded-2xl border p-3.5 transition cursor-pointer ${
                                active
                                  ? "border-sky-500 bg-sky-50/70 ring-1 ring-sky-500"
                                  : "border-slate-200/80 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-extrabold text-white">
                                  #{item.ticketCode}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.badgeClass}`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`}
                                  />
                                  {st.label}
                                </span>
                              </div>
                              <div className="mt-2 text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                {item.subject}
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                                <span>
                                  {SUPPORT_TOPIC_LABELS[item.topic] || item.topic}
                                </span>
                                <span>
                                  {new Date(item.updatedAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Lookup by Code + Email (Works even without login / from Email link) */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tra cứu bằng Mã phiếu & Email
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dành cho trường hợp bạn gửi hỗ trợ khi chưa đăng nhập hoặc tra cứu từ Email
                    </p>
                  </div>

                  <form onSubmit={handleManualLookup} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Mã phiếu hỗ trợ (trong email xác nhận)
                      </label>
                      <input
                        type="text"
                        required
                        value={lookupCode}
                        onChange={(e) => setLookupCode(e.target.value)}
                        placeholder="VD: SP-8K4M2P"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold uppercase text-slate-800 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Địa chỉ Email đã dùng liên hệ
                      </label>
                      <input
                        type="email"
                        required
                        value={lookupEmail}
                        onChange={(e) => setLookupEmail(e.target.value)}
                        placeholder="email-cua-ban@gmail.com"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      isLoading={lookupLoading}
                      disabled={lookupLoading}
                      className="w-full"
                    >
                      Tra cứu nội dung phản hồi
                    </Button>
                  </form>
                </div>
              </div>

              {/* Right 7 cols: Selected Ticket Conversation & Follow-up */}
              <div className="lg:col-span-7">
                {!selectedTicket ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Chọn phiếu hỗ trợ hoặc tra cứu mã phiếu để xem phản hồi
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Toàn bộ lịch sử trao đổi với Ban quản trị và trạng thái gửi phản hồi qua Email sẽ hiển thị chi tiết tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs space-y-5">
                    {/* Ticket Header */}
                    <div className="border-b border-slate-100 pb-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white">
                            #{selectedTicket.ticketCode}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                              (
                                SUPPORT_STATUS_CONFIG[selectedTicket.status] ||
                                SUPPORT_STATUS_CONFIG.OPEN
                              ).badgeClass
                            }`}
                          >
                            {
                              (
                                SUPPORT_STATUS_CONFIG[selectedTicket.status] ||
                                SUPPORT_STATUS_CONFIG.OPEN
                              ).label
                            }
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Gửi ngày{" "}
                          {new Date(selectedTicket.createdAt).toLocaleString(
                            "vi-VN"
                          )}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedTicket.subject}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Phân loại:{" "}
                        <strong>
                          {SUPPORT_TOPIC_LABELS[selectedTicket.topic] ||
                            selectedTicket.topic}
                        </strong>{" "}
                        · Email nhận thông báo:{" "}
                        <strong className="text-sky-700">
                          {selectedTicket.email}
                        </strong>
                      </p>
                    </div>

                    {/* Messages Thread */}
                    <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                      {(selectedTicket.messages &&
                      selectedTicket.messages.length > 0
                        ? selectedTicket.messages
                        : [
                            {
                              senderRole: "USER" as const,
                              senderName: selectedTicket.senderName,
                              content: selectedTicket.message,
                              emailSent: false,
                              createdAt: selectedTicket.createdAt,
                            },
                          ]
                      ).map((msg, idx) => {
                        const isAdmin = msg.senderRole === "ADMIN";
                        return (
                          <div
                            key={idx}
                            className={`rounded-2xl border p-4 ${
                              isAdmin
                                ? "border-sky-200 bg-sky-50/70"
                                : "border-slate-200/80 bg-slate-50/50"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                                    isAdmin
                                      ? "bg-sky-600 text-white"
                                      : "bg-slate-700 text-white"
                                  }`}
                                >
                                  {isAdmin
                                    ? `Ban quản trị StoryVN (${msg.senderName})`
                                    : `${msg.senderName} (Bạn)`}
                                </span>
                                {isAdmin && msg.emailSent && (
                                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    ✓ Đã gửi tới Email của bạn
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(msg.createdAt).toLocaleString("vi-VN")}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Follow-up Reply Form */}
                    {selectedTicket.status === "CLOSED" ? (
                      <div className="rounded-2xl bg-slate-100 p-3.5 text-center text-xs font-medium text-slate-600">
                        Phiếu hỗ trợ này đã đóng. Nếu bạn cần hỗ trợ vấn đề mới, vui lòng tạo phiếu yêu cầu mới.
                      </div>
                    ) : (
                      <form
                        onSubmit={handleFollowUpSubmit}
                        className="border-t border-slate-100 pt-4 space-y-3"
                      >
                        <label className="block text-xs font-bold text-slate-700">
                          Gửi thêm thông tin hoặc phản hồi lại cho Ban quản trị
                        </label>
                        <textarea
                          rows={3}
                          required
                          maxLength={3000}
                          value={followUpText}
                          onChange={(e) => setFollowUpText(e.target.value)}
                          placeholder="Nhập nội dung phản hồi thêm (nếu vấn đề chưa được giải quyết triệt để)..."
                          className="w-full rounded-2xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-sky-500 focus:outline-none resize-none"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            size="sm"
                            isLoading={userReplyMutation.isPending}
                            disabled={
                              userReplyMutation.isPending || !followUpText.trim()
                            }
                          >
                            Gửi phản hồi bổ sung
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TỐ CÁO VI PHẠM (TRỰC QUAN, KHÔNG NHẬP MÃ ID) ================= */}
        {activeTab === "report" && (
          <div className="grid items-start gap-8 lg:grid-cols-12">
            {/* Left 8 cols: Intuitive Visual Report Form */}
            <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Báo cáo nội dung vi phạm tiêu chuẩn cộng đồng
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tìm chọn trực tiếp tác phẩm, chương truyện, bài viết diễn đàn hoặc dán liên kết trang web
                  </p>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center space-y-3">
                  <p className="text-sm font-semibold text-amber-900">
                    Vui lòng đăng nhập tài khoản để gửi báo cáo vi phạm tới bộ phận kiểm duyệt StoryVN.
                  </p>
                  <Link
                    href="/dang-nhap?returnUrl=/ho-tro?tab=report"
                    className="inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700 transition"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-6">
                  {/* BƯỚC 1: CHỌN LOẠI NỘI DUNG */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                      1. Chọn loại nội dung vi phạm
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(
                        [
                          { type: "STORY", label: "Tác phẩm truyện", sub: "Đạo văn, 18+, rác" },
                          { type: "CHAPTER", label: "Chương truyện", sub: "Chương lỗi, lừa Xu" },
                          { type: "FORUM_POST", label: "Bài viết diễn đàn", sub: "Spam, gây war" },
                          { type: "COMMENT", label: "Bình luận", sub: "Xúc phạm, spoiler" },
                        ] as { type: ReportTargetType; label: string; sub: string }[]
                      ).map((item) => {
                        const active = reportTargetType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setReportTargetType(item.type)}
                            className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                              active
                                ? "border-rose-500 bg-rose-50/80 ring-1 ring-rose-400 shadow-2xs"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`text-xs sm:text-sm font-bold ${
                                active ? "text-rose-800" : "text-slate-800"
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.sub}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BƯỚC 2: TÌM CHỌN NỘI DUNG HOẶC DÁN LINK (KHÔNG CÓ BẤT KỲ MÃ ID NÀO) */}
                  <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        2. Xác định nội dung cần báo cáo
                      </label>

                      <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setReportInputMode("picker")}
                          className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                            reportInputMode === "picker"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Tìm & chọn trực tiếp
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportInputMode("url")}
                          className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                            reportInputMode === "url"
                              ? "bg-white text-slate-900 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Dán đường dẫn (Link)
                        </button>
                      </div>
                    </div>

                    {reportInputMode === "url" ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={reportUrlInput}
                          onChange={(e) => setReportUrlInput(e.target.value)}
                          placeholder={
                            reportTargetType === "STORY"
                              ? "Dán link truyện, ví dụ: https://.../truyen/ten-tac-pham"
                              : reportTargetType === "CHAPTER"
                                ? "Dán link chương, ví dụ: https://.../truyen/ten-tac-pham/chuong/1"
                                : reportTargetType === "FORUM_POST"
                                  ? "Dán link bài viết diễn đàn, ví dụ: https://.../dien-dan/tieu-de-bai-viet"
                                  : "Dán link bình luận hoặc chuyển sang 'Tìm & chọn trực tiếp' bên cạnh"
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500">
                          Chỉ cần sao chép đường dẫn trên thanh địa chỉ trình duyệt và dán vào đây, hệ thống sẽ tự nhận diện nội dung.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {/* NẾU LÀ BÌNH LUẬN -> CHỌN NGUỒN TRUYỆN HAY DIỄN ĐÀN */}
                        {reportTargetType === "COMMENT" && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                              Bình luận nằm tại:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCommentScope("STORY");
                                setPickedComment(null);
                              }}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                                commentScope === "STORY"
                                  ? "border-rose-400 bg-rose-50 text-rose-800"
                                  : "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              Tác phẩm truyện
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCommentScope("FORUM");
                                setPickedComment(null);
                              }}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                                commentScope === "FORUM"
                                  ? "border-rose-400 bg-rose-50 text-rose-800"
                                  : "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              Bài viết diễn đàn
                            </button>
                          </div>
                        )}

                        {/* STORY PICKER (Dùng cho STORY, CHAPTER, hoặc COMMENT trong STORY) */}
                        {(reportTargetType === "STORY" ||
                          reportTargetType === "CHAPTER" ||
                          (reportTargetType === "COMMENT" &&
                            commentScope === "STORY")) && (
                          <div className="space-y-2">
                            {pickedStory ? (
                              <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-white p-3 shadow-2xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  {pickedStory.coverUrl ? (
                                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                                      <Image
                                        src={pickedStory.coverUrl}
                                        alt={pickedStory.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                                      Sách
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-bold uppercase text-rose-600">
                                      Đã chọn tác phẩm
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                      {pickedStory.title}
                                    </div>
                                    {pickedStory.authorName && (
                                      <div className="text-[11px] text-slate-500">
                                        Tác giả: {pickedStory.authorName}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickedStory(null);
                                    setPickedChapterId("");
                                    setPickedComment(null);
                                  }}
                                  className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                  Đổi truyện khác
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={storySearchQuery}
                                  onChange={(e) =>
                                    setStorySearchQuery(e.target.value)
                                  }
                                  placeholder="Gõ tên truyện cần tìm để chọn..."
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-none"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                  {storyPickerQuery.isPending ? (
                                    <div className="col-span-2 py-4 text-center text-xs text-slate-400">
                                      Đang tìm danh sách truyện...
                                    </div>
                                  ) : (storyPickerQuery.data ?? []).length ===
                                    0 ? (
                                    <div className="col-span-2 py-4 text-center text-xs text-slate-400">
                                      Không tìm thấy truyện phù hợp.
                                    </div>
                                  ) : (
                                    (storyPickerQuery.data ?? []).map(
                                      (st: any) => {
                                        const authorName =
                                          st.authorId?.displayName ||
                                          st.author?.displayName ||
                                          "";
                                        return (
                                          <button
                                            key={st._id}
                                            type="button"
                                            onClick={() =>
                                              setPickedStory({
                                                _id: st._id,
                                                title: st.title,
                                                slug: st.slug,
                                                coverUrl: st.coverUrl,
                                                authorName,
                                              })
                                            }
                                            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left hover:border-rose-400 hover:bg-rose-50/40 transition cursor-pointer"
                                          >
                                            <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-slate-100 border border-slate-200">
                                              {st.coverUrl && (
                                                <Image
                                                  src={st.coverUrl}
                                                  alt={st.title}
                                                  fill
                                                  unoptimized
                                                  className="object-cover"
                                                />
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                                                {st.title}
                                              </div>
                                              {authorName && (
                                                <div className="text-[11px] text-slate-500 truncate">
                                                  {authorName}
                                                </div>
                                              )}
                                            </div>
                                          </button>
                                        );
                                      }
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CHAPTER SELECTOR (Sau khi đã chọn truyện) */}
                        {reportTargetType === "CHAPTER" && pickedStory && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                              Chọn chương cần báo cáo trong truyện &quot;{pickedStory.title}&quot;
                            </label>
                            {chaptersPickerQuery.isPending ? (
                              <div className="text-xs text-slate-400 py-2">
                                Đang tải danh sách chương...
                              </div>
                            ) : (chaptersPickerQuery.data ?? []).length === 0 ? (
                              <div className="text-xs text-rose-600 py-2">
                                Truyện này hiện chưa có chương nào xuất bản.
                              </div>
                            ) : (
                              <select
                                required
                                value={pickedChapterId}
                                onChange={(e) =>
                                  setPickedChapterId(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-rose-500 focus:outline-none"
                              >
                                <option value="">
                                  -- Bấm để chọn chương truyện --
                                </option>
                                {(chaptersPickerQuery.data ?? []).map(
                                  (ch: any) => (
                                    <option key={ch._id} value={ch._id}>
                                      Chương {ch.chapterNumber}: {ch.title}
                                    </option>
                                  )
                                )}
                              </select>
                            )}
                          </div>
                        )}

                        {/* FORUM POST PICKER */}
                        {(reportTargetType === "FORUM_POST" ||
                          (reportTargetType === "COMMENT" &&
                            commentScope === "FORUM")) && (
                          <div className="space-y-2">
                            {pickedForumPost ? (
                              <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-white p-3.5 shadow-2xs">
                                <div className="min-w-0">
                                  <div className="text-[11px] font-bold uppercase text-rose-600">
                                    Đã chọn bài viết diễn đàn
                                  </div>
                                  <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                    {pickedForumPost.title}
                                  </div>
                                  {pickedForumPost.authorName && (
                                    <div className="text-[11px] text-slate-500">
                                      Đăng bởi: {pickedForumPost.authorName}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickedForumPost(null);
                                    setPickedComment(null);
                                  }}
                                  className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                  Đổi bài viết
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={forumSearchQuery}
                                  onChange={(e) =>
                                    setForumSearchQuery(e.target.value)
                                  }
                                  placeholder="Tìm theo tiêu đề bài viết hoặc tên người đăng..."
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-none"
                                />
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                  {forumPickerQuery.isPending ? (
                                    <div className="py-4 text-center text-xs text-slate-400">
                                      Đang tải bài viết diễn đàn...
                                    </div>
                                  ) : filteredForumOptions.length === 0 ? (
                                    <div className="py-4 text-center text-xs text-slate-400">
                                      Không tìm thấy bài viết diễn đàn phù hợp.
                                    </div>
                                  ) : (
                                    filteredForumOptions.map((p) => {
                                      const authorName =
                                        p.userId?.displayName ||
                                        p.userId?.username ||
                                        "Thành viên";
                                      return (
                                        <button
                                          key={p._id}
                                          type="button"
                                          onClick={() =>
                                            setPickedForumPost({
                                              _id: p._id,
                                              slug: p.slug,
                                              title: p.title,
                                              authorName,
                                            })
                                          }
                                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-rose-400 hover:bg-rose-50/40 transition cursor-pointer"
                                        >
                                          <div className="text-xs font-bold text-slate-900 line-clamp-1">
                                            {p.title}
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            Đăng bởi {authorName} ·{" "}
                                            {new Date(
                                              p.createdAt
                                            ).toLocaleDateString("vi-VN")}
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* COMMENT SELECTOR (Sau khi đã chọn Truyện hoặc Bài viết diễn đàn) */}
                        {reportTargetType === "COMMENT" &&
                          ((commentScope === "STORY" && pickedStory) ||
                            (commentScope === "FORUM" && pickedForumPost)) && (
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-700">
                                Chọn bình luận vi phạm bên dưới:
                              </label>
                              {pickedComment ? (
                                <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50/50 p-3.5">
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-bold text-rose-700">
                                      Bình luận của @{pickedComment.authorName}
                                    </div>
                                    <p className="text-xs text-slate-800 line-clamp-2 mt-0.5">
                                      &ldquo;{pickedComment.content}&rdquo;
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPickedComment(null)}
                                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Chọn lại
                                  </button>
                                </div>
                              ) : commentsPickerQuery.isPending ? (
                                <div className="py-3 text-xs text-slate-400">
                                  Đang tải danh sách bình luận...
                                </div>
                              ) : (commentsPickerQuery.data ?? []).length ===
                                0 ? (
                                <div className="py-3 text-xs text-slate-500">
                                  Chưa có bình luận công khai nào tại nội dung này.
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {(commentsPickerQuery.data ?? []).map(
                                    (cm: any) => {
                                      const cAuthor =
                                        cm.userId?.displayName ||
                                        cm.userId?.username ||
                                        "Người dùng";
                                      return (
                                        <button
                                          key={cm._id}
                                          type="button"
                                          onClick={() =>
                                            setPickedComment({
                                              _id: cm._id,
                                              content: cm.content,
                                              authorName: cAuthor,
                                            })
                                          }
                                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-left hover:border-rose-400 hover:bg-rose-50/40 transition cursor-pointer"
                                        >
                                          <div className="text-[11px] font-bold text-slate-700">
                                            {cAuthor}
                                          </div>
                                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                            {cm.content}
                                          </p>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* BƯỚC 3: PHÂN LOẠI VI PHẠM */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                      3. Chọn hành vi vi phạm
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {VIOLATION_OPTIONS_BY_TARGET[reportTargetType].map(
                        (opt) => {
                          const active = reportViolationId === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-start gap-2.5 rounded-2xl border p-3.5 cursor-pointer transition ${
                                active
                                  ? "border-rose-400 bg-rose-50/60 ring-1 ring-rose-300"
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="violationType"
                                checked={active}
                                onChange={() => setReportViolationId(opt.id)}
                                className="mt-1 h-4 w-4 accent-rose-600 shrink-0"
                              />
                              <div>
                                <div
                                  className={`text-xs font-bold ${
                                    active ? "text-rose-900" : "text-slate-800"
                                  }`}
                                >
                                  {opt.label}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {opt.desc}
                                </div>
                              </div>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* BƯỚC 4: MÔ TẢ CHI TIẾT */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      4. Mô tả chi tiết / Bằng chứng vi phạm{" "}
                      {reportViolationId === "other"
                        ? "(Bắt buộc)"
                        : "(Khuyến khích)"}
                    </label>
                    <textarea
                      rows={4}
                      required={reportViolationId === "other"}
                      maxLength={850}
                      value={reportReasonText}
                      onChange={(e) => setReportReasonText(e.target.value)}
                      placeholder="Ghi rõ đoạn văn vi phạm, nguồn tác phẩm gốc hoặc thông tin bổ sung giúp Ban quản trị xử lý nhanh..."
                      className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-800 focus:border-rose-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Danh tính người báo cáo được bảo mật tuyệt đối.
                    </span>
                    <Button
                      type="submit"
                      isLoading={submitReport.isPending}
                      disabled={submitReport.isPending}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Gửi báo cáo vi phạm
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Right 4 cols: Fast In-App Reporting Guide */}
            <aside className="lg:col-span-4 space-y-5">
              <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Mẹo báo cáo nhanh chỉ với 1 chạm
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  Ngay trong lúc đọc truyện hoặc thảo luận, bạn có thể bấm nút{" "}
                  <strong>Báo cáo</strong> tích hợp sẵn tại từng vị trí:
                </p>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                      1
                    </span>
                    <div>
                      <strong>Tại Diễn đàn:</strong> Nhấn biểu tượng lá cờ ở góc phải bài viết hoặc nút{" "}
                      <em>&quot;Báo cáo bài viết&quot;</em> ở trang chi tiết.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                      2
                    </span>
                    <div>
                      <strong>Tại Truyện & Chương đọc:</strong> Nhấn nút{" "}
                      <em>&quot;Báo cáo&quot;</em> trên đầu trang truyện hoặc ở cuối chương đang đọc.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                      3
                    </span>
                    <div>
                      <strong>Tại Bình luận:</strong> Nhấn nút{" "}
                      <em>&quot;Báo cáo&quot;</em> nằm ngay bên dưới nội dung bình luận đó.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Cam kết xử lý minh bạch
                </h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  • Toàn bộ báo cáo được chuyển thẳng tới hàng đợi kiểm duyệt của Quản trị viên (Admin / Manager).
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  • Nội dung vi phạm sẽ bị ẩn, từ chối duyệt hoặc gỡ bỏ; tài khoản tái phạm nhiều lần sẽ bị khóa quyền đăng bài hoặc khóa vĩnh viễn.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
