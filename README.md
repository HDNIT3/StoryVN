# StoryVN

## Cấu trúc thư mục Backend (`backend/src/`)

```
backend/src/
├── common/             # Thành phần dùng chung toàn hệ thống
│   ├── enums/          # Bảng mã lỗi tập trung (ErrorCode)
│   ├── filters/        # Bắt lỗi và chuẩn hóa response (HttpExceptionFilter)
│   ├── guards/         # Giới hạn tần suất gọi API (RateLimitGuard)
│   └── utils/          # Hàm tiện ích mã hóa mật khẩu và mã OTP (hash.util)
│
├── database/           # Cấu hình kết nối cơ sở dữ liệu (MongoDB Mongoose)
│
└── modules/            # Các module nghiệp vụ chính
    ├── auth/           # Xác thực người dùng (Đăng ký, OTP...)
    │   ├── controllers/
    │   ├── dto/
    │   └── services/
    ├── users/          # Quản lý thông tin tài khoản người dùng
    │   ├── schemas/
    │   └── services/
    ├── mail/           # Dịch vụ gửi email thông báo, OTP (Gmail)
    └── redis/          # Dịch vụ cache dữ liệu và kiểm tra rate limit
```
