import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều Khoản Dịch Vụ | StoryVN",
  description: "Điều khoản và quy định sử dụng dịch vụ tại nền tảng đọc truyện StoryVN.",
};

export default function DieuKhoanDichVuPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80">
        <div className="border-b border-slate-100 pb-6 mb-8">
          <span className="inline-block text-xs font-bold tracking-wider uppercase text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-3">
            Quy tắc & Thỏa thuận
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Điều Khoản Dịch Vụ
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cập nhật lần cuối: Ngày 06 tháng 11 năm 2026 • Thỏa thuận sử dụng giữa độc giả và StoryVN
          </p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Chấp thuận điều khoản</h2>
            <p>
              Khi đăng ký, truy cập hoặc sử dụng bất kỳ tính năng nào của hệ thống StoryVN, bạn đồng ý tuân thủ đầy đủ các điều khoản và quy định được nêu tại trang này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Tài khoản và trách nhiệm người dùng</h2>
            <p>
              Người dùng có trách nhiệm tự bảo mật thông tin tài khoản và mật khẩu của mình. Bạn hoàn toàn chịu trách nhiệm cho mọi hoạt động diễn ra dưới tài khoản đã đăng ký. Bạn cam kết không thực hiện các hành vi sau:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
              <li>Đăng tải bình luận chứa ngôn từ thù địch, xúc phạm, đồi trụy hoặc vi phạm thuần phong mỹ tục.</li>
              <li>Sử dụng công cụ tự động (bot, crawler, scraper) quá tải gây ảnh hưởng đến hiệu năng hệ thống mà không có sự đồng ý bằng văn bản.</li>
              <li>Can thiệp hoặc tìm cách khai thác lỗ hổng bảo mật nhằm chiếm đoạt tài nguyên hay dữ liệu của người khác.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Cơ chế giao dịch Xu & Mở khóa chương truyện</h2>
            <p>
              Đơn vị tiền tệ ảo trên hệ thống (Xu) được sử dụng để đọc các chương truyện có khóa hoặc tặng thưởng cho tác giả. Hệ thống thanh toán nạp Xu hiện đang được tích hợp dưới hình thức thử nghiệm (Sandbox / Test). Chúng tôi bảo lưu quyền điều chỉnh bảng giá hoặc thu hồi tài nguyên nếu phát hiện gian lận kỹ thuật.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Quyền chấm dứt dịch vụ</h2>
            <p>
              StoryVN có quyền tạm ngưng hoặc xóa vĩnh viễn tài khoản của bất kỳ người dùng nào vi phạm nghiêm trọng các điều khoản dịch vụ mà không cần thông báo trước.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Sửa đổi điều khoản</h2>
            <p>
              Chúng tôi có thể sửa đổi nội dung điều khoản bất cứ lúc nào để phù hợp với định hướng phát triển phần mềm và yêu cầu kỹ thuật. Nội dung thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website.
            </p>
          </section>

          <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Ghi chú dự án môn học Trường ĐH Sư phạm Kỹ thuật TP.HCM:</p>
            <p>
              Dự án website đọc truyện được thực hiện bởi sinh viên Huỳnh Duy Nguyên và Huỳnh Duy Nguyễn - Khoa CNTT HCMUTE phục vụ mục đích kiểm thử đồ án phần mềm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

