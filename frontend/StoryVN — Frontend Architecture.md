# 📖 StoryVN — Frontend Architecture


## 1. Luồng dữ liệu thực tế (Đơn giản - Trực quan)

```text
┌────────────────────────────────────────────────────────┐
│                   LUỒNG DỮ LIỆU CHUẨN                  │
│                                                        │
│  Page (app/)                 → Điều phối route & URL   │
│       │                        (SEO bằng metadata)     │
│       ▼                                                │
│  Components (components/)    → Giao diện & Tương tác   │
│       │                                                │
│       ▼                                                │
│  Services (lib/services/)    → Hàm gọi API theo cụm    │
│       │                                                │
│       ▼                                                │
│  Axios Client (lib/api.ts)   → Tự động gắn Token       │
│       │                                                │
│       ▼                                                │
│  NestJS Backend API          → Trả về dữ liệu JSON     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Cấu trúc thư mục tinh gọn (Project Tree)

```text
frontend/
├── app/                                 # Next.js App Router (Quản lý Route & SEO URL)
│   ├── (cong-khai)/                     # [KHÁCH & ĐỘC GIẢ] Nhóm trang công khai (Chuẩn SEO)
│   │   ├── page.tsx                     # URL: / (Trang chủ - Banner, truyện mới, top xem)
│   │   ├── layout.tsx                   # Layout công khai (Header, Menu, Footer)
│   │   ├── truyen/
│   │   │   ├── page.tsx                 # URL: /truyen (Danh sách truyện + lọc + phân trang)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx             # URL: /truyen/[slug] (Chi tiết truyện - SEO Title/Desc)
│   │   │       └── [chapterSlug]/
│   │   │           └── page.tsx         # URL: /truyen/[slug]/[chapterSlug] (Đọc nội dung chương)
│   │   ├── the-loai/[slug]/page.tsx     # URL: /the-loai/[slug] (Xem truyện theo thể loại)
│   │   └── tim-kiem/page.tsx            # URL: /tim-kiem?q=... (Tìm kiếm truyện)
│   │
│   ├── (xac-thuc)/                      # [AUTH] Nhóm trang đăng nhập / đăng ký (Layout riêng tối giản)
│   │   ├── layout.tsx                   # Layout Auth (Khung card ở giữa màn hình)
│   │   ├── dang-nhap/page.tsx           # URL: /dang-nhap
│   │   └── dang-ky/page.tsx             # URL: /dang-ky
│   │
│   ├── (nguoi-dung)/                    # [ĐỘC GIẢ] Khu vực cá nhân (Cần đăng nhập)
│   │   └── tai-khoan/
│   │       ├── layout.tsx               # Layout cá nhân (Sidebar menu thông tin)
│   │       ├── ho-so/page.tsx           # URL: /tai-khoan/ho-so (Xem/sửa thông tin, avatar)
│   │       ├── tu-truyen/page.tsx       # URL: /tai-khoan/tu-truyen (Danh sách truyện đã theo dõi)
│   │       └── lich-su/page.tsx         # URL: /tai-khoan/lich-su (Lịch sử đọc truyện gần đây)
│   │
│   ├── (quan-tri)/                      # [ADMIN] Quản trị hệ thống (Gộp chung quản lý truyện & user)
│   │   └── quan-tri/
│   │       ├── layout.tsx               # Layout Admin (Sidebar quản trị chuyên biệt)
│   │       ├── page.tsx                 # URL: /quan-tri (Dashboard thống kê tổng quan)
│   │       ├── truyen/
│   │       │   ├── page.tsx             # URL: /quan-tri/truyen (Danh sách truyện, nút Thêm/Sửa/Xóa)
│   │       │   └── [id]/chuong/page.tsx # URL: /quan-tri/truyen/[id]/chuong (Quản lý các chương)
│   │       ├── the-loai/page.tsx        # URL: /quan-tri/the-loai (Thêm/sửa/xóa thể loại)
│   │       └── nguoi-dung/page.tsx      # URL: /quan-tri/nguoi-dung (Xem danh sách tài khoản, khóa/mở)
│   │
│   ├── layout.tsx                       # Root Layout (Gắn Font, AuthProvider, Toaster thông báo)
│   ├── globals.css                      # CSS toàn cục
│   ├── not-found.tsx                    # Trang 404 khi không tìm thấy truyện/trang
│   └── error.tsx                        # Trang hiển thị khi có lỗi bất ngờ
│
├── components/                          # UI Components tái sử dụng (Chia theo chức năng)
│   ├── ui/                              # Thành phần cơ bản: Button, Input, Modal, Pagination, LoadingSpinner
│   ├── layout/                          # Header, Footer, Navbar, AdminSidebar
│   ├── story/                           # StoryCard (Thẻ truyện), StoryList, StoryFilter (Bộ lọc)
│   ├── chapter/                         # ChapterReader (Nội dung đọc), ChapterNav (Chuyển chương trước/sau)
│   └── admin/                           # StoryTable, ChapterTable, ConfirmDeleteModal
│
├── lib/                                 # Lõi xử lý logic & kết nối backend
│   ├── api.ts                           # Axios Client: Cấu hình baseURL, tự động gắn Token vào Header
│   ├── services/                        # Gom các hàm gọi API REST theo từng nhóm tính năng
│   │   ├── auth.service.ts              # login, register, getMe, logout
│   │   ├── story.service.ts             # getStories, getStoryBySlug, getChapter, getGenres, search
│   │   ├── user.service.ts              # getProfile, updateProfile, getBookmarks, getReadingHistory
│   │   └── admin.service.ts             # CRUD truyện, thêm chương, quản lý thể loại, quản lý user
│   └── utils/                           # Hàm tiện ích đơn giản, thực tế
│       ├── format.ts                    # Format ngày tháng (DD/MM/YYYY) & số lượt xem (1.5K, 2M)
│       └── slugify.ts                   # Chuyển tiêu đề tiếng Việt có dấu thành URL không dấu chuẩn SEO
│
├── hooks/                               # Custom Hooks tiện ích
│   ├── useAuth.ts                       # Hook lấy thông tin user đăng nhập, kiểm tra nhanh isAdmin
│   └── useDebounce.ts                   # Trì hoãn gửi request khi gõ tìm kiếm (chống spam API)
│
├── context/                             # React Context
│   └── AuthContext.tsx                  # Lưu user hiện tại vào state toàn trang web sau khi đăng nhập
│
├── types/                               # Khai báo kiểu TypeScript rõ ràng, ngắn gọn
│   ├── auth.ts                          # Kiểu User, Role ('USER' | 'ADMIN'), LoginResponse
│   ├── story.ts                         # Kiểu Story, Chapter, Genre
│   └── api.ts                           # Kiểu ApiResponse<T>, PaginatedResponse<T>
│
├── middleware.ts                        # Next.js Middleware: Chặn người chưa đăng nhập & chặn vào /quan-tri
└── public/                              # Hình ảnh logo, icon, ảnh bìa mặc định
```

---

