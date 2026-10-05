export interface DefaultGenreItem {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export const DEFAULT_GENRES_DATA: DefaultGenreItem[] = [
  {
    name: 'Tiên Hiệp',
    slug: 'tien-hiep',
    description: 'Tu tiên, luyện khí, trúc cơ, kết đan, độ kiếp phi thăng, truy cầu trường sinh bất lão.',
    isActive: true,
  },
  {
    name: 'Huyền Huyễn',
    slug: 'huyen-huyen',
    description: 'Thế giới huyền ảo, ma pháp, đấu khí, dị giới đại lục với các cấp bậc tu luyện kỳ bí.',
    isActive: true,
  },
  {
    name: 'Đô Thị',
    slug: 'do-thi',
    description: 'Bối cảnh hiện đại, thương trường hào môn, y thuật, võ thuật đô thị, siêu năng lực ẩn giấu.',
    isActive: true,
  },
  {
    name: 'Ngôn Tình',
    slug: 'ngon-tinh',
    description: 'Tình cảm lãng mạn, sâu lắng, ngọt ngào hoặc trắc trở giữa các nhân vật chính.',
    isActive: true,
  },
  {
    name: 'Kiếm Hiệp',
    slug: 'kiem-hiep',
    description: 'Giang hồ võ lâm truyền thống, hiệp nghĩa ân oán, môn phái chính tà tranh phong.',
    isActive: true,
  },
  {
    name: 'Khoa Huyễn',
    slug: 'khoa-huyen',
    description: 'Khoa học viễn tưởng, không gian vũ trụ, phi thuyền, cơ giáp, công nghệ siêu việt tương lai.',
    isActive: true,
  },
  {
    name: 'Võng Du',
    slug: 'vong-du',
    description: 'Thế giới game thực tế ảo, thể thao điện tử eSports, bang hội công thành chiến.',
    isActive: true,
  },
  {
    name: 'Dị Giới',
    slug: 'di-gioi',
    description: 'Chuyển sinh hoặc xuyên qua thế giới khác với hệ sinh thái, sinh vật và quy tắc dị biệt.',
    isActive: true,
  },
  {
    name: 'Linh Dị',
    slug: 'linh-di',
    description: 'Trừ tà, bắt ma, đạo sĩ, trinh thám kinh dị, các hiện tượng huyền bí tâm linh ly kỳ.',
    isActive: true,
  },
  {
    name: 'Trinh Thám',
    slug: 'trinh-tham',
    description: 'Phá án ly kỳ, suy luận logic sắc bén, điều tra hình sự, đấu trí với hung thủ thiên tài.',
    isActive: true,
  },
  {
    name: 'Lịch Sử',
    slug: 'lich-su',
    description: 'Bối cảnh triều đại phong kiến có thật hoặc giả tưởng, mưu lược cung đình và phát triển quốc gia.',
    isActive: true,
  },
  {
    name: 'Quân Sự',
    slug: 'quan-su',
    description: 'Chiến tranh sa trường, điều binh khiển tướng, mưu lược trận pháp và vũ khí chiến thuật.',
    isActive: true,
  },
  {
    name: 'Mạt Thế',
    slug: 'mat-the',
    description: 'Thế giới sau tận thế, zombie bùng phát, thời tiết khắc nghiệt, sinh tồn và tiến hóa năng lực.',
    isActive: true,
  },
  {
    name: 'Hài Hước',
    slug: 'hai-huoc',
    description: 'Phong cách tấu hài dí dỏm, giải trí nhẹ nhàng, tình huống oái oăm tạo tiếng cười sảng khoái.',
    isActive: true,
  },
  {
    name: 'Đồng Nhân',
    slug: 'dong-nhan',
    description: 'Phóng tác dựa trên thế giới, nhân vật có sẵn từ anime, manga, game hay tiểu thuyết nổi tiếng.',
    isActive: true,
  },
  {
    name: 'Cổ Đại',
    slug: 'co-dai',
    description: 'Bối cảnh xã hội cổ xưa phương Đông, lễ nghi phong kiến, triều đình và dân gian.',
    isActive: true,
  },
  {
    name: 'Điền Văn',
    slug: 'dien-van',
    description: 'Cuộc sống thôn quê êm đềm, làm nông, chăn nuôi, buôn bán nhỏ, xây dựng tổ ấm bình dị.',
    isActive: true,
  },
  {
    name: 'Cung Đấu',
    slug: 'cung-dau',
    description: 'Tranh quyền đoạt vị chốn hoàng cung, tranh sủng hậu phi, đấu trí thâm sâu hiểm độc.',
    isActive: true,
  },
  {
    name: 'Trạch Đấu',
    slug: 'trach-dau',
    description: 'Tranh đoạt lợi ích gia tộc, mâu thuẫn giữa thê thiếp, con trưởng thứ trong gia đình quý tộc.',
    isActive: true,
  },
  {
    name: 'Hào Môn Thế Gia',
    slug: 'hao-mon-the-gia',
    description: 'Thế gia vọng tộc hiện đại, gia tộc tài phiệt giàu có, ân oán tình thù giới thượng lưu.',
    isActive: true,
  },
  {
    name: 'Thanh Xuân Vườn Trường',
    slug: 'thanh-xuan-vuon-truong',
    description: 'Kỷ niệm tuổi học trò, mối tình đầu ngây thơ trong sáng, phấn đấu thi cử trưởng thành.',
    isActive: true,
  },
  {
    name: 'Đam Mỹ',
    slug: 'dam-my',
    description: 'Tiểu thuyết tình cảm giữa nam và nam, phong phú thể loại từ cổ trang đến hiện đại.',
    isActive: true,
  },
  {
    name: 'Bách Hợp',
    slug: 'bach-hop',
    description: 'Tiểu thuyết tình cảm giữa nữ và nữ, nhẹ nhàng, sâu lắng và tinh tế.',
    isActive: true,
  },
  {
    name: 'Kỳ Huyễn',
    slug: 'ky-huyen',
    description: 'Thế giới ma pháp phương Tây, kỵ sĩ, rồng, tinh linh, ma thú và thánh đường thần thoại.',
    isActive: true,
  },
  {
    name: 'Huyền Nghi',
    slug: 'huyen-nghi',
    description: 'Bí ẩn chưa có lời giải, không khí hồi hộp căng thẳng, khám phá những bí mật rùng rợn.',
    isActive: true,
  },
  {
    name: 'Đông Phương Huyền Huyễn',
    slug: 'dong-phuong-huyen-huyen',
    description: 'Huyền huyễn mang đậm màu sắc thần thoại phương Đông, thần thú thượng cổ, tông môn đại phái.',
    isActive: true,
  },
  {
    name: 'Tây Phương Huyễn Tưởng',
    slug: 'tay-phuong-huyen-tuong',
    description: 'Huyễn tưởng phong cách thần thoại Bắc Âu/Hy Lạp, pháp sư cấm chú, hiệp sĩ đền thánh.',
    isActive: true,
  },
  {
    name: 'Xuyên Nhanh',
    slug: 'xuyen-nhanh',
    description: 'Nhân vật chính liên tục xuyên qua nhiều thế giới nhỏ khác nhau để hoàn thành nhiệm vụ.',
    isActive: true,
  },
  {
    name: 'Vô Hạn Lưu',
    slug: 'vo-han-luu',
    description: 'Nhân vật bị cuốn vào không gian luân hồi, trải qua vô số phó bản sinh tử để tích điểm tiến hóa.',
    isActive: true,
  },
  {
    name: 'Mạo Hiểm',
    slug: 'mao-hiem',
    description: 'Hành trình thám hiểm hang động, di tích cổ mộ, săn lùng bảo vật tại những vùng đất chết.',
    isActive: true,
  },
  {
    name: 'Thể Thao',
    slug: 'the-thao',
    description: 'Đam mê tranh tài thể thao: bóng đá, bóng rổ, điền kinh, cờ vua... chinh phục đỉnh vinh quang.',
    isActive: true,
  },
  {
    name: 'Quan Trường',
    slug: 'quan-truong',
    description: 'Đấu trí chốn quan lộ, chính trị, từng bước thăng quan tiến chức phụng sự đất nước.',
    isActive: true,
  },
  {
    name: 'Tu Chân Văn Minh',
    slug: 'tu-chan-van-minh',
    description: 'Sự kết hợp giữa khoa học kỹ thuật hiện đại và văn minh tu tiên đạo pháp cao cấp.',
    isActive: true,
  },
  {
    name: 'Dị Năng',
    slug: 'di-nang',
    description: 'Con người thức tỉnh các siêu năng lực dị biệt: điều khiển lửa, lôi điện, không gian, thời gian.',
    isActive: true,
  },
  {
    name: 'Du Hí Dị Giới',
    slug: 'du-hi-di-gioi',
    description: 'Thế giới dị giới mang quy tắc như trò chơi, NPC thông minh, phụ bản nhiệm vụ phong phú.',
    isActive: true,
  },
  {
    name: 'Trùng Sinh Trả Thù',
    slug: 'trung-sinh-tra-thu',
    description: 'Kiếp trước bị hãm hại thê thảm, sống lại kiếp này vạch trần kẻ ác, đòi lại công bằng.',
    isActive: true,
  },
  {
    name: 'Cẩu Huyết',
    slug: 'cau-huyet',
    description: 'Nhiều tình huống drama kịch tính, hiểu lầm chồng chất, ân oán xoay vần nghẹt thở.',
    isActive: true,
  },
  {
    name: 'Chiến Thần',
    slug: 'chien-than',
    description: 'Nhân vật chính là vương giả sa trường, thống lĩnh vạn quân, trở về đô thị quấy đảo phong vân.',
    isActive: true,
  },
  {
    name: 'Tông Môn Xây Dựng',
    slug: 'tong-mon-xay-dung',
    description: 'Từ một tông môn đổ nát, nhân vật chính từng bước chiêu mộ đệ tử thiên tài, nâng tầm thánh địa.',
    isActive: true,
  },
  {
    name: 'Lãnh Chúa Xây Thành',
    slug: 'lanh-chua-xay-thanh',
    description: 'Lãnh chúa bắt đầu từ mảnh đất hoang tàn, khai hoang lập nghiệp, xây dựng đế chế hùng cường.',
    isActive: true,
  },
];
