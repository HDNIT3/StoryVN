export interface DefaultTagItem {
  name: string;
  slug: string;
  isActive: boolean;
}

export const DEFAULT_TAGS_DATA: DefaultTagItem[] = [
  // Chủ đề / Mô típ cốt truyện
  { name: 'Xuyên Không', slug: 'xuyen-khong', isActive: true },
  { name: 'Trọng Sinh', slug: 'trong-sinh', isActive: true },
  { name: 'Hệ Thống', slug: 'he-thong', isActive: true },
  { name: 'Xuyên Sách', slug: 'xuyen-sach', isActive: true },
  { name: 'Bàn Tay Vàng', slug: 'ban-tay-vang', isActive: true },
  { name: 'Không Gian Tùy Thân', slug: 'khong-gian-tuy-than', isActive: true },
  { name: 'Linh Khí Khôi Phục', slug: 'linh-khi-khoi-phuc', isActive: true },
  { name: 'Thần Thoại Khôi Phục', slug: 'than-thoai-khoi-phuc', isActive: true },
  { name: 'Tận Thế Sinh Tồn', slug: 'tan-the-sinh-ton', isActive: true },
  { name: 'Gia Tộc Quản Lý', slug: 'gia-toc-quan-ly', isActive: true },
  { name: 'Livestream', slug: 'livestream', isActive: true },
  { name: 'Chế Tác Trò Chơi', slug: 'che-tac-tro-choi', isActive: true },
  { name: 'Minh Tinh Giới Giải Trí', slug: 'minh-tinh-gioi-giai-tri', isActive: true },
  { name: 'Thập Niên 70-80', slug: 'thap-nien-70-80', isActive: true },
  { name: 'Làm Giàu', slug: 'lam-giau', isActive: true },
  { name: 'Học Đường', slug: 'hoc-duong', isActive: true },

  // Tính cách & Phong cách nhân vật
  { name: 'Vô Địch', slug: 'vo-dich', isActive: true },
  { name: 'Cẩu Đạo', slug: 'cau-dao', isActive: true },
  { name: 'Sát Phạt Quyết Đoán', slug: 'sat-phat-quyet-doan', isActive: true },
  { name: 'Giả Heo Ăn Hổ', slug: 'gia-heo-an-ho', isActive: true },
  { name: 'Cơ Trí', slug: 'co-tri', isActive: true },
  { name: 'Phúc Hắc', slug: 'phuc-hac', isActive: true },
  { name: 'Lạnh Lùng', slug: 'lanh-lung', isActive: true },
  { name: 'Điềm Đạm', slug: 'diem-dam', isActive: true },
  { name: 'Hài Hước Bựa', slug: 'hai-huoc-bua', isActive: true },
  { name: 'Hắc Hóa', slug: 'hac-hoa', isActive: true },
  { name: 'Phản Phái', slug: 'phan-phai', isActive: true },
  { name: 'Nữ Cường', slug: 'nu-cuong', isActive: true },
  { name: 'Nữ Phụ', slug: 'nu-phu', isActive: true },
  { name: 'Pháo Hôi', slug: 'phao-hoi', isActive: true },
  { name: 'Ngạo Kiều', slug: 'ngao-kieu', isActive: true },
  { name: 'Độc Miệng', slug: 'doc-mieng', isActive: true },

  // Tình cảm & Quan hệ
  { name: 'Đơn Nữ Chính', slug: 'don-nu-chinh', isActive: true },
  { name: 'Hậu Cung', slug: 'hau-cung', isActive: true },
  { name: 'Không Nữ Chính', slug: 'khong-nu-chinh', isActive: true },
  { name: 'Sủng', slug: 'sung', isActive: true },
  { name: 'Ngọt Sủng', slug: 'ngot-sung', isActive: true },
  { name: 'Ngược', slug: 'nguoc', isActive: true },
  { name: 'Cưới Trước Yêu Sau', slug: 'cuoi-truoc-yeu-sau', isActive: true },
  { name: 'Gương Vỡ Lại Lành', slug: 'guong-vo-lai-lanh', isActive: true },
  { name: 'Thanh Mai Trúc Mã', slug: 'thanh-mai-truc-ma', isActive: true },
  { name: 'Niên Hạ', slug: 'nien-ha', isActive: true },
  { name: 'Niên Thượng', slug: 'nien-thuong', isActive: true },
  { name: 'Cường Cường', slug: 'cuong-cuong', isActive: true },
  { name: 'Dưỡng Thành', slug: 'duong-thanh', isActive: true },

  // Nghề nghiệp & Kỹ năng phụ trợ
  { name: 'Luyện Đan', slug: 'luyen-dan', isActive: true },
  { name: 'Luyện Khí', slug: 'luyen-khi', isActive: true },
  { name: 'Trận Pháp', slug: 'tran-phap', isActive: true },
  { name: 'Phù Triện', slug: 'phu-trien', isActive: true },
  { name: 'Ngự Thú', slug: 'ngu-thu', isActive: true },
  { name: 'Y Thuật', slug: 'y-thuat', isActive: true },
  { name: 'Mỹ Thực / Nấu Ăn', slug: 'my-thuc-nau-an', isActive: true },
  { name: 'Vong Linh Pháp Sư', slug: 'vong-linh-phap-su', isActive: true },
  { name: 'Kiếm Tu', slug: 'kiem-tu', isActive: true },
  { name: 'Thể Tu', slug: 'the-tu', isActive: true },

  // Tình tiết & Trải nghiệm
  { name: 'Vả Mặt', slug: 'va-mat', isActive: true },
  { name: 'Gia Đấu', slug: 'gia-dau', isActive: true },
  { name: 'Phá Án', slug: 'pha-an', isActive: true },
  { name: 'Thăng Cấp Lưu', slug: 'thang-cap-luu', isActive: true },
  { name: 'Kinh Doanh', slug: 'kinh-doanh', isActive: true },
  { name: 'Đi Đỉnh Cao', slug: 'di-dinh-cao', isActive: true },
];
