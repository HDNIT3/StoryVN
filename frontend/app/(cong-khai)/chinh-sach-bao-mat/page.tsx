import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật | StoryVN",
  description: "Chính sách bảo mật thông tin người dùng tại StoryVN.",
};

export default function ChinhSachBaoMatPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <span className="inline-block text-xs font-bold tracking-wider uppercase text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-3">
            Pháp lý & Quy định
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chính Sách Bảo Mật
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cập nhật lần cuối: Ngày 06 tháng 11 năm 2026 • Áp dụng cho toàn bộ độc giả và tác giả tại StoryVN
          </p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Mục đích thu thập thông tin cá nhân</h2>
            <p>
              StoryVN thu thập thông tin của bạn khi bạn đăng ký tài khoản, gửi bình luận, đánh giá hoặc giao dịch nạp Xu. Các thông tin thu thập bao gồm: tên hiển thị, tên đăng nhập, địa chỉ email và lịch sử tương tác trên hệ thống. Mục đích nhằm:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li>Cung cấp và duy trì trải nghiệm đọc truyện cá nhân hóa (đánh dấu chương, tủ truyện, lịch sử đọc).</li>
              <li>Xác thực tài khoản và gửi mã xác thực bảo mật OTP qua hòm thư điện tử.</li>
              <li>Hỗ trợ xử lý thắc mắc, phản hồi và giao dịch nạp Xu bản quyền.</li>
              <li>Phát hiện, ngăn chặn các hành vi gian lận hoặc phá hoại nền tảng.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Phạm vi sử dụng thông tin</h2>
            <p>
              Thông tin người dùng chỉ được sử dụng trong phạm vi nội bộ hệ thống StoryVN. Chúng tôi cam kết tuyệt đối không bán, chia sẻ hoặc trao đổi thông tin cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại khi chưa có sự đồng ý của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Lưu trữ và bảo mật dữ liệu</h2>
            <p>
              Mật khẩu tài khoản của bạn được mã hóa an toàn bằng thuật toán băm tiêu chuẩn công nghiệp (Bcrypt/Argon2) trước khi lưu vào cơ sở dữ liệu. Chúng tôi áp dụng các giải pháp kỹ thuật tiên tiến cùng chứng chỉ mã hóa SSL/TLS để bảo vệ dữ liệu người dùng khi truyền tải trên Internet.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Sử dụng Cookie</h2>
            <p>
              StoryVN sử dụng cookie và các công nghệ lưu trữ cục bộ (Local Storage) nhằm ghi nhớ phiên đăng nhập, tùy chỉnh cỡ chữ, màu nền đọc truyện và phân tích lưu lượng truy cập nhằm nâng cao chất lượng dịch vụ. Bạn có thể chủ động xóa hoặc từ chối cookie qua cài đặt trình duyệt của mình.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Quyền của người dùng đối với dữ liệu cá nhân</h2>
            <p>
              Bạn có quyền kiểm tra, cập nhật hoặc yêu cầu xóa bỏ thông tin cá nhân của mình bất kỳ lúc nào bằng cách truy cập trang quản lý hồ sơ cá nhân hoặc gửi yêu cầu trực tiếp đến đội ngũ phát triển đồ án StoryVN.
            </p>
          </section>

          <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Đồ án tốt nghiệp / môn học CNTT - ĐH SPKT TP.HCM (HCMUTE):</p>
            <p>
              Website được xây dựng phục vụ mục đích nghiên cứu học tập bởi nhóm sinh viên Huỳnh Duy Nguyên & Huỳnh Duy Nguyễn. Mọi thông tin mô phỏng không có giá trị thu thập dữ liệu trái phép.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

