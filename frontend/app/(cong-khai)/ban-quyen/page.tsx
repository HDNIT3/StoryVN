import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quy Định Bản Quyền | StoryVN",
  description: "Chính sách sở hữu trí tuệ và quy định bản quyền tại StoryVN.",
};

export default function BanQuyenPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <span className="inline-block text-xs font-bold tracking-wider uppercase text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-3">
            Sở Hữu Trí Tuệ
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chính Sách & Quy Định Bản Quyền
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cập nhật lần cuối: Ngày 06 tháng 11 năm 2026 • Bảo vệ tác quyền sáng tác & dịch thuật
          </p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Quyền tác giả và người dịch</h2>
            <p>
              Tất cả các tác phẩm truyện chữ, bài dịch, hình ảnh minh họa được đăng tải trên StoryVN thuộc quyền sở hữu trí tuệ của chính tác giả hoặc nhóm dịch tương ứng. StoryVN là nền tảng công nghệ cung cấp công cụ lưu trữ, hiển thị và kết nối độc giả với người sáng tác.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Quy định sao chép và phân phối</h2>
            <p>
              Nghiêm cấm mọi hành vi sao chép tự động (reup), phân phối lại hoặc thương mại hóa nội dung truyện từ StoryVN sang bất kỳ nền tảng nào khác khi chưa có sự cho phép chính thức bằng văn bản từ tác giả hoặc ban quản trị.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Cơ chế xử lý vi phạm bản quyền (DMCA)</h2>
            <p>
              StoryVN tôn trọng quyền sở hữu trí tuệ của mọi cá nhân, tổ chức và tuân thủ các nguyên tắc xử lý tranh chấp bản quyền:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li>Nếu bạn là chủ sở hữu quyền tác giả hợp pháp và nhận thấy tác phẩm của mình bị đăng tải trái phép, vui lòng gửi thông báo kèm bằng chứng sở hữu đến ban quản trị.</li>
              <li>Sau khi tiếp nhận và xác thực thông tin, ban quản trị sẽ gỡ bỏ hoặc tạm ẩn nội dung bị khiếu nại trong vòng 24 - 48 giờ làm việc.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Bản quyền giao diện và thương hiệu</h2>
            <p>
              Toàn bộ logo thương hiệu StoryVN, mã nguồn ứng dụng, phong cách thiết kế giao diện và cơ sở dữ liệu hệ thống thuộc quyền sáng tạo của đội ngũ phát triển.
            </p>
          </section>

          <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Thông tin dự án đồ án HCMUTE:</p>
            <p>
              Dự án website đọc truyện StoryVN do 2 sinh viên <strong>Huỳnh Duy Nguyên</strong> & <strong>Huỳnh Duy Nguyễn</strong> (Trường Đại học Sư phạm Kỹ thuật TP.HCM) thực hiện làm đồ án môn học. Các nội dung truyện thử nghiệm trên trang phục vụ thuần túy mục đích học tập và nghiên cứu công nghệ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

